export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  setHeader(event, 'Content-Type', 'application/xml')

  try {
    return await $fetch<string>(
      `${config.public.centaurApiBase}/api/public/sitemap/${config.public.centaurTenantSlug}.xml`,
      { responseType: 'text' }
    )
  } catch {
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
  }
})
