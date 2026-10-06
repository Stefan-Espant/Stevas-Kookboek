import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { parseEnv } from 'node:util'
import { compile } from 'sass'
import { defineAdapter, defineConfig, vercelAdapter } from '@waldjs/cli'
import { getAllRecipes, recipePath } from './src/lib/recipes'
import { siteUrl } from './src/lib/site'

// Alle gebouwde pagina's (…/index.html) als URL-paden, behalve pagina's met noindex (404).
// Zo komen nieuwe pagina's — recepten, keukens, overzichten — vanzelf in de sitemap.
function builtPaths(dir: string, base = ''): string[] {
  const paths: string[] = []
  for (const entry of readdirSync(join(dir, base), { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue
    paths.push(...builtPaths(dir, join(base, entry.name)))
  }
  const page = join(dir, base, 'index.html')
  if (existsSync(page) && !/<meta name="robots" content="noindex/.test(readFileSync(page, 'utf8'))) {
    paths.unshift('/' + base.split(/[\\/]/).filter(Boolean).join('/'))
  }
  return paths
}

// Byzantium-fundament: tokens (--byz-*), reset, focus-ring, byz-sr-only en grid-utilities.
// WaldJS heeft geen globale CSS-pipeline, dus de SCSS-export van Byzantium wordt hier
// (bij elke `wald grow`/`wald build`) naar public/vendor/ gecompileerd. De component-CSS
// uit dist/ is Vue-scoped ([data-v-…]) en daardoor onbruikbaar zonder Vue.
const byzantiumStyles = createRequire(join(process.cwd(), 'package.json')).resolve('@byzantium-design-system/core/styles')
mkdirSync('public/vendor', { recursive: true })
writeFileSync('public/vendor/byzantium.css', compile(byzantiumStyles, { style: 'compressed' }).css)

// GSAP (+ ScrollTrigger) voor de animaties in public/motion.js: als losse bestanden naast de
// site, zodat ze gecachet worden en alleen geladen als de pagina beweging toont.
const gsapDir = join(dirname(createRequire(join(process.cwd(), 'package.json')).resolve('gsap/package.json')), 'dist')
for (const file of ['gsap.min.js', 'ScrollTrigger.min.js']) copyFileSync(join(gsapDir, file), join('public/vendor', file))

// Lokaal staan de Centaur-gegevens in .env; op Vercel komen ze uit de project-env vars
// (die winnen, vandaar ??=). BOM strippen: sommige editors zetten er een voor, en dan
// heet de eerste variabele ineens "﻿CENTAUR_API_BASE".
if (existsSync('.env')) {
  const env = parseEnv(readFileSync('.env', 'utf8').replace(/^﻿/, ''))
  for (const [key, value] of Object.entries(env)) process.env[key] ??= value
}

// vercelAdapter() + wat Nuxt/Nitro eerder runtime deed: een echte 404-pagina en
// /sitemap.xml + /robots.txt. Die worden nu bij elke build opnieuw gegenereerd — een
// wijziging in Centaur triggert via de Vercel deploy hook een nieuwe build.
function kookboekAdapter() {
  const vercel = vercelAdapter()
  return defineAdapter({
    ...vercel,
    name: 'vercel-kookboek',
    async adapt(context) {
      await vercel.adapt?.(context)
      const { outDir, rootDir } = context

      const notFoundPage = join(outDir, '404', 'index.html')
      if (existsSync(notFoundPage)) copyFileSync(notFoundPage, join(outDir, '404.html'))

      const configPath = join(rootDir, '.vercel', 'output', 'config.json')
      const vercelConfig = JSON.parse(readFileSync(configPath, 'utf8'))
      // Recepten stonden vroeger als losse pagina op /<slug>; nu op /recepten/<slug>. Permanente
      // redirect, zodat oude links en zoekresultaten blijven werken.
      const recipes = await getAllRecipes()
      vercelConfig.routes = [
        // Eén URL per pagina: /recepten/ en /recepten zouden anders allebei werken (dubbele content).
        // De canonical is zonder slash, dus daar ook naartoe.
        { src: '^/(.+)/$', status: 308, headers: { Location: '/$1' } },
        ...recipes
          .filter(recipe => !existsSync(join(outDir, recipe.slug))) // nooit een echte pagina/map overschrijven
          .map(recipe => ({ src: `/${recipe.slug}/?`, status: 301, headers: { Location: recipePath(recipe.slug) } })),
        { handle: 'filesystem' },
        { src: '/(.*)', status: 404, dest: '/404.html' }
      ]
      writeFileSync(configPath, JSON.stringify(vercelConfig, null, 2) + '\n')

      const origin = siteUrl()
      if (!origin) console.warn('⚠ SITE_URL ontbreekt: sitemap.xml, canonical en og:url bevatten relatieve URL\'s.')
      // lastmod: wijzigdatum per recept; de homepage en overzichten veranderen mee met het nieuwste recept.
      const modified = new Map(recipes.map(recipe => [recipePath(recipe.slug), recipe.updatedAt.slice(0, 10)]))
      const newest = recipes[0]?.updatedAt.slice(0, 10)
      const paths = builtPaths(outDir).sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b))
      writeFileSync(join(outDir, 'sitemap.xml'), [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...paths.map(path => {
          const lastmod = modified.get(path) ?? newest
          return `  <url><loc>${origin}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`
        }),
        '</urlset>',
        ''
      ].join('\n'))
      writeFileSync(
        join(outDir, 'robots.txt'),
        `User-agent: *\nAllow: /\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''}`
      )
    }
  })
}

export default defineConfig({
  adapter: kookboekAdapter()
})
