<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>Dashboard</h2>
      <div class="period-selector">
        <button
          v-for="period in periods"
          :key="period.value"
          class="btn"
          :class="selectedPeriod === period.value ? 'btn-primary' : 'btn-outline'"
          @click="selectedPeriod = period.value"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">📄</div>
        <div class="metric-content">
          <div class="metric-label">Despachos Procesados</div>
          <div class="metric-value">{{ metricas.despachosProcesados || 0 }}</div>
          <div class="metric-change positive">+12% vs período anterior</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">✅</div>
        <div class="metric-content">
          <div class="metric-label">Órdenes Exitosas</div>
          <div class="metric-value">{{ metricas.ordenesExitosas || 0 }}</div>
          <div class="metric-change positive">+8% vs período anterior</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">❌</div>
        <div class="metric-content">
          <div class="metric-label">Órdenes con Error</div>
          <div class="metric-value">{{ metricas.ordenesError || 0 }}</div>
          <div class="metric-change negative">-5% vs período anterior</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">⏱️</div>
        <div class="metric-content">
          <div class="metric-label">Tiempo Promedio</div>
          <div class="metric-value">{{ metricas.tiempoPromedio || '0' }}s</div>
          <div class="metric-change positive">-2s vs período anterior</div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <h3>Despachos Procesados</h3>
        <div class="chart-container">
          <canvas ref="despachosChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <h3>Estado de Órdenes</h3>
        <div class="chart-container">
          <canvas ref="estadoChart"></canvas>
        </div>
      </div>
    </div>

    <div class="recent-activity">
      <h3>Actividad Reciente</h3>
      <div class="activity-list">
        <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
          <div class="activity-icon" :class="activity.type">
            {{ activity.icon }}
          </div>
          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-time">{{ activity.time }}</div>
          </div>
          <StatusBadge :status="activity.status" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import { dashboardService } from '@/services/dashboardService'
import { useToast } from 'vue-toastification'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatters } from '@/utils/formatters'

Chart.register(...registerables)

const selectedPeriod = ref('today')
const metricas = ref({})
const recentActivities = ref([])
const toast = useToast()

const despachosChart = ref(null)
const estadoChart = ref(null)

const periods = [
  { label: 'Hoy', value: 'today' },
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
  { label: 'Año', value: 'year' }
]

let despachosChartInstance = null
let estadoChartInstance = null

async function loadMetricas() {
  try {
    const data = await dashboardService.getMetricas(selectedPeriod.value)
    metricas.value = data.metricas || {}
    recentActivities.value = data.actividadesRecientes || []
    
    updateCharts(data)
  } catch (error) {
    toast.error('Error al cargar métricas')
    console.error(error)
  }
}

function updateCharts(data) {
  // Gráfica de despachos procesados
  if (despachosChart.value) {
    if (despachosChartInstance) {
      despachosChartInstance.destroy()
    }
    
    despachosChartInstance = new Chart(despachosChart.value, {
      type: 'line',
      data: {
        labels: data.despachosLabels || [],
        datasets: [{
          label: 'Despachos Procesados',
          data: data.despachosData || [],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    })
  }

  // Gráfica de estado de órdenes
  if (estadoChart.value) {
    if (estadoChartInstance) {
      estadoChartInstance.destroy()
    }
    
    estadoChartInstance = new Chart(estadoChart.value, {
      type: 'doughnut',
      data: {
        labels: ['Exitosas', 'Con Error', 'Pendientes'],
        datasets: [{
          data: [
            data.ordenesExitosas || 0,
            data.ordenesError || 0,
            data.ordenesPendientes || 0
          ],
          backgroundColor: [
            '#10b981',
            '#ef4444',
            '#f59e0b'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    })
  }
}

watch(selectedPeriod, () => {
  loadMetricas()
})

onMounted(() => {
  loadMetricas()
})
</script>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  h2 {
    font-size: 1.75rem;
    font-weight: 700;
  }
}

.period-selector {
  display: flex;
  gap: 0.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  display: flex;
  gap: 1rem;
  align-items: center;
}

.metric-icon {
  font-size: 2.5rem;
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
}

.metric-change {
  font-size: 0.75rem;
  margin-top: 0.25rem;

  &.positive {
    color: var(--success-color);
  }

  &.negative {
    color: var(--error-color);
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
}

.chart-container {
  height: 300px;
  position: relative;
}

.recent-activity {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.activity-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-color);

  &.success {
    background: rgba(16, 185, 129, 0.1);
  }

  &.error {
    background: rgba(239, 68, 68, 0.1);
  }

  &.info {
    background: rgba(59, 130, 246, 0.1);
  }
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
</style>

