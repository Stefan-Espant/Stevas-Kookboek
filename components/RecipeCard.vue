<script setup lang="ts">
import type { RecipeSummary } from '~/composables/useRecipes'

const props = defineProps<{ recipe: RecipeSummary }>()

const totalTime = computed(() => props.recipe.prepTime + props.recipe.cookTime)
</script>

<template>
  <NuxtLink :to="`/${recipe.slug}`" class="recipe-card">
    <img v-if="recipe.image" :src="recipe.image" :alt="recipe.title" class="recipe-card__image" />
    <div class="recipe-card__body">
      <h3 class="recipe-card__title">{{ recipe.title }}</h3>
      <div class="recipe-card__meta">
        <span v-if="totalTime > 0" class="recipe-card__badge">{{ totalTime }} min</span>
        <span v-if="recipe.difficulty" class="recipe-card__badge">{{ recipe.difficulty }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.recipe-card {
  display: block;
  border-radius: 1rem;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 12px rgba(18, 86, 104, 0.12);
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease;
}
.recipe-card:hover {
  transform: translateY(-4px);
}
.recipe-card__image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
}
.recipe-card__body {
  padding: 1rem;
}
.recipe-card__title {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  color: #125668;
}
.recipe-card__meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.recipe-card__badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  background: #ff775c;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
