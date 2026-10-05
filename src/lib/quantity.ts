// Hoeveelheden leesbaar maken: keukenbreuken, enkelvoud/meervoud van eenheden en ingrediënten.
// De personen-rekentool (RecipeView.wald) gebruikt in de browser dezelfde afrondregels — houd
// formatQuantity daar gelijk mee.

export interface Ingredient {
  group: string
  quantity: number | null
  unit: string
  name: string
  plural: string
  note: string
}

const FRACTIONS: Array<[number, string]> = [[0, ''], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'], [1, '']]

/** Vanaf 10 hele getallen ("225"), daaronder keukenbreuken ("1½", "¾") en anders één decimaal met komma. */
export function formatQuantity(value: number): string {
  if (value >= 10) return String(Math.round(value))
  const whole = Math.floor(value)
  const rest = value - whole
  const nearest = FRACTIONS.reduce((best, f) => (Math.abs(f[0] - rest) < Math.abs(best[0] - rest) ? f : best))
  if (Math.abs(nearest[0] - rest) > 0.03) return String(Math.round(value * 10) / 10).replace('.', ',')
  if (nearest[0] === 1) return String(whole + 1)
  return whole === 0 && nearest[1] ? nearest[1] : `${whole}${nearest[1]}`
}

// Meervoud van eenheden die je telt; afkortingen (g, kg, ml, l, el, tl, cm) blijven gelijk.
const UNIT_PLURALS: Record<string, string> = {
  teen: 'tenen', stengel: 'stengels', snee: 'sneeën', plak: 'plakken', blik: 'blikken',
  pot: 'potten', bos: 'bossen', takje: 'takjes', blad: 'bladen', vel: 'vellen', flesje: 'flesjes',
  zakje: 'zakjes', rol: 'rollen', stronk: 'stronken', stuk: 'stukken', kropje: 'kropjes',
  handje: 'handjes', snuf: 'snufjes', pak: 'pakken', bakje: 'bakjes', kopje: 'kopjes', glas: 'glazen', bol: 'bollen'
}

export function pluralUnit(unit: string): string {
  return UNIT_PLURALS[unit] ?? unit
}

/**
 * Vormen voor één en voor meer. Met een eenheid is het ingrediënt een hoeveelheid van iets
 * ("3 kg mosselen", ook "1 kg mosselen"), dus dan altijd het meervoud als dat er is; zonder
 * eenheid tel je stuks ("1 sjalot", "2 sjalotten").
 */
export function forms(ingredient: Ingredient) {
  const many = ingredient.plural || ingredient.name
  return {
    unitOne: ingredient.unit,
    unitMany: pluralUnit(ingredient.unit),
    nameOne: ingredient.unit ? many : ingredient.name,
    nameMany: many
  }
}

/** Platte tekst, bv. voor het Recipe-schema: "2 tenen knoflook, fijngehakt". */
export function ingredientText(ingredient: Ingredient, quantity = ingredient.quantity): string {
  const f = forms(ingredient)
  const many = quantity !== null && quantity > 1
  const parts = [
    quantity !== null ? formatQuantity(quantity) : '',
    many ? f.unitMany : f.unitOne,
    many ? f.nameMany : f.nameOne
  ].filter(Boolean)
  return parts.join(' ') + (ingredient.note ? `, ${ingredient.note}` : '')
}
