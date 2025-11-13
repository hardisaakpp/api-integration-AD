import api from './api'

export const sapService = {
  // Enviar ODC a SAP
  async enviarODC(odcId) {
    const response = await api.post(`/sap/enviar/${odcId}`)
    return response.data
  },

  // Reenviar documento a SAP
  async reenviarDocumento(documentoId) {
    const response = await api.post(`/sap/reenviar/${documentoId}`)
    return response.data
  },

  // Obtener estado de envío
  async getEstadoEnvio(documentoId) {
    const response = await api.get(`/sap/estado/${documentoId}`)
    return response.data
  },

  // Obtener logs de SAP
  async getLogs(params = {}) {
    const response = await api.get('/sap/logs', { params })
    return response.data
  },

  // Obtener respuesta de SAP
  async getRespuestaSAP(documentoId) {
    const response = await api.get(`/sap/respuesta/${documentoId}`)
    return response.data
  },

  // Test de conexión con SAP
  async testConexion() {
    const response = await api.get('/sap/test-conexion')
    return response.data
  }
}

