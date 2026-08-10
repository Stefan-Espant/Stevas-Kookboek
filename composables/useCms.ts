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

export interface CentaurFormSubmissionResult {
  id: string
  submittedAt: string
  message: string
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

export function useCms() {
  const config = useRuntimeConfig()

  // Zonder een timeout kan een trage/onbereikbare Centaur API een request onbeperkt
  // laten hangen. 8s is ruim voldoende voor een normale response, maar voorkomt dat
  // een verzoek (bv. tijdens SSR) voor altijd blijft wachten.
  const FETCH_TIMEOUT_MS = 8000

  async function getPage(slug: string): Promise<CentaurPage | null> {
    try {
      return await $fetch<CentaurPage>(`/api/public/pages/${slug}`, {
        baseURL: config.public.centaurApiBase,
        headers: { 'X-Api-Key': config.public.centaurApiKey },
        timeout: FETCH_TIMEOUT_MS
      })
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.response?.status === 404) return null
      throw error
    }
  }

  async function getNavigation(slug: string): Promise<CentaurNavigation | null> {
    try {
      return await $fetch<CentaurNavigation>(`/api/navigation/${slug}`, {
        baseURL: config.public.centaurApiBase,
        headers: { 'X-Api-Key': config.public.centaurApiKey },
        timeout: FETCH_TIMEOUT_MS
      })
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.response?.status === 404) return null
      throw error
    }
  }

  async function getBlockTypes(): Promise<CentaurBlockType[]> {
    return await $fetch<CentaurBlockType[]>('/api/public/block-types', {
      baseURL: config.public.centaurApiBase,
      headers: { 'X-Api-Key': config.public.centaurApiKey },
      timeout: FETCH_TIMEOUT_MS
    })
  }

  async function getSiteSettings(): Promise<CentaurSiteSettings | null> {
    try {
      const response = await $fetch<{ tenantSlug: string, settings: CentaurSiteSettings }>('/api/public/site', {
        baseURL: config.public.centaurApiBase,
        headers: { 'X-Api-Key': config.public.centaurApiKey },
        timeout: FETCH_TIMEOUT_MS
      })
      return response.settings
    } catch {
      return null
    }
  }

  async function getSitemapSlugs(): Promise<string[]> {
    try {
      const xml = await $fetch<string>(`/api/public/sitemap/${config.public.centaurTenantSlug}.xml`, {
        baseURL: config.public.centaurApiBase,
        responseType: 'text',
        timeout: FETCH_TIMEOUT_MS
      })
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
  }

  async function submitForm(
    pageSlug: string,
    fields: Record<string, string>,
    options?: { formKey?: string, formTitle?: string, recipientEmail?: string }
  ): Promise<CentaurFormSubmissionResult> {
    return $fetch<CentaurFormSubmissionResult>('/api/public/forms/submit', {
      method: 'POST',
      baseURL: config.public.centaurApiBase,
      headers: { 'X-Tenant-Slug': config.public.centaurTenantSlug },
      body: {
        pageSlug,
        formKey: options?.formKey,
        formTitle: options?.formTitle,
        recipientEmail: options?.recipientEmail,
        fields
      },
      timeout: FETCH_TIMEOUT_MS
    })
  }

  return { getPage, getNavigation, getBlockTypes, getSiteSettings, submitForm, getSitemapSlugs }
}
