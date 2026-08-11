<script setup lang="ts">
defineProps<{ siteName: string, tagline: string }>()
</script>

<template>
  <section class="home-hero">
    <HeroScene class="home-hero__scene" />
    <div class="home-hero__content">
      <h1 class="home-hero__title">{{ siteName }}</h1>
      <p v-if="tagline" class="home-hero__tagline">{{ tagline }}</p>
      <NuxtLink to="/recepten" class="home-hero__cta">Bekijk alle recepten</NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  position: relative;
  overflow: hidden;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Tijdelijke gradient i.p.v. sfeerfoto (nog geen eigen foto beschikbaar,
     zie het groeiplan). Vervang zodra er een foto is:
     background: url('/hero.jpg') center / cover no-repeat.
     Blijft ook staan als fallback: zichtbaar totdat de 3D-scene laadt, en
     permanent zichtbaar wanneer de bezoeker prefers-reduced-motion heeft
     ingesteld (HeroScene doet dan bewust niets). */
  background: linear-gradient(135deg, #125668 0%, #ef6a70 100%);
  color: #fff;
  text-align: center;
  padding: 2rem;
}
.home-hero__scene {
  position: absolute;
  inset: 0;
}
.home-hero__content {
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
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
