<script setup lang="ts">
defineProps<{ siteName: string }>()
</script>

<template>
  <header class="site-header">
    <NuxtLink to="/" class="site-header__brand">
      <img src="/logo.svg" alt="" class="site-header__logo" />
      <span class="site-header__name">{{ siteName }}</span>
    </NuxtLink>
    <nav class="site-header__nav" aria-label="Hoofdnavigatie">
      <NuxtLink to="/">Home</NuxtLink>
      <NuxtLink to="/recepten">Recepten</NuxtLink>
      <NuxtLink to="/over">Over</NuxtLink>
      <NuxtLink to="/contact">Contact</NuxtLink>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.site-header__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: #125668;
}
.site-header__logo {
  height: 2.5rem;
  width: auto;
}
.site-header__name {
  font-family: 'Veneer', Georgia, serif;
  font-size: 1.5rem;
}
.site-header__nav {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.site-header__nav a {
  color: #125668;
  text-decoration: none;
  font-weight: 600;
}
.site-header__nav a:hover {
  color: #ef6a70;
}
</style>
