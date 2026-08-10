<script setup lang="ts">
defineProps<{ message: string, siteName: string }>()
</script>

<template>
  <main class="cms-maintenance">
    <h1>{{ siteName }}</h1>
    <p>{{ message }}</p>
  </main>
</template>

<style scoped>
.cms-maintenance {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
  padding: 2rem;
}
</style>
