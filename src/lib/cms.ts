// Alle Centaur-calls draaien alleen tijdens `wald build` / `wald grow` (in Node), nooit in
// de browser — de API-sleutel komt dus niet meer in de client-bundle terecht.

export interface CentaurPage {
  id: string
  title: string
  slug: string
  metaDescription: string
  body: CentaurBlockInstance[]
  createdAt: string
  updatedAt: string
  metaTitle?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImage?: string | null
  canonicalUrl?: string | null
  status?: string | null
  scheduledPublishAt?: string | null
  locale?: string | null
}

export interface CentaurNavigationItem {
  id: string
  label: string
  url: string
  items: CentaurNavigationItem[]
}

export interface CentaurNavigation {
  id: string
  name: string
  slug: string
  items: CentaurNavigationItem[]
}

export interface CentaurBlockInstance extends Record<string, unknown> {
  _type: string
  _id: string
}

export interface CentaurFieldDefinition {
  slug: string
  type: string
}

export interface CentaurBlockType {
  slug: string
  fields: CentaurFieldDefinition[]
}

export interface CentaurSiteSettings {
  siteName: string
  tagline: string
  titleSuffix: string
  primaryColor: string
  logoUrl: string
  faviconUrl: string
  defaultOgImageUrl: string
  instagram: string
  linkedIn: string
  facebook: string
  twitter: string
  analyticsId: string
  cookieBannerEnabled: boolean
  cookieBannerText: string
  maintenanceMode: boolean
  maintenanceMessage: string
  schemaType: string
}

// Zonder een timeout kan een trage/onbereikbare Centaur API de build onbeperkt laten
// hangen. 8s is ruim voldoende voor een normale response.
const FETCH_TIMEOUT_MS = 8000

export const cmsConfig = {
  get apiBase() { return process.env.CENTAUR_API_BASE ?? '' },
  get apiKey() { return process.env.CENTAUR_API_KEY ?? '' },
  get tenantSlug() { return process.env.CENTAUR_TENANT_SLUG ?? '' }
}

class CentaurError extends Error {
  constructor(public status: number, path: string) {
    super(`Centaur ${path} gaf status ${status}`)
  }
}

async function request(path: string, options: { apiKey?: boolean } = {}): Promise<Response> {
  const response = await fetch(`${cmsConfig.apiBase.replace(/\/$/, '')}${path}`, {
    headers: options.apiKey === false ? {} : { 'X-Api-Key': cmsConfig.apiKey },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  })
  if (!response.ok) throw new CentaurError(response.status, path)
  return response
}

async function getJson<T>(path: string): Promise<T> {
  return (await request(path)).json() as Promise<T>
}

// Tijdens één build vragen alle pagina's dezelfde data op (site-instellingen,
// bloktypes, ...). Memoizen voorkomt tientallen identieke API-calls.
const cache = new Map<string, Promise<unknown>>()
function memo<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) cache.set(key, load())
  return cache.get(key) as Promise<T>
}

export function getPage(slug: string): Promise<CentaurPage | null> {
  return memo(`page:${slug}`, async () => {
    try {
      return await getJson<CentaurPage>(`/api/public/pages/${slug}`)
    } catch (error) {
      if (error instanceof CentaurError && error.status === 404) return null
      throw error
    }
  })
}

export async function getNavigation(slug: string): Promise<CentaurNavigation | null> {
  try {
    return await getJson<CentaurNavigation>(`/api/navigation/${slug}`)
  } catch (error) {
    if (error instanceof CentaurError && error.status === 404) return null
    throw error
  }
}

export function getBlockTypes(): Promise<CentaurBlockType[]> {
  return memo('block-types', () => getJson<CentaurBlockType[]>('/api/public/block-types'))
}

export function getSiteSettings(): Promise<CentaurSiteSettings | null> {
  return memo('site-settings', async () => {
    try {
      const response = await getJson<{ tenantSlug: string, settings: CentaurSiteSettings }>('/api/public/site')
      return response.settings
    } catch {
      return null
    }
  })
}

export function getSitemapSlugs(): Promise<string[]> {
  return memo('sitemap-slugs', async () => {
    try {
      const xml = await (await request(`/api/public/sitemap/${cmsConfig.tenantSlug}.xml`, { apiKey: false })).text()
      const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
      return matches
        .map((match) => {
          try {
            return new URL(match[1]).pathname.replace(/^\//, '')
          } catch {
            return ''
          }
        })
        .filter((slug) => slug.length > 0)
    } catch {
      return []
    }
  })
}

// ── Collecties ──────────────────────────────────────────────────────────────────────────

export interface CentaurEntry<T = Record<string, unknown>> {
  id: string
  data: T
  status: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Preview-modus (alleen lokaal): met CENTAUR_PREVIEW=1 én een CENTAUR_WRITE_KEY in .env leest de
 * build via /api/manage ook concepten, zodat je ongepubliceerde recepten kunt bekijken. Zet die
 * twee nooit in Vercel: de publieke site hoort alleen gepubliceerde items te tonen.
 */
export const isPreview = () => process.env.CENTAUR_PREVIEW === '1' && Boolean(process.env.CENTAUR_WRITE_KEY)

/**
 * Alle items van een collectie. Normaal: alleen gepubliceerd, via de publieke content-API
 * (relaties worden daar al uitgevouwen tot het gekoppelde item). In preview-modus: ook
 * concepten, maar relaties zijn dan nog lijsten met ID's — normaliseer die zelf (zie recipes.ts).
 * Een collectie die (nog) niet bestaat geeft een lege lijst.
 */
export function getCollection<T = Record<string, unknown>>(slug: string): Promise<CentaurEntry<T>[]> {
  return memo(`collection:${slug}:${isPreview()}`, async () => {
    const base = cmsConfig.apiBase.replace(/\/$/, '')
    const [url, key] = isPreview()
      ? [`${base}/api/manage/collections/${slug}/entries`, process.env.CENTAUR_WRITE_KEY ?? '']
      : [`${base}/content/${slug}`, cmsConfig.apiKey]
    const response = await fetch(url, { headers: { 'X-Api-Key': key }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (response.status === 404) return []
    if (!response.ok) throw new CentaurError(response.status, url.replace(base, ''))
    return response.json() as Promise<CentaurEntry<T>[]>
  })
}
