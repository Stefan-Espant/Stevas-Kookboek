<script setup lang="ts">
defineProps<{
  siteName: string
  instagram: string
  facebook: string
  linkedIn: string
  twitter: string
}>()
</script>

<template>
  <footer class="site-footer">
    <img src="/logo.svg" alt="" class="site-footer__logo" />
    <nav class="site-footer__nav" aria-label="Footernavigatie">
      <NuxtLink to="/">Home</NuxtLink>
      <NuxtLink to="/recepten">Recepten</NuxtLink>
      <NuxtLink to="/over">Over</NuxtLink>
      <NuxtLink to="/contact">Contact</NuxtLink>
    </nav>
    <div class="site-footer__social">
      <a v-if="instagram" :href="instagram" target="_blank" rel="noopener">Instagram</a>
      <a v-if="facebook" :href="facebook" target="_blank" rel="noopener">Facebook</a>
      <a v-if="linkedIn" :href="linkedIn" target="_blank" rel="noopener">LinkedIn</a>
      <a v-if="twitter" :href="twitter" target="_blank" rel="noopener">Twitter</a>
    </div>
    <p class="site-footer__copyright">&copy; {{ new Date().getFullYear() }} {{ siteName }}</p>
  </footer>
</template>

<style scoped>
.site-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1.5rem 2rem;
  background: #125668;
  color: #fff;
  text-align: center;
}
.site-footer__logo {
  height: 2rem;
  width: auto;
  filter: brightness(0) invert(1);
}
.site-footer__nav,
.site-footer__social {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  justify-content: center;
}
.site-footer__nav a,
.site-footer__social a {
  color: #fff;
  text-decoration: none;
  font-weight: 600;
}
.site-footer__nav a:hover,
.site-footer__social a:hover {
  color: #ff775c;
}
.site-footer__copyright {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.8;
}
</style>
