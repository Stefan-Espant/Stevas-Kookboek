<script setup lang="ts">
const { getPage, getSiteSettings } = useCms()
const { getLatestRecipes } = useRecipes()

const [{ data: page }, { data: site }, { data: recipes }] = await Promise.all([
  useAsyncData('page-home', () => getPage('home')),
  useAsyncData('site-settings', () => getSiteSettings()),
  useAsyncData('latest-recipes', () => getLatestRecipes(6))
])

useHead(() => ({
  title: page.value?.metaTitle ?? page.value?.title ?? site.value?.siteName,
  meta: [
    { name: 'description', content: page.value?.metaDescription ?? site.value?.tagline }
  ]
}))
</script>

<template>
  <div class="home">
    <HomeHero :site-name="site?.siteName ?? ''" :tagline="site?.tagline ?? ''" />
    <section class="home__recipes">
      <h2 class="home__recipes-title">Nieuwste recepten</h2>
      <div v-if="recipes && recipes.length" class="home__recipes-grid">
        <RecipeCard v-for="recipe in recipes" :key="recipe.slug" :recipe="recipe" />
      </div>
      <p v-else class="home__recipes-empty">Binnenkort verschijnen hier de eerste recepten!</p>
    </section>
  </div>
</template>

<style scoped>
.home {
  background: #faf6f0;
  min-height: 100vh;
}
.home__recipes {
  max-width: 72rem;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}
.home__recipes-title {
  font-family: 'Veneer', Georgia, serif;
  color: #125668;
  font-size: 2rem;
  margin: 0 0 1.5rem;
}
.home__recipes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
@media (max-width: 768px) {
  .home__recipes-grid {
    grid-template-columns: 1fr;
  }
}
.home__recipes-empty {
  color: #125668;
  opacity: 0.7;
}
</style>
