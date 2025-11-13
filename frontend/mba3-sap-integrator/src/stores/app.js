import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  // Inicializar desde localStorage o usar false por defecto
  const savedDarkMode = localStorage.getItem('darkMode')
  const isDarkMode = ref(savedDarkMode === 'true')
  const loading = ref(false)

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem('darkMode', String(isDarkMode.value))
  }

  function setDarkMode(value) {
    isDarkMode.value = value
    localStorage.setItem('darkMode', String(value))
  }

  function setLoading(value) {
    loading.value = value
  }

  return {
    isDarkMode,
    loading,
    toggleDarkMode,
    setDarkMode,
    setLoading
  }
})

