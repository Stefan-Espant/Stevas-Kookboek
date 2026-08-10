<script setup lang="ts">
import type { CentaurSiteSettings } from '~/composables/useCms'

const route = useRoute()
const { getPage, getBlockTypes } = useCms()

const slug = computed(() =>
  Array.isArray(route.params.slug)
    ? route.params.slug.join('/') || 'home'
    : route.params.slug || 'home'
)

const { data: site } = useNuxtData<CentaurSiteSettings | null>('site-settings')
const [{ data: page }, { data: blockTypes }] = await Promise.all([
  useAsyncData(`page-${slug.value}`, () => getPage(slug.value)),
  useAsyncData('block-types', () => getBlockTypes())
])

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Pagina niet gevonden' })
}

useHead(() => ({
  title: page.value?.metaTitle ?? page.value?.title,
  meta: [
    { name: 'description', content: page.value?.metaDescription },
    { property: 'og:title', content: page.value?.ogTitle ?? page.value?.metaTitle ?? page.value?.title },
    { property: 'og:description', content: page.value?.ogDescription ?? page.value?.metaDescription },
    ...(page.value?.ogImage ?? site.value?.defaultOgImageUrl
      ? [{ property: 'og:image', content: page.value?.ogImage ?? site.value?.defaultOgImageUrl }]
      : [])
  ],
  link: page.value?.canonicalUrl ? [{ rel: 'canonical', href: page.value.canonicalUrl }] : []
}))
</script>

<template>
  <div v-if="page">
    <h1>{{ page.title }}</h1>
    <BlockRenderer :blocks="page.body" :block-types="blockTypes ?? []" />
  </div>
</template>
