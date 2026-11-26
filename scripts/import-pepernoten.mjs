// Valideert de reeks; --apply zet nieuwe recepten met beelden als concept in Centaur.
// node scripts/import-pepernoten.mjs [--apply]
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { parseEnv, isDeepStrictEqual } from 'node:util'
import sharp from 'sharp'

const directory = 'output/pepernoten-2026'
const planPath = 'content/pepernoten/recipes.json'
const journalPath = join(directory, 'import-resultaten.json')
const plan = JSON.parse(readFileSync(planPath, 'utf8'))
const env = parseEnv(readFileSync('.env', 'utf8').replace(/^\uFEFF/, ''))
assert(env.CENTAUR_API_BASE && env.CENTAUR_WRITE_KEY, 'Centaur-configuratie ontbreekt')
const base = env.CENTAUR_API_BASE.replace(/\/$/, '')
const apply = process.argv.includes('--apply')
mkdirSync(directory, { recursive: true })
const journal = existsSync(journalPath) ? JSON.parse(readFileSync(journalPath, 'utf8')) : []
const save = () => {
  writeFileSync(journalPath, JSON.stringify(journal, null, 2) + '\n')
  writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n')
}
async function request(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: { 'X-Api-Key': env.CENTAUR_WRITE_KEY, ...options.headers },
    signal: AbortSignal.timeout(30000)
  })
  // Geen blinde retries op schrijfacties: lees bij hervatten eerst de opgeslagen data terug.
  if (!response.ok) throw new Error(`Centaur ${options.method || 'GET'} ${path}: ${response.status}`)
  return response.json()
}
assert.equal(plan.length, 10)
assert.equal(new Set(plan.map(r => r.data.slug)).size, 10)
for (const { sourceImage, data } of plan) {
  assert.equal(basename(sourceImage), sourceImage)
  const metadata = await sharp(join(directory, 'bronafbeeldingen', sourceImage)).metadata()
  assert(metadata.width >= 1200 && metadata.height >= 900, `Te klein: ${sourceImage}`)
  assert(data.tags.split(',').map(t => t.trim()).includes('pepernoten'))
  assert.equal(data.personen, 70)
  assert.equal(data.portie_eenheid, 'stuks')
  assert(data.ingredienten.length >= 6 && data.bereiding.length >= 5)
  assert(data.ingredienten.every(i => i.ingredient && (i.hoeveelheid === null || Number.isFinite(i.hoeveelheid))))
  assert(data.meta_omschrijving.length <= 160)
}
const [entries, cuisines] = await Promise.all([
  request('/api/manage/collections/recepten/entries'),
  request('/api/manage/collections/keukens/entries')
])
const cuisine = cuisines.find(e => e.data.slug === 'nederlands')
assert(cuisine, 'Nederlandse keuken ontbreekt')
for (const recipe of plan) {
  recipe.data.keuken = [cuisine.id]
  const matches = entries.filter(e => e.data.slug === recipe.data.slug)
  assert(matches.length <= 1, `Dubbele bestaande slug: ${recipe.data.slug}`)
  if (matches.length) assert(isDeepStrictEqual(matches[0].data, recipe.data), `Bestaand recept wijkt af; niet overschrijven: ${recipe.data.slug}`)
}
console.log('Tien recepten, hoeveelheden, SEO-velden en afbeeldingen gevalideerd.')
if (!apply) process.exit(0)
save()
for (const recipe of plan) {
  if (entries.some(e => e.data.slug === recipe.data.slug)) {
    console.log('Bestaat al; ongewijzigd:', recipe.data.slug)
    continue
  }
  let result = journal.find(r => r.slug === recipe.data.slug)
  if (!result) { result = { slug: recipe.data.slug }; journal.push(result); save() }
  if (!result.imageUrl) {
    const bytes = await sharp(join(directory, 'bronafbeeldingen', recipe.sourceImage)).webp({ quality: 86 }).toBuffer()
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: 'image/webp' }), recipe.data.slug + '.webp')
    form.append('alt', recipe.data.afbeelding_alt)
    const media = await request('/api/manage/media', { method: 'POST', body: form })
    assert(typeof media.url === 'string' && media.url.startsWith('https://'), 'Geen geldige media-URL teruggekregen')
    result.imageUrl = media.url
    save()
  }
  recipe.data.afbeelding = result.imageUrl
  save()
  const entry = await request('/api/manage/collections/recepten/entries', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: recipe.data })
  })
  assert.equal(entry.status, 'draft')
  result.id = entry.id
  result.status = entry.status
  save()
  console.log('Concept opgeslagen:', recipe.data.titel)
}
const saved = await request('/api/manage/collections/recepten/entries')
for (const recipe of plan) {
  const entry = saved.find(e => e.data.slug === recipe.data.slug)
  assert(entry && isDeepStrictEqual(entry.data, recipe.data), `Terugleescontrole mislukt: ${recipe.data.slug}`)
}
console.log('Alle tien concepten volledig teruggelezen. Niets gepubliceerd.')
