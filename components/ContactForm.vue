<script setup lang="ts">
const { submitForm } = useCms()

const name = ref('')
const email = ref('')
const message = ref('')
const sending = ref(false)
const success = ref(false)
const error = ref('')

async function handleSubmit() {
  if (!name.value.trim() || !email.value.trim()) return
  sending.value = true
  error.value = ''
  try {
    await submitForm('contact', {
      naam: name.value.trim(),
      email: email.value.trim(),
      bericht: message.value.trim()
    })
    success.value = true
    name.value = ''
    email.value = ''
    message.value = ''
  } catch (e) {
    error.value = 'Versturen mislukt. Probeer het later opnieuw.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div v-if="success">Bedankt voor je bericht!</div>
  <form v-else @submit.prevent="handleSubmit">
    <label>
      Naam
      <input v-model="name" type="text" required />
    </label>
    <label>
      E-mailadres
      <input v-model="email" type="email" required />
    </label>
    <label>
      Bericht
      <textarea v-model="message"></textarea>
    </label>
    <p v-if="error">{{ error }}</p>
    <button type="submit" :disabled="sending">{{ sending ? 'Versturen…' : 'Versturen' }}</button>
  </form>
</template>
