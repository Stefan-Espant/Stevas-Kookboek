// Responsive receptfoto's via Vercel Image Optimization: /_vercel/image?url=…&w=…&q=… levert de foto
// op de gevraagde breedte (AVIF/WebP waar de browser dat kan) en cachet het resultaat. Zo laadt een
// telefoon geen origineel van 1200px voor een kaart van 350px.
// Alleen op Vercel (daar bestaat /_vercel/image); lokaal blijft het gewoon src. De breedtes en de
// toegestane domeinen staan ook in .vercel/output/config.json (zie wald.config.ts) — houd ze gelijk.
//
// (Centaur maakt zelf ook kleinere versies, maar door een bug in de opslag bestaan die niet:
// de S3-client sluit de bestandsstroom na de upload, waarna het verkleinen faalt.)

export const IMAGE_WIDTHS = [320, 480, 640, 800, 1080, 1200]
const QUALITY = 75

const onVercel = () => process.env.VERCEL === '1'

/** srcset voor een externe foto (https), of leeg (lokaal, of een pad uit public/). */
export function srcsetFor(url: string): string {
  if (!url || !url.startsWith('https://') || !onVercel()) return ''
  return IMAGE_WIDTHS
    .map(width => `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=${QUALITY} ${width}w`)
    .join(', ')
}

/** Herkomst van een foto (voor preconnect en de domeinlijst van Vercel), of leeg. */
export function mediaOrigin(url: string): string {
  try {
    return url.startsWith('https://') ? new URL(url).origin : ''
  } catch {
    return ''
  }
}
