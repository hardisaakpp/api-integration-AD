import api from './api'

export const dashboardService = {
  // Obtener métricas del dashboard
  async getMetricas(periodo = 'today') {
    const response = await api.get('/dashboard/metricas', { params: { periodo } })
    return response.data
  },

  // Obtener estadísticas de despachos
  async getEstadisticasDespachos(periodo = 'today') {
    const response = await api.get('/dashboard/estadisticas/despachos', { params: { periodo } })
    return response.data
  },

  // Obtener estadísticas de ODC
  async getEstadisticasODC(periodo = 'today') {
    const response = await api.get('/dashboard/estadisticas/odc', { params: { periodo } })
    return response.data
  },

  // Obtener tiempo promedio de integración
  async getTiempoPromedio(periodo = 'today') {
    const response = await api.get('/dashboard/tiempo-promedio', { params: { periodo } })
    return response.data
  }
}

