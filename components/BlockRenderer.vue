<script setup lang="ts">
import type { Component } from 'vue'
import type { CentaurBlockInstance, CentaurBlockType } from '~/composables/useCms'

interface RenderableField {
  key: string
  type: string
  value: unknown
}

interface RenderableBlock {
  block: CentaurBlockInstance
  fields: RenderableField[]
}

const props = withDefaults(defineProps<{
  blocks: CentaurBlockInstance[]
  blockTypes: CentaurBlockType[]
  overrides?: Record<string, Component>
  depth?: number
}>(), {
  overrides: () => ({}),
  depth: 0
})

const MAX_DEPTH = 10

const renderableBlocks = computed<RenderableBlock[]>(() => {
  if (props.depth >= MAX_DEPTH) {
    console.warn(`BlockRenderer: maximale nestdiepte (${MAX_DEPTH}) bereikt, verdere blokken worden niet gerenderd.`)
    return []
  }
  return props.blocks
    .map((block): RenderableBlock | null => {
      const blockType = props.blockTypes.find(bt => bt.slug === block._type)
      if (!blockType) {
        console.warn(`Onbekend bloktype "${block._type}", blok overgeslagen.`)
        return null
      }
      const fields = blockType.fields
        .filter(f => f.slug in block)
        .map(f => ({ key: f.slug, type: f.type, value: block[f.slug] }))
      return { block, fields }
    })
    .filter((b): b is RenderableBlock => b !== null)
})
</script>

<template>
  <template v-for="{ block, fields } in renderableBlocks" :key="block._id">
    <component :is="overrides[block._type]" v-if="overrides[block._type]" v-bind="block" />
    <div v-else :class="`cms-block cms-block--${block._type}`">
      <div v-for="field in fields" :key="field.key" :class="`cms-field cms-field--${field.key}`">
        <BlockRenderer
          v-if="field.type === 'blocks'"
          :blocks="(field.value as CentaurBlockInstance[]) ?? []"
          :block-types="blockTypes"
          :overrides="overrides"
          :depth="depth + 1"
        />
        <div v-else-if="field.type === 'repeater'" class="cms-repeater">
          <!--
            Repeater-rijen hebben momenteel geen betrouwbare veld-type-metadata (het
            bloktype-formulier in het CMS heeft nog geen UI om sub-velden van een repeater
            te configureren) — waardes worden daarom best-effort als platte tekst getoond.
            Registreer een override voor dit bloktype als je een eigen weergave wilt.
          -->
          <div v-for="(item, i) in (field.value as Record<string, unknown>[]) ?? []" :key="i" class="cms-repeater-item">
            <span v-for="[itemKey, itemValue] in Object.entries(item ?? {})" :key="itemKey" class="cms-repeater-value">
              {{ itemValue }}
            </span>
          </div>
        </div>
        <BlockField v-else :type="field.type" :value="field.value" />
      </div>
    </div>
  </template>
</template>
