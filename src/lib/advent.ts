// Adventkalender december 2026: één recept per dag, gelijk aan de social-media-reeks
// (output/instagram/adventkalender-2026). Recepten die (nog) niet gepubliceerd zijn, tonen
// op /advent "Recept volgt" in plaats van een link.

export interface AdventDag {
  dag: number
  slug: string
  /** Feestdag, als label op het deurtje en in de kalender (gouden lint). */
  feest?: string
}

export const ADVENT_JAAR = 2026

export const ADVENT: AdventDag[] = [
  { dag: 1, slug: 'warme-chocolademelk' },
  { dag: 2, slug: 'erwtensoep-snert' },
  { dag: 3, slug: 'kruidnoten' },
  { dag: 4, slug: 'speculaasjes' },
  { dag: 5, slug: 'banketstaaf', feest: 'Pakjesavond' },
  { dag: 6, slug: 'boerenkoolstamppot-met-rookworst' },
  { dag: 7, slug: 'franse-uiensoep' },
  { dag: 8, slug: 'hachee' },
  { dag: 9, slug: 'luikse-wafels' },
  { dag: 10, slug: 'bruine-bonensoep' },
  { dag: 11, slug: 'bitterballen-uit-de-airfryer' },
  { dag: 12, slug: 'vlaams-stoofvlees-met-trappist' },
  { dag: 13, slug: 'apfelstrudel' },
  { dag: 14, slug: 'zuurkoolovenschotel-met-spekjes' },
  { dag: 15, slug: 'weense-goulash' },
  { dag: 16, slug: 'kaiserschmarrn' },
  { dag: 17, slug: 'draadjesvlees' },
  { dag: 18, slug: 'salade-met-warme-geitenkaas' },
  { dag: 19, slug: 'sachertorte' },
  { dag: 20, slug: 'traditionele-kaasfondue' },
  { dag: 21, slug: 'carpaccio-met-rucola-en-parmezaan' },
  { dag: 22, slug: 'garnalenkroketten' },
  { dag: 23, slug: 'gratin-dauphinois' },
  { dag: 24, slug: 'kerststol', feest: 'Kerstavond' },
  { dag: 25, slug: 'kerstrollade', feest: 'Eerste kerstdag' },
  { dag: 26, slug: 'kersttulband', feest: 'Tweede kerstdag' },
  { dag: 27, slug: 'boeuf-bourguignon' },
  { dag: 28, slug: 'creme-brulee' },
  { dag: 29, slug: 'kaasstengels-van-bladerdeeg' },
  { dag: 30, slug: 'appelflappen' },
  { dag: 31, slug: 'oliebollen', feest: 'Oudejaarsdag' }
]
