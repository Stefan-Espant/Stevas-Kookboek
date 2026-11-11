// Vercel-functie POST /api/nieuwsbrief: meldt een e-mailadres aan voor de nieuwsbrief in Brevo,
// met dubbele bevestiging (Brevo stuurt eerst een bevestigingsmail; pas na de klik staat iemand op
// de lijst). wald.config.ts zet dit bestand bij de build in .vercel/output/functions/.
//
// Omgevingsvariabelen (Vercel, nooit in de repo):
//   BREVO_API_KEY            API-sleutel (Brevo → SMTP & API → API Keys)
//   BREVO_LIST_ID            id van de lijst "Nieuwsbrief"
//   BREVO_DOI_TEMPLATE_ID    id van de bevestigingsmail (template met de tag {{ doubleoptin }})
//
// Met JavaScript post het formulier JSON (Accept: application/json) en krijgt het JSON terug;
// zonder JavaScript is het een gewone form-post en volgt een redirect naar een pagina.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function siteOrigin() {
  const url = process.env.SITE_URL
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  return url.replace(/\/$/, '')
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
  let raw = typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString('utf8') : ''
  if (!raw && req.readable) {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    raw = Buffer.concat(chunks).toString('utf8')
  }
  if ((req.headers['content-type'] || '').includes('application/json')) {
    try { return JSON.parse(raw || '{}') } catch { return {} }
  }
  return Object.fromEntries(new URLSearchParams(raw))
}

export default async function handler(req, res) {
  const wantsJson = (req.headers.accept || '').includes('application/json')
  const reply = (status, page) => {
    if (!wantsJson) {
      res.statusCode = 303
      res.setHeader('Location', page)
      return res.end()
    }
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ ok: status < 300 }))
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return reply(405, '/nieuwsbrief')
  }

  const body = await readBody(req)
  // Honeypot: mensen zien het veld "website" niet, bots vullen het in. Doen alsof het gelukt is.
  if (body.website) return reply(200, '/nieuwsbrief/check-je-mail')

  const email = String(body.email || '').trim().toLowerCase()
  if (email.length > 254 || !EMAIL.test(email)) return reply(400, '/nieuwsbrief?fout=email')

  const { BREVO_API_KEY, BREVO_LIST_ID, BREVO_DOI_TEMPLATE_ID } = process.env
  if (!BREVO_API_KEY || !BREVO_LIST_ID || !BREVO_DOI_TEMPLATE_ID) {
    console.error('Nieuwsbrief: BREVO_API_KEY, BREVO_LIST_ID of BREVO_DOI_TEMPLATE_ID ontbreekt')
    return reply(503, '/nieuwsbrief?fout=server')
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email,
        includeListIds: [Number(BREVO_LIST_ID)],
        templateId: Number(BREVO_DOI_TEMPLATE_ID),
        redirectionUrl: `${siteOrigin()}/nieuwsbrief/bevestigd`
      }),
      signal: AbortSignal.timeout(8000)
    })
    if (!response.ok) {
      console.error('Nieuwsbrief: Brevo gaf status', response.status, await response.text())
      return reply(502, '/nieuwsbrief?fout=server')
    }
  } catch (error) {
    console.error('Nieuwsbrief: Brevo niet bereikbaar', error)
    return reply(502, '/nieuwsbrief?fout=server')
  }
  return reply(200, '/nieuwsbrief/check-je-mail')
}
