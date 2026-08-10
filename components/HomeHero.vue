<script setup lang="ts">
defineProps<{ siteName: string, tagline: string }>()
</script>

<template>
  <section class="home-hero">
    <div class="home-hero__content">
      <h1 class="home-hero__title">{{ siteName }}</h1>
      <p v-if="tagline" class="home-hero__tagline">{{ tagline }}</p>
      <NuxtLink to="/recepten" class="home-hero__cta">Bekijk alle recepten</NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Tijdelijke gradient i.p.v. sfeerfoto (nog geen eigen foto beschikbaar,
     zie het groeiplan). Vervang zodra er een foto is:
     background: url('/hero.jpg') center / cover no-repeat; */
  background: linear-gradient(135deg, #125668 0%, #ef6a70 100%);
  color: #fff;
  text-align: center;
  padding: 2rem;
}
.home-hero__title {
  font-family: 'Veneer', Georgia, serif;
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  margin: 0 0 0.5rem;
}
.home-hero__tagline {
  font-family: 'Grafolita Script', 'Brush Script MT', cursive;
  font-size: clamp(1.25rem, 3vw, 2rem);
  margin: 0 0 1.5rem;
}
.home-hero__cta {
  display: inline-block;
  background: #ef6a70;
  color: #fff;
  padding: 0.75rem 1.75rem;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
}
.home-hero__cta:hover {
  background: #ff775c;
}
</style>
