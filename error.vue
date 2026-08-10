<script setup lang="ts">
defineProps<{ error: { statusCode: number, statusMessage?: string } }>()
const { getSiteSettings } = useCms()
const { data: site } = await useAsyncData('site-settings', () => getSiteSettings())

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <main class="cms-error">
    <h1>{{ site?.siteName ?? 'Centaur' }}</h1>
    <p v-if="error.statusCode === 404">Deze pagina bestaat niet.</p>
    <p v-else>Er ging iets mis ({{ error.statusCode }}).</p>
    <button type="button" @click="goHome">Terug naar de homepage</button>
  </main>
</template>

<style scoped>
.cms-error {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1rem;
  padding: 2rem;
}
.cms-error button {
  background: var(--brand-primary, #16a34a);
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1.25rem;
  cursor: pointer;
}
</style>
