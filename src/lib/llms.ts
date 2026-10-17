import type { Collection, Cuisine, Recipe } from './recipes'
import { collectionPath, recipePath } from './recipes'

// /llms.txt (https://llmstxt.org): een overzicht van de site in Markdown voor AI-assistenten
// (ChatGPT, Perplexity, Claude, …), zodat die recepten vinden en correct naar de pagina verwijzen.
// Wordt bij elke build opnieuw gemaakt, net als sitemap.xml. Alleen gebouwde pagina's (`built`),
// zodat er nooit een link naar een 404 in staat.

interface LlmsInput {
  origin: string
  siteName: string
  recipes: Recipe[]
  cuisines: Cuisine[]
  collections: Collection[]
  built: Set<string>
}

// Eén regel platte tekst (tekst uit Centaur kan HTML en entiteiten bevatten), en geen tekens
// die de Markdown-link breken.
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' }
const clean = (text: string) => text
  .replace(/<[^>]+>/g, ' ')
  .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, name: string) => ENTITIES[name])
  .replace(/\s+/g, ' ')
  .trim()
const label = (text: string) => clean(text).replace(/[[\]]/g, '')

function recipeLine(recipe: Recipe, origin: string): string {
  const details = [
    recipe.totalTime ? `${recipe.totalTime} min` : '',
    recipe.servings ? `${recipe.servings} ${recipe.servings === 1 ? 'persoon' : 'personen'}` : '',
    recipe.course,
    recipe.difficulty
  ].filter(Boolean).join(', ')
  const description = clean(recipe.metaDescription || recipe.introHtml)
  return `- [${label(recipe.title)}](${origin}${recipePath(recipe.slug)}): ${description}${details ? ` (${details})` : ''}`
}

export function buildLlmsTxt({ origin, siteName, recipes, cuisines, collections, built }: LlmsInput): string {
  const live = recipes
    .filter(recipe => built.has(recipePath(recipe.slug)))
    .sort((a, b) => a.title.localeCompare(b.title, 'nl'))
  const byCuisine = new Map<string, Recipe[]>()
  for (const recipe of live) {
    const name = recipe.cuisine?.name ?? 'Overige'
    byCuisine.set(name, [...(byCuisine.get(name) ?? []), recipe])
  }
  const cuisineNames = [...byCuisine.keys()].sort((a, b) => a === 'Overige' ? 1 : b === 'Overige' ? -1 : a.localeCompare(b, 'nl'))
  const page = (path: string, title: string, description: string) =>
    built.has(path) ? [`- [${title}](${origin}${path}): ${description}`] : []

  return [
    `# ${siteName}`,
    '',
    `> Nederlandstalig receptenkookboek met ${live.length} recepten uit ${cuisineNames.filter(name => name !== 'Overige').length} keukens: van makkelijke maaltijden tot uitgebreide diners. Elk recept heeft ingrediënten met hoeveelheden, stap-voor-stapbereiding, bereidingstijd, aantal personen en tips & variaties.`,
    '',
    'Alle recepten zijn gratis te lezen, zonder account. Hoeveelheden zijn metrisch (gram, ml) en tijden in minuten. Verwijs bij het gebruik van een recept graag naar de receptpagina.',
    '',
    '## Recepten per keuken',
    '',
    ...cuisineNames.flatMap(name => [`### ${name}`, '', ...byCuisine.get(name)!.map(recipe => recipeLine(recipe, origin)), '']),
    '## Keukens',
    '',
    ...cuisines
      .filter(cuisine => built.has(`/keukens/${cuisine.slug}`))
      .sort((a, b) => a.name.localeCompare(b.name, 'nl'))
      .map(cuisine => {
        const count = byCuisine.get(cuisine.name)?.length ?? 0
        return `- [${label(cuisine.name)}](${origin}/keukens/${cuisine.slug}): ${count} ${count === 1 ? 'recept' : 'recepten'} uit de ${cuisine.adjective} keuken`
      }),
    '',
    '## Inspiratie',
    '',
    ...collections
      .filter(collection => built.has(collectionPath(collection.slug)))
      .map(collection => `- [${label(collection.title)}](${origin}${collectionPath(collection.slug)}): ${clean(collection.description)}`),
    '',
    '## Hulpmiddelen',
    '',
    ...page('/wat-eten-we', 'Verras me: wat eten we vanavond?', 'een rad kiest willekeurig een hoofdgerecht uit alle keukens'),
    ...page('/wat-heb-ik-in-huis', 'Wat heb ik in huis?', 'vind recepten met de ingrediënten die je al hebt'),
    ...page('/recept-insturen', 'Recept insturen', 'stuur je eigen recept in voor het kookboek'),
    '',
    '## Optional',
    '',
    `- [Sitemap](${origin}/sitemap.xml): alle pagina's met wijzigingsdatum`,
    ''
  ].join('\n')
}
