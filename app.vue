<script setup lang="ts">
const { getSiteSettings } = useCms()
const { data: site } = await useAsyncData('site-settings', () => getSiteSettings())

if (site.value?.maintenanceMode) {
  setResponseStatus(503)
}

const jsonLd = computed(() => {
  if (!site.value) return null
  const sameAs = [site.value.instagram, site.value.linkedIn, site.value.facebook, site.value.twitter].filter(Boolean)
  return {
    '@context': 'https://schema.org',
    '@type': site.value.schemaType || 'Organization',
    name: site.value.siteName,
    ...(site.value.logoUrl ? { logo: site.value.logoUrl } : {}),
    ...(sameAs.length ? { sameAs } : {})
  }
})

useHead(() => ({
  titleTemplate: site.value?.titleSuffix ? `%s ${site.value.titleSuffix}` : '%s',
  link: site.value?.faviconUrl ? [{ rel: 'icon', href: site.value.faviconUrl }] : [],
  script: jsonLd.value ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(jsonLd.value) }] : []
}))
</script>

<template>
  <div :style="site?.primaryColor ? { '--brand-primary': site.primaryColor } : {}">
    <MaintenanceScreen v-if="site?.maintenanceMode" :message="site.maintenanceMessage" :site-name="site.siteName" />
    <template v-else>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <CookieBanner
        v-if="site"
        :enabled="site.cookieBannerEnabled"
        :text="site.cookieBannerText"
        :analytics-id="site.analyticsId"
      />
    </template>
  </div>
</template>
