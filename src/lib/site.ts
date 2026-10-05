// Publieke basis-URL van de site: SITE_URL, of op Vercel het productiedomein van het project.
export function siteUrl(): string {
  const url = process.env.SITE_URL
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  return url.replace(/\/$/, '')
}

// og:image en het Recipe-schema vereisen absolute URL's; afbeeldingen uit public/ staan in
// Centaur als relatief pad (/images/…). Zonder bekende site-URL blijft het pad relatief.
export function absoluteUrl(url: string): string {
  return url.startsWith('/') ? `${siteUrl()}${url}` : url
}

// JSON-LD-bouwstenen voor Layout's `schema`-prop.

/** Kruimelpad voor Google, bv. Home › Keukens › Italiaans. Paden zoals "/keukens". */
export function breadcrumbSchema(items: Array<[name: string, path: string]>): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: absoluteUrl(path)
    }))
  }
}

/** Overzichtspagina (alle recepten, een keuken, …) met de lijst van pagina's erop. */
export function collectionSchema(name: string, description: string, path: string, items: Array<[name: string, path: string]>): Record<string, unknown> {
  return {
    '@type': 'CollectionPage',
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: 'nl',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map(([itemName, itemPath], index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: itemName,
        url: absoluteUrl(itemPath)
      }))
    }
  }
}

/** Meta-omschrijving inkorten op een woordgrens: Google toont er zo'n 155 tekens van. */
export function clipDescription(text: string, max = 155): string {
  if (text.length <= max) return text
  return text.slice(0, text.lastIndexOf(' ', max - 1)).replace(/[,;:]$/, '') + '…'
}
