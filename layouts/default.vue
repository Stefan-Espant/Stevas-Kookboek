<script setup lang="ts">
import type { CentaurSiteSettings } from '~/composables/useCms'

const { data: site } = useNuxtData<CentaurSiteSettings | null>('site-settings')
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
