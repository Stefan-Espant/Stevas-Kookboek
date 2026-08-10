export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  runtimeConfig: {
    centaurWebhookSecret: process.env.CENTAUR_WEBHOOK_SECRET ?? '',
    public: {
      centaurApiBase: process.env.CENTAUR_API_BASE ?? '',
      centaurApiKey: process.env.CENTAUR_API_KEY ?? '',
      centaurTenantSlug: process.env.CENTAUR_TENANT_SLUG ?? ''
    }
  }
})
