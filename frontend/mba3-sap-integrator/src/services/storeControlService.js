import api from './api'

export const storeControlService = {
  // Obtener despachos
  async getDespachos(params = {}) {
    const response = await api.get('/store-control/despachos', { params })
    return response.data
  },

  // Obtener detalle de despacho
  async getDespachoById(id) {
    const response = await api.get(`/store-control/despachos/${id}`)
    return response.data
  },

  // Obtener ODC generadas
  async getODC(params = {}) {
    const response = await api.get('/store-control/odc', { params })
    return response.data
  },

  // Obtener detalle de ODC
  async getODCById(id) {
    const response = await api.get(`/store-control/odc/${id}`)
    return response.data
  },

  // Actualizar estado de documento
  async updateEstado(id, estado) {
    const response = await api.patch(`/store-control/documentos/${id}/estado`, { estado })
    return response.data
  }
}

