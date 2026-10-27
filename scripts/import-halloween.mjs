// node scripts/import-halloween.mjs <map-met-de-tien-pngs> [--apply]
// Alleen concepten: de ContentWrite-API ondersteunt publiceren bewust niet.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join, basename } from 'node:path'
import { parseEnv, isDeepStrictEqual } from 'node:util'
import assert from 'node:assert/strict'
import sharp from 'sharp'

const input = process.argv[2]
assert(input && !input.startsWith('--'), 'Geef de map met de tien PNG-afbeeldingen op')
const imageDir = resolve(input)
const planPath = 'content/halloween/recipes.json'
const recipes = JSON.parse(readFileSync(planPath, 'utf8'))
const env = parseEnv(readFileSync('.env', 'utf8').replace(/^\uFEFF/, ''))
const base = env.CENTAUR_API_BASE.replace(/\/$/, '')
const apiKey = env.CENTAUR_WRITE_KEY
assert(apiKey, 'CENTAUR_WRITE_KEY ontbreekt')
const apply = process.argv.includes('--apply')
const resultsPath = 'output/halloween-2026/import-resultaten.json'
mkdirSync('output/halloween-2026', { recursive: true })
const results = existsSync(resultsPath) ? JSON.parse(readFileSync(resultsPath, 'utf8')) : []
const save = () => writeFileSync(resultsPath, JSON.stringify(results, null, 2) + '\n')
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
async function request(path, options = {}) {
  for (let i = 0; i < 5; i++) {
    const response = await fetch(base + path, { ...options, headers: { 'X-Api-Key': apiKey, ...options.headers }, signal: AbortSignal.timeout(30000) })
    if (response.status === 429) { await pause(15000); continue }
    if (!response.ok) throw new Error(`Centaur ${options.method || 'GET'} ${path}: ${response.status}`)
    return response.json()
  }
  throw new Error('API blijft begrenzen; hervat later')
}
assert.equal(recipes.length, 10)
assert.equal(new Set(recipes.map(r => r.data.slug)).size, 10)
const entries = await request('/api/manage/collections/recepten/entries')
for (const recipe of recipes) {
  assert.equal(basename(recipe.sourceImage), recipe.sourceImage)
  const filename = join(imageDir, recipe.sourceImage)
  assert(existsSync(filename), `Foto ontbreekt: ${recipe.sourceImage}`)
  const metadata = await sharp(filename).metadata()
  assert(metadata.width >= 1200 && Math.abs(metadata.width / metadata.height - 16 / 9) < .02, recipe.sourceImage)
  assert(recipe.data.tags.split(',').some(t => t.trim() === 'Halloween'))
  assert.equal(recipe.data.bereiding.length, 4)
  assert(recipe.data.meta_titel.length + 18 <= 68)
  assert(recipe.data.meta_omschrijving.length <= 160)
}
console.log('Alle tien recepten, fotoverhoudingen en SEO-velden gecontroleerd.')
if (!apply) process.exit(0)

for (const recipe of recipes) {
  const existing = entries.find(e => e.data.slug === recipe.data.slug)
  if (existing) {
    assert(isDeepStrictEqual(existing.data, recipe.data), `Bestaand recept wijkt af; niet overschrijven: ${recipe.data.slug}`)
    console.log('Bestaat al:', recipe.data.slug)
    continue
  }
  let result = results.find(r => r.slug === recipe.data.slug)
  if (!result) { result = { slug: recipe.data.slug }; results.push(result) }
  if (!result.imageUrl) {
    // Houd de volledige 16:9-compositie; alleen efficiënter coderen, niet bijsnijden.
    const bytes = await sharp(join(imageDir, recipe.sourceImage)).webp({ quality: 86 }).toBuffer()
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: 'image/webp' }), recipe.data.slug + '.webp')
    form.append('alt', recipe.data.afbeelding_alt)
    const media = await request('/api/manage/media', { method: 'POST', body: form })
    result.imageUrl = media.url
    save()
    await pause(1300)
  }
  recipe.data.afbeelding = result.imageUrl
  writeFileSync(planPath, JSON.stringify(recipes, null, 2) + '\n')
  const entry = await request('/api/manage/collections/recepten/entries', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: recipe.data })
  })
  assert.equal(entry.status, 'draft')
  result.id = entry.id
  result.status = entry.status
  save()
  console.log('Concept met foto aangemaakt:', recipe.data.titel)
  await pause(1300)
}
const saved = await request('/api/manage/collections/recepten/entries')
for (const recipe of recipes) {
  const entry = saved.find(e => e.data.slug === recipe.data.slug)
  assert(entry && isDeepStrictEqual(entry.data, recipe.data), `Terugleescontrole: ${recipe.data.slug}`)
}
console.log('Alle tien conceptrecepten volledig teruggelezen uit Centaur.')
