<template>
  <div class="integracion-sap">
    <div class="page-header">
      <h2>Integración con SAP</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="testConexion">
          🧪 Test de Conexión
        </button>
        <button class="btn btn-outline" @click="loadLogs">
          🔄 Actualizar
        </button>
      </div>
    </div>

    <div class="status-cards">
      <div class="status-card success">
        <div class="status-icon">✅</div>
        <div class="status-content">
          <div class="status-label">Envíos Exitosos</div>
          <div class="status-value">{{ estadisticas.exitosos || 0 }}</div>
        </div>
      </div>
      <div class="status-card error">
        <div class="status-icon">❌</div>
        <div class="status-content">
          <div class="status-label">Envíos con Error</div>
          <div class="status-value">{{ estadisticas.conError || 0 }}</div>
        </div>
      </div>
      <div class="status-card warning">
        <div class="status-icon">⏳</div>
        <div class="status-content">
          <div class="status-label">Pendientes</div>
          <div class="status-value">{{ estadisticas.pendientes || 0 }}</div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <h3>Logs de Integración</h3>
      <DataTable
        :data="logs"
        :columns="columns"
        :actions="actions"
        :loading="loading"
        :pagination="true"
        :show-filters="true"
      >
        <template #filters>
          <input
            v-model="filters.search"
            type="text"
            class="input"
            placeholder="Buscar por documento..."
            style="max-width: 300px;"
          />
          <select v-model="filters.estado" class="select" style="max-width: 200px;">
            <option value="">Todos los estados</option>
            <option value="success">Exitoso</option>
            <option value="error">Error</option>
            <option value="pending">Pendiente</option>
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
        </template>

        <template #cell-estado="{ value }">
          <StatusBadge :status="value === 'success' ? 'Enviado a SAP' : value === 'error' ? 'Error' : 'Pendiente'" />
        </template>

        <template #cell-fechaEnvio="{ value }">
          {{ formatters.datetime(value) }}
        </template>
      </DataTable>
    </div>

    <!-- Modal de detalle de respuesta SAP -->
    <div v-if="showResponseModal" class="modal-overlay" @click="closeResponseModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Respuesta de SAP</h3>
          <button class="modal-close" @click="closeResponseModal">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="sapResponse" class="response-content">
            <div class="response-section">
              <h4>Información del Documento</h4>
              <div class="response-grid">
                <div class="response-item">
                  <span class="response-label">DocEntry:</span>
                  <span class="response-value">{{ sapResponse.docEntry || '-' }}</span>
                </div>
                <div class="response-item">
                  <span class="response-label">DocNum:</span>
                  <span class="response-value">{{ sapResponse.docNum || '-' }}</span>
                </div>
                <div class="response-item">
                  <span class="response-label">Estado:</span>
                  <StatusBadge :status="sapResponse.estado === 'success' ? 'Enviado a SAP' : 'Error'" />
                </div>
                <div class="response-item">
                  <span class="response-label">Fecha de Envío:</span>
                  <span class="response-value">{{ formatters.datetime(sapResponse.fechaEnvio) }}</span>
                </div>
              </div>
            </div>

            <div v-if="sapResponse.mensaje" class="response-section">
              <h4>Mensaje</h4>
              <div class="response-message" :class="sapResponse.estado">
                {{ sapResponse.mensaje }}
              </div>
            </div>

            <div v-if="sapResponse.error" class="response-section">
              <h4>Error</h4>
              <div class="response-error">
                <pre>{{ JSON.stringify(sapResponse.error, null, 2) }}</pre>
              </div>
            </div>

            <div v-if="sapResponse.payload" class="response-section">
              <h4>Payload Enviado</h4>
              <div class="response-payload">
                <pre>{{ JSON.stringify(sapResponse.payload, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeResponseModal">
            Cerrar
          </button>
          <button
            v-if="sapResponse && sapResponse.estado === 'error'"
            class="btn btn-primary"
            @click="reenviarDocumento"
            :disabled="reenviando"
          >
            <span v-if="reenviando" class="loading"></span>
            <span v-else>🔄 Reenviar a SAP</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { sapService } from '@/services/sapService'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatters } from '@/utils/formatters'

const loading = ref(false)
const logs = ref([])
const estadisticas = ref({})
const filters = ref({
  search: '',
  estado: '',
  fechaDesde: '',
  fechaHasta: ''
})
const showResponseModal = ref(false)
const sapResponse = ref(null)
const reenviando = ref(false)

const toast = useToast()

const columns = [
  { key: 'documentoNumero', label: 'Documento' },
  { key: 'tipoDocumento', label: 'Tipo' },
  { key: 'estado', label: 'Estado' },
  { key: 'fechaEnvio', label: 'Fecha de Envío', format: 'datetime' },
  { key: 'mensaje', label: 'Mensaje' }
]

const actions = computed(() => [
  {
    key: 'view',
    label: 'Ver Respuesta',
    class: 'btn-outline',
    title: 'Ver respuesta de SAP',
    handler: (row) => viewResponse(row)
  },
  {
    key: 'resend',
    label: 'Reenviar',
    class: 'btn-warning',
    title: 'Reenviar a SAP',
    handler: (row) => reenviar(row),
    show: (row) => row.estado === 'error'
  }
].filter(action => !action.show || action.show({ estado: 'error' })))

async function loadLogs() {
  loading.value = true
  try {
    const data = await sapService.getLogs(filters.value)
    logs.value = data.logs || []
    estadisticas.value = data.estadisticas || {}
  } catch (error) {
    toast.error('Error al cargar logs')
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function testConexion() {
  try {
    const resultado = await sapService.testConexion()
    if (resultado.conectado) {
      toast.success('Conexión con SAP exitosa')
    } else {
      toast.error('No se pudo conectar con SAP')
    }
  } catch (error) {
    toast.error('Error al probar conexión con SAP')
    console.error(error)
  }
}

async function viewResponse(log) {
  try {
    const data = await sapService.getRespuestaSAP(log.id)
    sapResponse.value = { ...data.respuesta, documentoId: log.documentoId }
    showResponseModal.value = true
  } catch (error) {
    toast.error('Error al cargar respuesta')
    console.error(error)
  }
}

async function reenviar(log) {
  if (!confirm('¿Desea reenviar este documento a SAP?')) {
    return
  }

  try {
    await sapService.reenviarDocumento(log.documentoId)
    toast.success('Documento reenviado exitosamente')
    await loadLogs()
  } catch (error) {
    toast.error('Error al reenviar documento')
    console.error(error)
  }
}

async function reenviarDocumento() {
  if (!sapResponse.value || !sapResponse.value.documentoId) return

  reenviando.value = true
  try {
    await sapService.reenviarDocumento(sapResponse.value.documentoId)
    toast.success('Documento reenviado exitosamente')
    closeResponseModal()
    await loadLogs()
  } catch (error) {
    toast.error('Error al reenviar documento')
    console.error(error)
  } finally {
    reenviando.value = false
  }
}

function closeResponseModal() {
  showResponseModal.value = false
  sapResponse.value = null
}

function applyFilters() {
  loadLogs()
}

onMounted(() => {
  loadLogs()
})
</script>

<style lang="scss" scoped>
.integracion-sap {
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

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.status-card {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 1rem;

  &.success {
    border-left: 4px solid var(--success-color);
  }

  &.error {
    border-left: 4px solid var(--error-color);
  }

  &.warning {
    border-left: 4px solid var(--warning-color);
  }
}

.status-icon {
  font-size: 2rem;
}

.status-content {
  flex: 1;
}

.status-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.status-value {
  font-size: 1.75rem;
  font-weight: 700;
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
    margin-bottom: 1rem;
  }
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

.response-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.response-section {
  h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
}

.response-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.response-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.response-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.response-value {
  font-size: 1rem;
  color: var(--text-color);
}

.response-message {
  padding: 1rem;
  border-radius: 6px;
  background: var(--bg-secondary);

  &.success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success-color);
  }

  &.error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--error-color);
  }
}

.response-error,
.response-payload {
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;

  pre {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-color);
  }
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>

