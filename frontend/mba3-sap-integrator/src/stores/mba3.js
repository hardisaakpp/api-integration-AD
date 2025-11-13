import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mba3Service } from '@/services/mba3Service'

export const useMBA3Store = defineStore('mba3', () => {
  const token = ref(localStorage.getItem('mba3_token') || null)
  const baseUrl = ref(localStorage.getItem('mba3_base_url') || '')
  const codigo = ref(localStorage.getItem('mba3_codigo') || '')
  
  // Hacer las propiedades reactivas para que se puedan modificar desde fuera
  function setBaseUrl(url) {
    baseUrl.value = url
    if (url) {
      localStorage.setItem('mba3_base_url', url)
    } else {
      localStorage.removeItem('mba3_base_url')
    }
  }
  
  function setCodigo(cod) {
    codigo.value = cod
    if (cod) {
      localStorage.setItem('mba3_codigo', cod)
    } else {
      localStorage.removeItem('mba3_codigo')
    }
  }
  
  const isTokenValid = computed(() => {
    if (!token.value) return false
    
    const tokenInfo = mba3Service.decodeToken(token.value)
    if (!tokenInfo || !tokenInfo.expiresAt) return true // Si no tiene expiración, asumimos válido
    
    const expiresAt = new Date(tokenInfo.expiresAt)
    return expiresAt > new Date()
  })

  const tokenInfo = computed(() => {
    if (!token.value) return null
    return mba3Service.decodeToken(token.value)
  })

  async function login(url, codigoServicio, pwd) {
    try {
      const result = await mba3Service.getToken(url, codigoServicio, pwd)
      token.value = result.token
      baseUrl.value = url
      codigo.value = codigoServicio
      
      localStorage.setItem('mba3_token', token.value)
      localStorage.setItem('mba3_base_url', url)
      localStorage.setItem('mba3_codigo', codigoServicio)
      
      return { success: true, token: token.value }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al obtener token'
      }
    }
  }

  function logout() {
    token.value = null
    baseUrl.value = ''
    codigo.value = ''
    localStorage.removeItem('mba3_token')
    localStorage.removeItem('mba3_base_url')
    localStorage.removeItem('mba3_codigo')
  }

  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('mba3_token', newToken)
    } else {
      localStorage.removeItem('mba3_token')
    }
  }

  return {
    token,
    baseUrl,
    codigo,
    isTokenValid,
    tokenInfo,
    login,
    logout,
    setToken,
    setBaseUrl,
    setCodigo
  }
})

