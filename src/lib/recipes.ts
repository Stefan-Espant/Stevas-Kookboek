// Recepten en keukens uit de Centaur-collecties "recepten" en "keukens" (zie
// docs/centaur-collecties.md voor de velden). Alle pagina's lezen via deze module.
import { getCollection, type CentaurEntry } from './cms'
import type { Ingredient } from './quantity'
import { SEASONS, seasonRecipes } from './seasons'

export type { Ingredient } from './quantity'

export interface Cuisine {
  id: string
  slug: string
  name: string
  /** Bijvoeglijke vorm, voor "de Belgische keuken". */
  adjective: string
  introHtml: string
  image: string
  imageAlt: string
}

export interface Step {
  heading: string
  text: string
}

export interface Recipe {
  id: string
  slug: string
  title: string
  introHtml: string
  image: string
  imageAlt: string
  cuisine: Cuisine | null
  course: string
  difficulty: string
  prepTime: number
  cookTime: number
  totalTime: number
  servings: number
  ingredients: Ingredient[]
  steps: Step[]
  tipsHtml: string
  tags: string[]
  metaTitle: string
  metaDescription: string
  createdAt: string
  updatedAt: string
  /** Kleine letters, zonder HTML: titel, ingrediënten, tags, keuken en gang — voor /zoeken. */
  searchText: string
}

/** Kaarten en lijsten gebruiken het volledige recept; de oude naam blijft bestaan voor de componenten. */
export type RecipeSummary = Recipe

export const recipePath = (slug: string) => `/recepten/${slug}`

type Data = Record<string, unknown>
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const num = (value: unknown) => (value === null || value === '' || value === undefined || !Number.isFinite(Number(value)) ? 0 : Number(value))
const rows = (value: unknown): Data[] => (Array.isArray(value) ? value.filter((row): row is Data => typeof row === 'object' && row !== null) : [])
const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

function toCuisine(entry: CentaurEntry): Cuisine {
  const data = entry.data
  const name = text(data.naam)
  return {
    id: entry.id,
    slug: text(data.slug),
    name,
    adjective: text(data.bijvoeglijk) || name,
    introHtml: text(data.intro),
    image: text(data.afbeelding),
    imageAlt: text(data.afbeelding_alt) || name
  }
}

export function getAllCuisineEntries(): Promise<Cuisine[]> {
  return getCollection('keukens').then(entries => entries.map(toCuisine).filter(cuisine => cuisine.slug && cuisine.name))
}

/**
 * De relatie "keuken" komt via de publieke API uitgevouwen binnen (het gekoppelde item), maar in
 * preview-modus als lijst met ID's. Beide vormen worden hier op een Cuisine afgebeeld.
 */
function resolveCuisine(value: unknown, cuisinesById: Map<string, Cuisine>): Cuisine | null {
  if (Array.isArray(value)) return cuisinesById.get(String(value[0])) ?? null
  if (typeof value === 'string') return cuisinesById.get(value) ?? null
  if (value && typeof value === 'object' && 'id' in value) {
    const entry = value as CentaurEntry
    return cuisinesById.get(entry.id) ?? (entry.data ? toCuisine(entry) : null)
  }
  return null
}

function toRecipe(entry: CentaurEntry, cuisinesById: Map<string, Cuisine>): Recipe {
  const data = entry.data
  const prepTime = num(data.voorbereidingstijd)
  const cookTime = num(data.bereidingstijd)
  const title = text(data.titel)
  const cuisine = resolveCuisine(data.keuken, cuisinesById)
  const ingredients: Ingredient[] = rows(data.ingredienten).map(row => ({
    group: text(row.groep),
    quantity: row.hoeveelheid === null || row.hoeveelheid === undefined || row.hoeveelheid === '' ? null : num(row.hoeveelheid),
    unit: text(row.eenheid),
    name: text(row.ingredient),
    plural: text(row.ingredient_meervoud),
    note: text(row.toelichting)
  })).filter(ingredient => ingredient.name)
  const steps: Step[] = rows(data.bereiding).map(row => ({ heading: text(row.kop), text: text(row.stap) })).filter(step => step.text)
  const tags = text(data.tags).split(',').map(tag => tag.trim()).filter(Boolean)
  const course = text(data.gang)

  return {
    id: entry.id,
    slug: text(data.slug),
    title,
    introHtml: text(data.intro),
    image: text(data.afbeelding),
    imageAlt: text(data.afbeelding_alt) || title,
    cuisine,
    course,
    difficulty: text(data.moeilijkheid),
    prepTime,
    cookTime,
    totalTime: prepTime + cookTime,
    servings: num(data.personen),
    ingredients,
    steps,
    tipsHtml: text(data.tips),
    tags,
    metaTitle: text(data.meta_titel),
    metaDescription: text(data.meta_omschrijving) || stripHtml(text(data.intro)),
    createdAt: entry.publishedAt ?? entry.createdAt,
    updatedAt: entry.updatedAt,
    searchText: [title, ingredients.map(i => `${i.name} ${i.plural}`).join(' '), tags.join(' '), cuisine?.name ?? '', course]
      .join(' ').replace(/\s+/g, ' ').toLowerCase()
  }
}

let allRecipes: Promise<Recipe[]> | null = null

/** Alle recepten, nieuwste eerst. Items zonder slug of titel (bv. testitems) worden overgeslagen. */
export function getAllRecipes(): Promise<Recipe[]> {
  allRecipes ??= (async () => {
    const [entries, cuisines] = await Promise.all([getCollection('recepten'), getAllCuisineEntries()])
    const cuisinesById = new Map(cuisines.map(cuisine => [cuisine.id, cuisine]))
    const recipes = entries.map(entry => toRecipe(entry, cuisinesById)).filter(recipe => recipe.slug && recipe.title)

    // Centaur dwingt geen unieke slugs af: waarschuw in de build en houd het nieuwste recept.
    const seen = new Set<string>()
    const unique = recipes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((recipe) => {
        if (seen.has(recipe.slug)) {
          console.warn(`⚠ Dubbele recept-slug "${recipe.slug}" in Centaur: alleen het nieuwste recept wordt gebruikt.`)
          return false
        }
        seen.add(recipe.slug)
        return true
      })
    return unique
  })()
  return allRecipes
}

export async function getRecipe(slug: string): Promise<Recipe | null> {
  return (await getAllRecipes()).find(recipe => recipe.slug === slug) ?? null
}

export async function getLatestRecipes(limit = 6): Promise<Recipe[]> {
  return (await getAllRecipes()).slice(0, limit)
}

/** Andere recepten voor "Meer recepten": eerst uit dezelfde keuken, dan de nieuwste. */
export async function getRelatedRecipes(recipe: Recipe, limit = 3): Promise<Recipe[]> {
  const others = (await getAllRecipes()).filter(other => other.slug !== recipe.slug)
  const sameCuisine = others.filter(other => recipe.cuisine && other.cuisine?.id === recipe.cuisine.id)
  return [...sameCuisine, ...others.filter(other => !sameCuisine.includes(other))].slice(0, limit)
}

export interface CuisineWithRecipes extends Cuisine {
  recipes: Recipe[]
}

/** Alleen keukens die minstens één recept hebben, met de meeste recepten eerst. */
export async function getCuisines(): Promise<CuisineWithRecipes[]> {
  const [recipes, cuisines] = await Promise.all([getAllRecipes(), getAllCuisineEntries()])
  return cuisines
    .map(cuisine => ({ ...cuisine, recipes: recipes.filter(recipe => recipe.cuisine?.id === cuisine.id) }))
    .filter(cuisine => cuisine.recipes.length > 0)
    .sort((a, b) => b.recipes.length - a.recipes.length || a.name.localeCompare(b.name))
}

export interface Collection {
  slug: string
  title: string
  /** Titel voor <title> en Google: waar mensen op zoeken, bv. "Airfryer recepten". */
  seoTitle: string
  description: string
  recipes: Recipe[]
}

const hasTag = (recipe: Recipe, ...tags: string[]) =>
  recipe.tags.some(tag => tags.includes(tag.toLowerCase()))

// Inspiratie-thema's: regels op basis van tijd, gang en tags, zodat nieuwe recepten vanzelf in
// het juiste thema verschijnen. Elk thema heeft een eigen pagina op /inspiratie/<slug>; thema's
// zonder recepten worden niet getoond. De volgorde is ook die op de homepage (eerste drie).
export async function getCollections(): Promise<Collection[]> {
  const recipes = await getAllRecipes()
  const course = (name: string) => recipes.filter(recipe => recipe.course === name)
  const tagged = (...tags: string[]) => recipes.filter(recipe => hasTag(recipe, ...tags))
  const collections: Collection[] = [
    {
      slug: 'snel-op-tafel',
      title: 'Snel op tafel',
      seoTitle: 'Snelle recepten: binnen 30 minuten op tafel',
      description: 'Doordeweeks weinig tijd? Deze hoofdgerechten staan binnen een half uur op tafel.',
      recipes: recipes.filter(recipe => recipe.course === 'Hoofdgerecht' && recipe.totalTime > 0 && recipe.totalTime <= 30)
    },
    {
      slug: 'vegetarisch',
      title: 'Vegetarisch (mogelijk)',
      seoTitle: 'Vegetarische recepten',
      description: 'Zonder vlees of vis, of met een simpele aanpassing vegetarisch te maken.',
      recipes: tagged('vegetarisch', 'vegetarisch mogelijk', 'vegan')
    },
    {
      slug: 'airfryer',
      title: 'Uit de airfryer',
      seoTitle: 'Airfryer recepten',
      description: 'Krokant zonder frituurpan: van frieten en bitterballen tot kip en zalm uit de airfryer.',
      recipes: tagged('airfryer')
    },
    {
      slug: 'vegan',
      title: 'Vegan',
      seoTitle: 'Vegan recepten',
      description: 'Helemaal plantaardig: zonder vlees, vis, zuivel of ei, en vol smaak uit keukens over de hele wereld.',
      recipes: tagged('vegan')
    },
    {
      slug: 'goedkoop',
      title: 'Goedkoop en lekker',
      seoTitle: 'Goedkope recepten',
      description: 'Lekker eten hoeft niet duur te zijn: gerechten met bonen, linzen, eieren, aardappels en restjes.',
      recipes: tagged('budget')
    },
    {
      slug: 'uit-de-oven',
      title: 'Uit de oven',
      seoTitle: 'Ovenschotels en ovengerechten',
      description: 'Even voorbereiden en de oven doet de rest: ovenschotels, gratins en traybakes.',
      recipes: tagged('ovenschotel', 'oven')
    },
    {
      slug: 'ontbijt-en-brunch',
      title: 'Ontbijt en brunch',
      seoTitle: 'Ontbijt- en brunchrecepten',
      description: 'Van wentelteefjes en shakshuka tot Bircher müesli: voor een lang en lui weekendontbijt.',
      recipes: course('Brunch')
    },
    {
      slug: 'borrelhapjes',
      title: 'Borrelhapjes',
      seoTitle: 'Borrelhapjes en snacks',
      description: 'Hapjes om te delen bij een drankje: bitterballen, tapas, dips en krokante snacks.',
      recipes: course('Snack')
    },
    {
      slug: 'voorgerechten',
      title: 'Voorgerechten',
      seoTitle: 'Voorgerechten',
      description: 'Een goed begin: salades, carpaccio, kroketten en mezze voor een etentje.',
      recipes: course('Voorgerecht')
    },
    {
      slug: 'bijgerechten',
      title: 'Bijgerechten',
      seoTitle: 'Bijgerechten',
      description: 'Groenten, aardappels en brood om naast je hoofdgerecht te zetten.',
      recipes: course('Bijgerecht')
    },
    {
      slug: 'soep',
      title: 'Soep van de dag',
      seoTitle: 'Soeprecepten',
      description: 'Van een snelle bouillon tot een vullende maaltijdsoep.',
      recipes: course('Soep')
    },
    {
      slug: 'iets-zoets',
      title: 'Iets zoets',
      seoTitle: 'Desserts en zoete recepten',
      description: 'Desserts, gebak en zoete lekkernijen.',
      recipes: course('Dessert')
    },
    {
      slug: 'comfortfood',
      title: 'Comfortfood',
      seoTitle: 'Comfortfood: stoofpotten en stamppotten',
      description: 'Stoofpotten, stamppotten en ovenschotels voor koude dagen.',
      recipes: tagged('comfortfood', 'stoofvlees', 'stamppot', 'winter', 'ovenschotel')
    },
    {
      slug: 'klassiekers',
      title: 'Klassiekers',
      seoTitle: 'Klassieke recepten uit de wereldkeuken',
      description: 'Gerechten die al generaties meegaan, zoals ze in hun land van herkomst bedoeld zijn.',
      recipes: tagged('klassiek')
    },
    {
      slug: 'gezellig-samen-eten',
      title: 'Gezellig samen eten',
      seoTitle: 'Recepten om samen te eten',
      description: 'Gerechten om midden op tafel te zetten, met vrienden of familie eromheen.',
      recipes: tagged('gezellig', 'feest', 'fondue', 'delen', 'barbecue')
    }
  ]
  // Seizoenen achteraan: de homepage toont het seizoen van vandaag zelf (zie index.wald).
  for (const season of SEASONS) {
    collections.push({
      slug: season.slug,
      title: `${season.name}recepten`,
      seoTitle: `${season.name}recepten: wat je nu kookt`,
      description: season.description,
      recipes: seasonRecipes(recipes, season)
    })
  }
  return collections.filter(collection => collection.recipes.length > 0)
}

export const collectionPath = (slug: string) => `/inspiratie/${slug}`

// Props voor TileCard (keukens- en inspiratietegels).
const countLabel = (count: number) => `${count} ${count === 1 ? 'recept' : 'recepten'}`
// Bij een rij tegels: geef de voorkeur aan een foto die nog niet in een eerdere tegel staat,
// anders tonen thema's met overlappende recepten allemaal dezelfde foto.
const firstImage = (recipes: Recipe[], used?: Set<string>) => {
  const withImage = recipes.filter(recipe => recipe.image)
  const image = (withImage.find(recipe => !used?.has(recipe.image)) ?? withImage[0])?.image ?? ''
  used?.add(image)
  return image
}

export function cuisineTile(cuisine: CuisineWithRecipes, used?: Set<string>) {
  return {
    href: `/keukens/${cuisine.slug}`,
    title: cuisine.name,
    subtitle: countLabel(cuisine.recipes.length),
    image: cuisine.image || firstImage(cuisine.recipes, used)
  }
}

export function collectionTile(collection: Collection, used?: Set<string>) {
  return { href: collectionPath(collection.slug), title: collection.title, subtitle: countLabel(collection.recipes.length), image: firstImage(collection.recipes, used) }
}
