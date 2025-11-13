<template>
  <div class="store-control">
    <div class="page-header">
      <h2>Store Control</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="refreshData">
          🔄 Actualizar
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
        :actions="actions"
        :loading="loading"
        :pagination="true"
        :items-per-page="20"
        :show-filters="true"
      >
        <template #filters>
          <input
            v-model="filters.search"
            type="text"
            class="input"
            placeholder="Buscar por número de documento..."
            style="max-width: 300px;"
          />
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
          <select v-model="filters.estado" class="select" style="max-width: 200px;">
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Transformado">Transformado</option>
            <option value="Enviado a SAP">Enviado a SAP</option>
            <option value="Error">Error</option>
          </select>
          <button class="btn btn-outline" @click="applyFilters">
            🔍 Filtrar
          </button>
          <button class="btn btn-outline" @click="clearFilters">
            🗑️ Limpiar
          </button>
        </template>

        <template #cell-estado="{ value }">
          <StatusBadge :status="value" />
        </template>

        <template #cell-fecha="{ value }">
          {{ formatters.date(value) }}
        </template>

        <template #cell-monto="{ value }">
          {{ formatters.currency(value) }}
        </template>
      </DataTable>
    </div>

    <!-- Modal de detalle -->
    <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Detalle del Documento</h3>
          <button class="modal-close" @click="closeDetailModal">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedDocument" class="detail-content">
            <div class="detail-section">
              <h4>Información General</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Número:</span>
                  <span class="detail-value">{{ selectedDocument.numero }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Fecha:</span>
                  <span class="detail-value">{{ formatters.date(selectedDocument.fecha) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Estado:</span>
                  <StatusBadge :status="selectedDocument.estado" />
                </div>
                <div class="detail-item">
                  <span class="detail-label">Cliente:</span>
                  <span class="detail-value">{{ selectedDocument.cliente }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Monto:</span>
                  <span class="detail-value">{{ formatters.currency(selectedDocument.monto) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>Artículos</h4>
              <table class="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in selectedDocument.articulos" :key="index">
                    <td>{{ item.codigo }}</td>
                    <td>{{ item.descripcion }}</td>
                    <td>{{ item.cantidad }}</td>
                    <td>{{ formatters.currency(item.precio) }}</td>
                    <td>{{ formatters.currency(item.total) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeControlService } from '@/services/storeControlService'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatters } from '@/utils/formatters'

const activeTab = ref('despachos')
const loading = ref(false)
const despachos = ref([])
const odc = ref([])
const filters = ref({
  search: '',
  fechaDesde: '',
  fechaHasta: '',
  estado: ''
})
const showDetailModal = ref(false)
const selectedDocument = ref(null)

const toast = useToast()

const tabs = [
  { key: 'despachos', label: 'Despachos' },
  { key: 'odc', label: 'Órdenes de Compra' }
]

const tableData = computed(() => {
  return activeTab.value === 'despachos' ? despachos.value : odc.value
})

const columns = computed(() => {
  if (activeTab.value === 'despachos') {
    return [
      { key: 'numero', label: 'Número' },
      { key: 'fecha', label: 'Fecha', format: 'date' },
      { key: 'cliente', label: 'Cliente' },
      { key: 'monto', label: 'Monto', format: 'currency' },
      { key: 'estado', label: 'Estado' }
    ]
  } else {
    return [
      { key: 'numero', label: 'Número ODC' },
      { key: 'fecha', label: 'Fecha', format: 'date' },
      { key: 'despachoOrigen', label: 'Despacho Origen' },
      { key: 'monto', label: 'Monto', format: 'currency' },
      { key: 'estado', label: 'Estado' }
    ]
  }
})

const actions = computed(() => {
  return [
    {
      key: 'view',
      label: 'Ver',
      class: 'btn-outline',
      title: 'Ver detalle',
      handler: (row) => viewDetail(row)
    }
  ]
})

async function loadDespachos() {
  loading.value = true
  try {
    const data = await storeControlService.getDespachos(filters.value)
    despachos.value = data.despachos || []
  } catch (error) {
    toast.error('Error al cargar despachos')
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function loadODC() {
  loading.value = true
  try {
    const data = await storeControlService.getODC(filters.value)
    odc.value = data.odc || []
  } catch (error) {
    toast.error('Error al cargar ODC')
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  if (activeTab.value === 'despachos') {
    await loadDespachos()
  } else {
    await loadODC()
  }
  toast.success('Datos actualizados')
}

function applyFilters() {
  refreshData()
}

function clearFilters() {
  filters.value = {
    search: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: ''
  }
  refreshData()
}

async function viewDetail(document) {
  try {
    if (activeTab.value === 'despachos') {
      const data = await storeControlService.getDespachoById(document.id)
      selectedDocument.value = data.despacho
    } else {
      const data = await storeControlService.getODCById(document.id)
      selectedDocument.value = data.odc
    }
    showDetailModal.value = true
  } catch (error) {
    toast.error('Error al cargar detalle')
    console.error(error)
  }
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedDocument.value = null
}

watch(activeTab, () => {
  refreshData()
})

onMounted(() => {
  loadDespachos()
})
</script>

<style lang="scss" scoped>
.store-control {
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
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--bg-color);
  border-radius: 8px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
  }
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0.25rem;

  &:hover {
    color: var(--text-color);
  }
}

.modal-body {
  padding: 1.5rem;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.detail-section {
  h4 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-value {
  font-size: 1rem;
  color: var(--text-color);
}
</style>

