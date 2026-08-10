<script setup lang="ts">
const { getSiteSettings } = useCms()
const { data: site } = await useAsyncData('site-settings', () => getSiteSettings())
</script>

<template>
  <div>
    <SiteHeader :site-name="site?.siteName ?? ''" />
    <slot />
    <SiteFooter
      :site-name="site?.siteName ?? ''"
      :instagram="site?.instagram ?? ''"
      :facebook="site?.facebook ?? ''"
      :linked-in="site?.linkedIn ?? ''"
      :twitter="site?.twitter ?? ''"
    />
  </div>
</template>
