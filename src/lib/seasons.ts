// Seizoenen: welke recepten passen bij de tijd van het jaar. Net als de inspiratie-thema's op
// regels (tags, titel, ingrediënten), zodat nieuwe recepten vanzelf in het juiste seizoen vallen.
// De homepage bouwt alle vier de seizoenen en toont in de browser het seizoen van vandaag: een
// statische site wordt niet elke maand opnieuw gebouwd.
import type { Recipe } from './recipes'

export type SeasonSlug = 'lente' | 'zomer' | 'herfst' | 'winter'

export interface Season {
  slug: SeasonSlug
  name: string
  /** Maanden (1–12) waarin dit seizoen op de homepage staat. */
  months: number[]
  /** Kop op de homepage. */
  title: string
  description: string
  /** Tags (exact) en woorden in titel of ingrediënten (begin van een woord) die erbij horen. */
  tags: string[]
  words: string[]
}

export const SEASONS: Season[] = [
  {
    slug: 'lente',
    name: 'Lente',
    months: [3, 4, 5],
    title: 'Lente: fris, groen en licht',
    description: 'Asperges, spinazie, lamsvlees en frisse salades: recepten voor de eerste lange avonden.',
    tags: ['lente', 'salade', 'fris', 'lam', 'spinazie', 'picknick', 'gezond', 'lunch'],
    words: ['asperge', 'doperwt', 'radijs', 'rabarber', 'spinazie', 'tuinbonen', 'waterkers', 'lam', 'munt', 'bieslook', 'salade']
  },
  {
    slug: 'zomer',
    name: 'Zomer',
    months: [6, 7, 8],
    title: 'Zomer: salades, barbecue en koude gerechten',
    description: 'Van de barbecue, uit de hand of koud uit de koelkast: recepten voor warme dagen.',
    tags: ['zomer', 'barbecue', 'salade', 'koud', 'zonder koken', 'zonder oven', 'ijs', 'fruit', 'mango', 'aubergine', 'tomaat', 'picknick', 'fris', 'mezze', 'tapas'],
    words: ['courgette', 'aubergine', 'tomaat', 'komkommer', 'watermeloen', 'aardbei', 'perzik', 'mango', 'basilicum', 'avocado', 'maïs', 'framboos', 'frambozen', 'kersen', 'salade', 'gazpacho', 'barbecue']
  },
  {
    slug: 'herfst',
    name: 'Herfst',
    months: [9, 10, 11],
    title: 'Herfst: stoofpotten, pompoen en paddenstoelen',
    description: 'Als de dagen korter worden: stoofpotten, ovenschotels, soep en gerechten met pompoen en paddenstoelen.',
    tags: ['herfst', 'stoof', 'stoofvlees', 'comfortfood', 'ovenschotel', 'soep', 'maaltijdsoep', 'pompoen', 'paddenstoelen', 'champignons', 'appel', 'slowcooking', 'ragout', 'tajine'],
    words: ['pompoen', 'paddenstoel', 'champignon', 'appel', 'kastanje', 'prei', 'peer', 'stoof', 'stoofpot', 'soep', 'ovenschotel', 'rode wijn']
  },
  {
    slug: 'winter',
    name: 'Winter',
    months: [12, 1, 2],
    title: 'Winterkost: stamppot, stoof en soep',
    description: 'Stamppot, stoofvlees, fondue en maaltijdsoep: echte winterkost om je aan op te warmen.',
    tags: ['winter', 'stamppot', 'stoof', 'stoofvlees', 'comfortfood', 'fondue', 'boerenkool', 'zuurkool', 'feestdagen', 'oudjaar', 'soep', 'maaltijdsoep', 'bergen', 'kool', 'andijvie', 'witloof', 'spruitjes'],
    words: ['boerenkool', 'zuurkool', 'andijvie', 'spruit', 'witlof', 'witloof', 'rookworst', 'kool', 'stamppot', 'stoof', 'soep', 'fondue', 'erwtensoep', 'knolselderij', 'pastinaak']
  }
]

const words = (text: string) => text.toLowerCase().split(/[^a-zà-ÿ]+/).filter(Boolean)
const hasWord = (text: string, keyword: string) =>
  keyword.includes(' ') ? text.toLowerCase().includes(keyword) : words(text).some(word => word.startsWith(keyword))

/** Hoe goed een recept bij een seizoen past: tags tellen het zwaarst, dan de titel, dan ingrediënten. */
function seasonScore(recipe: Recipe, season: Season): number {
  const tags = recipe.tags.map(tag => tag.toLowerCase())
  const tagScore = season.tags.filter(tag => tags.includes(tag)).length * 3
  const titleScore = season.words.some(word => hasWord(recipe.title, word)) ? 2 : 0
  const ingredientScore = Math.min(3, recipe.ingredients.filter(ingredient =>
    season.words.some(word => hasWord(ingredient.name, word))).length)
  return tagScore + titleScore + ingredientScore
}

/** Recepten die bij een seizoen passen, best passend eerst (bij gelijke stand het nieuwste). */
export function seasonRecipes(recipes: Recipe[], season: Season): Recipe[] {
  return recipes
    .map(recipe => ({ recipe, score: seasonScore(recipe, season) }))
    .filter(({ score }) => score >= 3)
    .sort((a, b) => b.score - a.score)
    .map(({ recipe }) => recipe)
}

/** Seizoen bij een datum (alleen tijdens de build; de homepage kiest in de browser opnieuw). */
export const seasonFor = (date: Date) => SEASONS.find(season => season.months.includes(date.getMonth() + 1)) ?? SEASONS[0]
