// 1. Velden van de Centaur-collectie "recepten" instellen volgens docs/centaur-collecties.md.
// 2. Daarna (optioneel, met een eigen bevestiging) alle concepten in "keukens" en "recepten"
//    in één keer publiceren.
//
// Gebruik: log in op het Centaur-dashboard (als Admin), open de browserconsole
// (Chrome: Cmd+Option+J), plak dit hele bestand en druk op Enter.
// Het script gebruikt je bestaande dashboard-sessie (localStorage "centaur_token");
// je login gaat nergens anders heen dan naar de Centaur-API.
//
// Veilig:
// - Bestaande velden met dezelfde slug behouden hun ID en worden bijgewerkt.
// - Velden die niet in deze lijst staan blijven bestaan (achteraan); er wordt niets verwijderd.
// - Er verandert pas iets nadat je de bevestigingsvraag met OK beantwoordt (per stap).
// - Publiceren slaat items zonder slug over (zoals een testitem) en items die al live staan.
// - Bestaande items houden hun data: Centaur slaat itemdata op per veld-slug.

(async () => {
  const API = 'https://api.centaur-cms.app'
  const token = localStorage.getItem('centaur_token')
  if (!token) return console.error('Niet ingelogd: log eerst in op het Centaur-dashboard en probeer opnieuw.')

  const call = async (method, path, body) => {
    const response = await fetch(API + path, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(`${method} ${path} → ${response.status}: ${JSON.stringify(data)}`)
    return data
  }

  const id = () => crypto.randomUUID()
  const field = (name, slug, type, { required = false, config = {} } = {}) => ({ id: id(), name, slug, type, required, config })

  const desired = [
    field('Titel', 'titel', 'text', { required: true }),
    field('Slug', 'slug', 'text', { required: true }),
    field('Intro', 'intro', 'richtext', { required: true }),
    field('Afbeelding', 'afbeelding', 'media', { required: true }),
    field('Alt-tekst afbeelding', 'afbeelding_alt', 'text'),
    field('Keuken', 'keuken', 'relation', { config: { targetCollection: 'keukens', multiple: false } }),
    field('Gang', 'gang', 'select', { config: { options: ['Voorgerecht', 'Hoofdgerecht', 'Bijgerecht', 'Soep', 'Dessert', 'Brunch', 'Snack'] } }),
    field('Moeilijkheid', 'moeilijkheid', 'select', { config: { options: ['Makkelijk', 'Gemiddeld', 'Uitdagend'] } }),
    field('Voorbereidingstijd (min)', 'voorbereidingstijd', 'number', { required: true }),
    field('Bereidingstijd (min)', 'bereidingstijd', 'number', { required: true }),
    field('Personen', 'personen', 'number', { required: true }),
    field('Ingrediënten', 'ingredienten', 'repeater', { required: true, config: { sub_fields: [
      field('Groep', 'groep', 'text'),
      field('Hoeveelheid', 'hoeveelheid', 'number'),
      field('Eenheid', 'eenheid', 'text'),
      field('Ingrediënt', 'ingredient', 'text', { required: true }),
      field('Meervoud', 'ingredient_meervoud', 'text'),
      field('Toelichting', 'toelichting', 'text')
    ] } }),
    field('Bereiding', 'bereiding', 'repeater', { required: true, config: { sub_fields: [
      field('Kop', 'kop', 'text'),
      field('Stap', 'stap', 'text', { required: true })
    ] } }),
    field('Tips & variaties', 'tips', 'richtext'),
    field('Tags', 'tags', 'text'),
    field('Meta-titel', 'meta_titel', 'text'),
    field('Meta-omschrijving', 'meta_omschrijving', 'text')
  ]

  // Controle collectie "keukens": welke veldslugs bestaan daar?
  const keukens = await call('GET', '/api/admin/collections/keukens')
  console.log('Velden van "keukens":', keukens.fields.map(f => `${f.slug} (${f.type})`).join(', '))

  const current = await call('GET', '/api/admin/collections/recepten')
  const bySlug = new Map(current.fields.map(f => [f.slug, f]))
  const merged = desired.map(f => (bySlug.has(f.slug) ? { ...f, id: bySlug.get(f.slug).id } : f))
  const extra = current.fields.filter(f => !desired.some(d => d.slug === f.slug))
  const fields = [...merged, ...extra]

  const added = desired.filter(f => !bySlug.has(f.slug)).map(f => f.slug)
  const updated = desired.filter(f => bySlug.has(f.slug)).map(f => f.slug)
  const summary =
    `Collectie "recepten" bijwerken?\n\n` +
    `Nieuw (${added.length}): ${added.join(', ') || '—'}\n` +
    `Bijgewerkt (${updated.length}): ${updated.join(', ') || '—'}\n` +
    `Blijven ongewijzigd staan (${extra.length}): ${extra.map(f => f.slug).join(', ') || '—'}`
  console.log(summary)
  if (confirm(summary)) {
    const result = await call('PUT', '/api/admin/collections/recepten', { name: current.name, fields })
    console.log(`✔ Velden: "recepten" heeft nu ${result.fields.length} velden:`, result.fields.map(f => f.slug).join(', '))
  } else {
    console.log('Velden overgeslagen, er is niets gewijzigd.')
  }

  // ── Stap 2: alle concepten publiceren (eerst keukens, want recepten verwijzen ernaar) ──
  const allEntries = async (collection) => {
    const entries = []
    for (let page = 1; ; page++) {
      const result = await call('GET', `/api/admin/collections/${collection}/entries?page=${page}&pageSize=100`)
      entries.push(...result.items)
      if (entries.length >= result.total || result.items.length === 0) return entries
    }
  }
  const drafts = {}
  for (const collection of ['keukens', 'recepten']) {
    drafts[collection] = (await allEntries(collection)).filter(e => e.status !== 'published' && e.data?.slug)
  }
  const publishSummary =
    `Alle concepten publiceren?\n\n` +
    `Keukens: ${drafts.keukens.length}\nRecepten: ${drafts.recepten.length}\n\n` +
    `Let op: elk item vuurt het webhook-event entry.published af. Staat er een webhook naar een ` +
    `Vercel deploy hook, zet die dan eerst tijdelijk uit, anders start je één build per item.`
  console.log(publishSummary)
  if (!confirm(publishSummary)) return console.log('Publiceren overgeslagen.')

  let published = 0
  for (const collection of ['keukens', 'recepten']) {
    for (const entry of drafts[collection]) {
      await call('POST', `/api/admin/collections/${collection}/entries/${entry.id}/publish`)
      published++
      if (published % 10 === 0) console.log(`… ${published} gepubliceerd`)
    }
  }
  console.log(`✔ Klaar: ${published} items gepubliceerd (${drafts.keukens.length} keukens, ${drafts.recepten.length} recepten).`)
})().catch(error => console.error('✖ Mislukt:', error.message))
