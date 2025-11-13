<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <router-view />
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { useAppStore } from './stores/app'

const appStore = useAppStore()
const isDarkMode = computed(() => appStore.isDarkMode)

// Aplicar dark mode al body también para mejor compatibilidad
watch(isDarkMode, (value) => {
  if (value) {
    document.documentElement.classList.add('dark-mode')
    document.body.classList.add('dark-mode')
  } else {
    document.documentElement.classList.remove('dark-mode')
    document.body.classList.remove('dark-mode')
  }
}, { immediate: true })

onMounted(() => {
  // Aplicar el estado inicial
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-mode')
    document.body.classList.add('dark-mode')
  }
})
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>

