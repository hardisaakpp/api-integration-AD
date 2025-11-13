<template>
  <div class="auditoria">
    <div class="page-header">
      <h2>Auditoría y Trazabilidad</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="exportarExcel">
          📊 Exportar Excel
        </button>
        <button class="btn btn-outline" @click="exportarCSV">
          📄 Exportar CSV
        </button>
      </div>
    </div>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-button"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="content-section">
      <DataTable
        :data="tableData"
        :columns="columns"
        :loading="loading"
        :pagination="true"
        :show-filters="true"
      >
        <template #filters>
          <input
            v-model="filters.search"
            type="text"
            class="input"
            placeholder="Buscar por usuario o acción..."
            style="max-width: 300px;"
          />
          <select v-model="filters.tipoAccion" class="select" style="max-width: 200px;">
            <option value="">Todas las acciones</option>
            <option value="transformacion">Transformación</option>
            <option value="envio_sap">Envío SAP</option>
            <option value="correccion">Corrección</option>
            <option value="configuracion">Configuración</option>
          </select>
          <input
            v-model="filters.fechaDesde"
            type="date"
            class="input"
            style="max-width: 200px;"
          />
          <input
            v-model="filters.fechaHasta"
            type="date"
            class="input"
            style="max-width: 200px;"
          />
          <button class="btn btn-outline" @click="applyFilters">
            🔍 Filtrar
          </button>
          <button class="btn btn-outline" @click="clearFilters">
            🗑️ Limpiar
          </button>
        </template>

        <template #cell-fecha="{ value }">
          {{ formatters.datetime(value) }}
        </template>

        <template #cell-resultado="{ value }">
          <StatusBadge :status="value === 'exitoso' ? 'Enviado a SAP' : value === 'error' ? 'Error' : 'Pendiente'" />
        </template>
      </DataTable>
    </div>

    <!-- Historial de Sincronizaciones -->
    <div v-if="activeTab === 'sincronizaciones'" class="content-section">
      <h3>Historial de Sincronizaciones</h3>
      <div class="sync-list">
        <div v-for="sync in sincronizaciones" :key="sync.id" class="sync-item">
          <div class="sync-header">
            <div class="sync-info">
              <div class="sync-title">{{ sync.tipo }} - {{ sync.descripcion }}</div>
              <div class="sync-meta">
                {{ formatters.datetime(sync.fechaInicio) }} - 
                {{ formatters.datetime(sync.fechaFin) }}
              </div>
            </div>
            <StatusBadge :status="sync.estado" />
          </div>
          <div class="sync-details">
            <div class="sync-stat">
              <span class="stat-label">Documentos procesados:</span>
              <span class="stat-value">{{ sync.documentosProcesados }}</span>
            </div>
            <div class="sync-stat">
              <span class="stat-label">Exitosos:</span>
              <span class="stat-value success">{{ sync.exitosos }}</span>
            </div>
            <div class="sync-stat">
              <span class="stat-label">Con error:</span>
              <span class="stat-value error">{{ sync.conError }}</span>
            </div>
            <div class="sync-stat">
              <span class="stat-label">Tiempo total:</span>
              <span class="stat-value">{{ sync.tiempoTotal }}s</span>
            </div>
          </div>
          <div v-if="sync.logs && sync.logs.length > 0" class="sync-logs">
            <details>
              <summary>Ver logs</summary>
              <pre>{{ sync.logs }}</pre>
            </details>
          </div>
        </div>
        <div v-if="sincronizaciones.length === 0" class="empty-state">
          No hay sincronizaciones registradas
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { auditoriaService } from '@/services/auditoriaService'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatters } from '@/utils/formatters'

const activeTab = ref('registros')
const loading = ref(false)
const registros = ref([])
const sincronizaciones = ref([])
const filters = ref({
  search: '',
  tipoAccion: '',
  fechaDesde: '',
  fechaHasta: ''
})

const toast = useToast()

const tabs = [
  { key: 'registros', label: 'Registros de Auditoría' },
  { key: 'sincronizaciones', label: 'Sincronizaciones' }
]

const tableData = computed(() => {
  return registros.value
})

const columns = computed(() => {
  return [
    { key: 'fecha', label: 'Fecha y Hora', format: 'datetime' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'accion', label: 'Acción' },
    { key: 'documento', label: 'Documento' },
    { key: 'resultado', label: 'Resultado' },
    { key: 'detalles', label: 'Detalles' }
  ]
})

async function loadRegistros() {
  loading.value = true
  try {
    const data = await auditoriaService.getRegistros(filters.value)
    registros.value = data.registros || []
  } catch (error) {
    toast.error('Error al cargar registros')
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function loadSincronizaciones() {
  loading.value = true
  try {
    const data = await auditoriaService.getHistorialSincronizaciones(filters.value)
    sincronizaciones.value = data.sincronizaciones || []
  } catch (error) {
    toast.error('Error al cargar sincronizaciones')
    console.error(error)
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  if (activeTab.value === 'registros') {
    loadRegistros()
  } else {
    loadSincronizaciones()
  }
}

function clearFilters() {
  filters.value = {
    search: '',
    tipoAccion: '',
    fechaDesde: '',
    fechaHasta: ''
  }
  applyFilters()
}

async function exportarExcel() {
  try {
    const blob = await auditoriaService.exportarExcel(filters.value)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success('Archivo Excel exportado exitosamente')
  } catch (error) {
    toast.error('Error al exportar Excel')
    console.error(error)
  }
}

async function exportarCSV() {
  try {
    const blob = await auditoriaService.exportarCSV(filters.value)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success('Archivo CSV exportado exitosamente')
  } catch (error) {
    toast.error('Error al exportar CSV')
    console.error(error)
  }
}

watch(activeTab, () => {
  if (activeTab.value === 'registros') {
    loadRegistros()
  } else {
    loadSincronizaciones()
  }
})

onMounted(() => {
  loadRegistros()
})
</script>

<style lang="scss" scoped>
.auditoria {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
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

.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--border-color);
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s;
  margin-bottom: -2px;

  &:hover {
    color: var(--text-color);
  }

  &.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
  }
}

.content-section {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }
}

.sync-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sync-item {
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.sync-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.sync-info {
  flex: 1;
}

.sync-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.sync-meta {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.sync-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.sync-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;

  &.success {
    color: var(--success-color);
  }

  &.error {
    color: var(--error-color);
  }
}

.sync-logs {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);

  details {
    summary {
      cursor: pointer;
      font-weight: 500;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }

    pre {
      background: var(--bg-color);
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 0.875rem;
      margin: 0;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}
</style>

