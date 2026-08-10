<script setup lang="ts">
defineProps<{
  type: string
  value: unknown
}>()

function formatDate(value: unknown): string {
  const date = new Date(String(value))
  return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('nl-NL')
}
</script>

<template>
  <!-- richtext komt van je eigen CMS-redacteuren, niet van bezoekers — hier ongesaneerd
       renderen is veilig zolang je alleen vertrouwde gebruikers schrijftoegang geeft. -->
  <div v-if="type === 'richtext'" v-html="value"></div>
  <!-- media-velden bevatten alleen een URL, geen alt-tekst (nog geen CMS-veld daarvoor) -->
  <img v-else-if="type === 'media'" :src="String(value ?? '')" alt="" />
  <template v-else-if="type === 'date' || type === 'datetime'">{{ formatDate(value) }}</template>
  <template v-else-if="type === 'boolean'"><!-- layout-flag, standaard niet zichtbaar --></template>
  <template v-else>{{ value }}</template>
</template>
