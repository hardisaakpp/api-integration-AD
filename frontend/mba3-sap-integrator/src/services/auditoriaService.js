import api from './api'

export const auditoriaService = {
  // Obtener registros de auditoría
  async getRegistros(params = {}) {
    const response = await api.get('/auditoria/registros', { params })
    return response.data
  },

  // Obtener historial de sincronizaciones
  async getHistorialSincronizaciones(params = {}) {
    const response = await api.get('/auditoria/sincronizaciones', { params })
    return response.data
  },

  // Exportar a Excel
  async exportarExcel(params = {}) {
    const response = await api.get('/auditoria/exportar/excel', { 
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // Exportar a CSV
  async exportarCSV(params = {}) {
    const response = await api.get('/auditoria/exportar/csv', { 
      params,
      responseType: 'blob'
    })
    return response.data
  }
}

