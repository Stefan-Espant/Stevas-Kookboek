// Recepten en keukens uit de Centaur-collecties "recepten" en "keukens" (zie
// docs/centaur-collecties.md voor de velden). Alle pagina's lezen via deze module.
import { getCollection, type CentaurEntry } from './cms'
import type { Ingredient } from './quantity'

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
  description: string
  recipes: Recipe[]
}

const hasTag = (recipe: Recipe, ...tags: string[]) =>
  recipe.tags.some(tag => tags.includes(tag.toLowerCase()))

// Inspiratie-thema's: regels op basis van tijd, gang en tags, zodat nieuwe recepten vanzelf in
// het juiste thema verschijnen. Thema's zonder recepten worden niet getoond.
export async function getCollections(): Promise<Collection[]> {
  const recipes = await getAllRecipes()
  const collections: Collection[] = [
    {
      slug: 'snel-op-tafel',
      title: 'Snel op tafel',
      description: 'Doordeweeks weinig tijd? Deze recepten staan binnen een half uur op tafel.',
      recipes: recipes.filter(recipe => recipe.course === 'Hoofdgerecht' && recipe.totalTime > 0 && recipe.totalTime <= 30)
    },
    {
      slug: 'gezellig-samen-eten',
      title: 'Gezellig samen eten',
      description: 'Gerechten om midden op tafel te zetten, met vrienden of familie eromheen.',
      recipes: recipes.filter(recipe => hasTag(recipe, 'gezellig', 'feest', 'fondue', 'delen', 'barbecue'))
    },
    {
      slug: 'klassiekers',
      title: 'Klassiekers',
      description: 'Gerechten die al generaties meegaan, zoals ze in hun land van herkomst bedoeld zijn.',
      recipes: recipes.filter(recipe => hasTag(recipe, 'klassiek'))
    },
    {
      slug: 'comfortfood',
      title: 'Comfortfood',
      description: 'Stoofpotten, stamppotten en ovenschotels voor koude dagen.',
      recipes: recipes.filter(recipe => hasTag(recipe, 'comfortfood', 'stoofvlees', 'stamppot', 'winter', 'ovenschotel'))
    },
    {
      slug: 'soep',
      title: 'Soep van de dag',
      description: 'Van een snelle bouillon tot een vullende maaltijdsoep.',
      recipes: recipes.filter(recipe => recipe.course === 'Soep')
    },
    {
      slug: 'vegetarisch',
      title: 'Vegetarisch (mogelijk)',
      description: 'Zonder vlees of vis, of met een simpele aanpassing vegetarisch te maken.',
      recipes: recipes.filter(recipe => hasTag(recipe, 'vegetarisch', 'vegetarisch mogelijk', 'vegan'))
    },
    {
      slug: 'iets-zoets',
      title: 'Iets zoets',
      description: 'Desserts, gebak en zoete lekkernijen.',
      recipes: recipes.filter(recipe => recipe.course === 'Dessert')
    }
  ]
  return collections.filter(collection => collection.recipes.length > 0)
}

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
  return { href: `/inspiratie#${collection.slug}`, title: collection.title, subtitle: countLabel(collection.recipes.length), image: firstImage(collection.recipes, used) }
}
