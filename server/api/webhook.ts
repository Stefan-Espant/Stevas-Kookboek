import { createHmac, timingSafeEqual } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const rawBody = await readRawBody(event, 'utf8') ?? ''
  const signatureHeader = getHeader(event, 'x-centaur-signature') ?? ''

  if (!isValidSignature(rawBody, signatureHeader, config.centaurWebhookSecret)) {
    throw createError({ statusCode: 401, statusMessage: 'Ongeldige signature' })
  }

  const payload = JSON.parse(rawBody) as { event: string, fired_at: string, data: unknown }

  // Plek voor je eigen rebuild/revalidate-trigger, bv. via je hosting-provider's deploy hook.
  console.log(`Centaur webhook ontvangen: ${payload.event}`)

  return { received: true }
})

function isValidSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  if (!signatureHeader.startsWith('sha256=') || !secret) return false
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  const provided = signatureHeader.slice('sha256='.length)
  const expectedBuf = Buffer.from(expected, 'utf8')
  const providedBuf = Buffer.from(provided, 'utf8')
  if (expectedBuf.length !== providedBuf.length) return false
  return timingSafeEqual(expectedBuf, providedBuf)
}
