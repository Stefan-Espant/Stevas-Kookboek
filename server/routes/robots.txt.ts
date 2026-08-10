export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain')
  const origin = getRequestURL(event).origin
  return `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`
})
