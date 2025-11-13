import api from './api'

export const transformacionService = {
  // Transformar despachos Rayo a ODC
  async transformarDespachos(despachoIds) {
    const response = await api.post('/transformacion/transformar', { despachoIds })
    return response.data
  },

  // Obtener estado de transformación
  async getEstadoTransformacion(id) {
    const response = await api.get(`/transformacion/estado/${id}`)
    return response.data
  },

  // Corregir datos antes de enviar
  async corregirDatos(documentoId, datos) {
    const response = await api.patch(`/transformacion/corregir/${documentoId}`, datos)
    return response.data
  },

  // Validar datos antes de transformar
  async validarDatos(despachoIds) {
    const response = await api.post('/transformacion/validar', { despachoIds })
    return response.data
  }
}

