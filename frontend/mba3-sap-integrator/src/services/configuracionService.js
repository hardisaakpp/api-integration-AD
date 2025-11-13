import api from './api'

export const configuracionService = {
  // Obtener configuración
  async getConfiguracion() {
    const response = await api.get('/configuracion')
    return response.data
  },

  // Actualizar configuración
  async updateConfiguracion(config) {
    const response = await api.put('/configuracion', config)
    return response.data
  },

  // Obtener perfiles de conexión
  async getPerfiles() {
    const response = await api.get('/configuracion/perfiles')
    return response.data
  },

  // Guardar perfil de conexión
  async savePerfil(perfil) {
    const response = await api.post('/configuracion/perfiles', perfil)
    return response.data
  },

  // Eliminar perfil
  async deletePerfil(id) {
    const response = await api.delete(`/configuracion/perfiles/${id}`)
    return response.data
  }
}

