<script setup lang="ts">
const props = defineProps<{ enabled: boolean, text: string, analyticsId: string }>()

const consentKey = 'centaur-cookie-consent'
const visible = ref(false)

function loadAnalytics(id: string) {
  if (!id || document.querySelector(`script[data-centaur-analytics="${id}"]`)) return
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  script.dataset.centaurAnalytics = id
  document.head.appendChild(script)

  const inline = document.createElement('script')
  inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`
  document.head.appendChild(inline)
}

function maybeLoadAnalytics() {
  const hasConsent = localStorage.getItem(consentKey) === 'accepted'
  if (props.analyticsId && (!props.enabled || hasConsent)) {
    loadAnalytics(props.analyticsId)
  }
}

function accept() {
  localStorage.setItem(consentKey, 'accepted')
  visible.value = false
  maybeLoadAnalytics()
}

onMounted(() => {
  visible.value = props.enabled && localStorage.getItem(consentKey) !== 'accepted'
  maybeLoadAnalytics()
})
</script>

<template>
  <div v-if="visible" class="cms-cookie-banner" role="status" aria-live="polite">
    <p>{{ text }}</p>
    <button type="button" @click="accept">Accepteren</button>
  </div>
</template>

<style scoped>
.cms-cookie-banner {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #111;
  color: #fff;
  z-index: 100;
}
.cms-cookie-banner button {
  background: var(--brand-primary, #16a34a);
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
}
</style>
