import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs'
import { parseEnv, isDeepStrictEqual } from 'node:util'
import assert from 'node:assert/strict'

const prefix = 'output/seo/alle-recepten-2026-10-26'
const rows = readFileSync(`${prefix}.tsv`, 'utf8').trim().split('\n').slice(1).map(line => {
  const fields = line.split('\t')
  assert.equal(fields.length, 3)
  return { slug: fields[0], meta_titel: fields[1], meta_omschrijving: fields[2] }
})
const env = parseEnv(readFileSync('.env', 'utf8').replace(/^\uFEFF/, ''))
const api = env.CENTAUR_API_BASE.replace(/\/$/, '') + '/api/manage/collections/recepten/entries'
const headers = { 'X-Api-Key': env.CENTAUR_WRITE_KEY, 'Content-Type': 'application/json' }
const apply = process.argv.includes('--apply')
const verifyLive = process.argv.includes('--verify-live')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function request(path, options = {}) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await fetch(path, { headers, ...options, signal: AbortSignal.timeout(20000) })
    if (r.status === 429) {
      const retry = Number(r.headers.get('Retry-After'))
      console.log('API-limiet: even wachten')
      await sleep(Math.min(60000, Math.max(15000, (retry || 15) * 1000)))
      continue
    }
    if (!r.ok) throw new Error(`CMS ${options.method || 'GET'}: ${r.status}; stop om ongewenste overschrijvingen te voorkomen`)
    return r.json()
  }
  throw new Error('API blijft begrenzen; hervat dit script later')
}
const entries = await request(api)
const published = entries.filter(e => e.status === 'published')
assert.equal(rows.length, published.length, 'Alle gepubliceerde recepten moeten in het plan staan')
const slugs = new Set(), titles = new Set(), descriptions = new Set()
for (const row of rows) {
  assert(!slugs.has(row.slug), `Dubbele slug: ${row.slug}`)
  slugs.add(row.slug)
  assert.equal(published.filter(e => e.data.slug === row.slug).length, 1, row.slug)
  const title = row.meta_titel.trim().normalize('NFC').toLowerCase()
  const desc = row.meta_omschrijving.trim().normalize('NFC').toLowerCase()
  assert(!titles.has(title), `Dubbele titel: ${row.slug}`)
  assert(!descriptions.has(desc), `Dubbele omschrijving: ${row.slug}`)
  titles.add(title); descriptions.add(desc)
  // Editorial budgets, not hard Google limits; the website appends its brand suffix.
  assert(row.meta_titel.length + " | Steva's Kookboek".length <= 68, `Lange titel: ${row.slug}`)
  assert(row.meta_omschrijving.length >= 90 && row.meta_omschrijving.length <= 160, `Omschrijvinglengte: ${row.slug}`)
  assert(!/[<>\r\n]/.test(row.meta_titel + row.meta_omschrijving))
}

function withoutMetadata(data) {
  const { meta_titel, meta_omschrijving, ...rest } = data
  return rest
}
let original = published
if (apply) {
  if (existsSync(`${prefix}-backup.json`)) {
    original = JSON.parse(readFileSync(`${prefix}-backup.json`, 'utf8'))
    assert.equal(original.length, published.length)
  } else {
    writeFileSync(`${prefix}-backup.json`, JSON.stringify(published, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
    writeFileSync(`${prefix}-journal.jsonl`, '', { flag: 'wx', mode: 0o600 })
  }
}
const plan = rows.map(row => {
  const entry = published.find(e => e.data.slug === row.slug)
  const before = original.find(e => e.id === entry.id)
  assert(before, 'Entry ontbreekt in backup')
  assert(isDeepStrictEqual(withoutMetadata(entry.data), withoutMetadata(before.data)), `Andere receptvelden gewijzigd: ${row.slug}`)
  return { row, entry, before, data: { ...entry.data, meta_titel: row.meta_titel, meta_omschrijving: row.meta_omschrijving } }
})
const changed = plan.filter(p => !isDeepStrictEqual(p.entry.data, p.data))
console.log(`Plan gecontroleerd: ${rows.length} unieke titels en omschrijvingen; ${changed.length} resterende updates.`)
if (apply) {
  for (let i = 0; i < plan.length; i++) {
    const { entry, row, data } = plan[i]
    if (!isDeepStrictEqual(entry.data, data)) {
      await request(`${api}/${entry.id}`, {
        method: 'PUT', body: JSON.stringify({ entry: { data }, expectedUpdatedAt: entry.updatedAt })
      })
      appendFileSync(`${prefix}-journal.jsonl`, JSON.stringify({ id: entry.id, slug: row.slug, at: new Date().toISOString() }) + '\n')
      await sleep(1300)
    }
    if ((i + 1) % 10 === 0 || i === plan.length - 1) console.log(`Opgeslagen: ${i + 1}/${plan.length}`)
  }
  const saved = await request(api)
  for (const { entry, data } of plan) {
    const current = saved.find(e => e.id === entry.id)
    assert.equal(current.status, entry.status)
    assert(isDeepStrictEqual(current.data, data), `Terugleescontrole: ${entry.data.slug}`)
  }
  for (const before of entries.filter(e => e.status !== 'published')) {
    assert(isDeepStrictEqual(saved.find(e => e.id === before.id), before), 'Een concept is gewijzigd tijdens de uitvoering')
  }
  console.log('Alle 164 CMS-records teruggelezen; alleen de twee SEO-velden gewijzigd. Concepten ongewijzigd.')
}

const report = [
  '# Alle receptmetadata — 26 oktober 2026', '',
  `Alle ${rows.length} gepubliceerde recepten hebben een individueel beoordeelde SEO-titel en metabeschrijving.`, '',
  'De teksten zijn gebaseerd op de bestaande ingrediënten, bereiding en gerechtnaam. Geen verzonnen zoekvolumes, gezondheidsclaims, ongetoetste dieetlabels of beloftes over Google-posities. Ontbrekende metadata is aangevuld. Bestaande onjuiste tijds- en methodeclaims zijn vervangen door inhoudelijke kenmerken.', '',
  'Alleen `meta_titel` en `meta_omschrijving` zijn bijgewerkt. Receptnamen op de pagina, URL’s, intro’s, ingrediënten, bereidingswijzen, FAQ’s en publicatiestatus zijn behouden.', '',
  'Titels zijn uniek en houden rekening met de merknaam die de website toevoegt. Beschrijvingen zijn uniek en 90–160 tekens. Dit zijn redactionele richtlijnen; Google hanteert geen vaste tekenlimiet en kan eigen snippets tonen.', '',
  '## Bronnen', '',
  '- https://developers.google.com/search/docs/appearance/title-link',
  '- https://developers.google.com/search/docs/appearance/snippet', '',
  '## Metadata per recept', '',
  '| Recept | SEO-titel | Metabeschrijving |', '|---|---|---|',
  ...plan.map(({ row, entry }) => `| [${entry.data.titel}](https://www.stevaskookboek.nl/recepten/${row.slug}) | ${row.meta_titel} | ${row.meta_omschrijving} |`), '',
  apply ? 'Alle wijzigingen zijn opgeslagen en volledig teruggelezen uit Centaur. De oorspronkelijke gepubliceerde records staan in de JSON-backup.' : 'Controleversie: nog geen CMS-wijzigingen in deze uitvoering.', ''
]
writeFileSync(`${prefix}.md`, report.join('\n'))
writeFileSync(`${prefix}-plan.json`, JSON.stringify(rows, null, 2) + '\n')

if (verifyLive) {
  const results = []
  const decode = s => s.replace(/&quot;/g, '"').replace(/&#(?:39|x27);|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i], url = 'https://www.stevaskookboek.nl/recepten/' + row.slug
    let verified = false
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await fetch(url, { signal: AbortSignal.timeout(30000) })
      const html = await r.text()
      const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
      const tags = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0])
      const tag = tags.find(t => /\bname=["']description["']/i.test(t)) || ''
      const description = decode(tag.match(/\bcontent="([^"]*)"/i)?.[1] || '')
      if (r.status === 200 && title.startsWith(row.meta_titel + ' |') && description === row.meta_omschrijving) {
        results.push({ slug: row.slug, status: r.status, title, description, verifiedAt: new Date().toISOString() })
        verified = true; break
      }
      await sleep(5000)
    }
    if (!verified) results.push({ slug: row.slug, error: 'Nieuwe metadata nog niet zichtbaar of pagina onbereikbaar' })
    await sleep(450)
    if ((i + 1) % 20 === 0 || i === rows.length - 1) console.log(`Live gecontroleerd: ${i + 1}/${rows.length}`)
  }
  writeFileSync(`${prefix}-livecontrole.json`, JSON.stringify(results, null, 2) + '\n')
  const errors = results.filter(r => r.error)
  assert.equal(errors.length, 0, JSON.stringify(errors))
  appendFileSync(`${prefix}.md`, '\n## Livecontrole\n\nAlle 164 receptpagina’s geven HTTP 200 en tonen de verwachte SEO-titel en metabeschrijving. Details staan in het livecontrole-JSON-bestand.\n')
  console.log('Alle 164 pagina’s tonen de nieuwe metadata live.')
}
