<template>
  <div class="soporte">
    <div class="page-header">
      <h2>Soporte Técnico</h2>
    </div>

    <div class="tools-grid">
      <div class="tool-card">
        <div class="tool-icon">🧪</div>
        <div class="tool-content">
          <h3>Test de Conexión</h3>
          <p>Verificar conectividad con MBA3 y SAP</p>
          <button class="btn btn-primary" @click="testConexiones" :disabled="testing">
            <span v-if="testing" class="loading"></span>
            <span v-else>Ejecutar Test</span>
          </button>
        </div>
      </div>

      <div class="tool-card">
        <div class="tool-icon">📋</div>
        <div class="tool-content">
          <h3>Logs del Sistema</h3>
          <p>Ver y descargar logs de errores</p>
          <button class="btn btn-primary" @click="verLogs">
            Ver Logs
          </button>
        </div>
      </div>

      <div class="tool-card">
        <div class="tool-icon">💾</div>
        <div class="tool-content">
          <h3>Descargar Payloads</h3>
          <p>Descargar JSON de documentos enviados/recibidos</p>
          <button class="btn btn-primary" @click="descargarPayloads">
            Descargar
          </button>
        </div>
      </div>
    </div>

    <!-- Resultados de Test -->
    <div v-if="testResults" class="content-section">
      <h3>Resultados del Test de Conexión</h3>
      <div class="test-results">
        <div class="test-item" :class="testResults.mba3?.estado">
          <div class="test-header">
            <span class="test-icon">{{ testResults.mba3?.estado === 'success' ? '✅' : '❌' }}</span>
            <span class="test-name">MBA3 API</span>
          </div>
          <div class="test-details">
            <div class="test-detail">
              <span>Estado:</span>
              <span>{{ testResults.mba3?.estado === 'success' ? 'Conectado' : 'Error' }}</span>
            </div>
            <div v-if="testResults.mba3?.tiempo" class="test-detail">
              <span>Tiempo de respuesta:</span>
              <span>{{ testResults.mba3.tiempo }}ms</span>
            </div>
            <div v-if="testResults.mba3?.mensaje" class="test-message">
              {{ testResults.mba3.mensaje }}
            </div>
          </div>
        </div>

        <div class="test-item" :class="testResults.sap?.estado">
          <div class="test-header">
            <span class="test-icon">{{ testResults.sap?.estado === 'success' ? '✅' : '❌' }}</span>
            <span class="test-name">SAP Service Layer</span>
          </div>
          <div class="test-details">
            <div class="test-detail">
              <span>Estado:</span>
              <span>{{ testResults.sap?.estado === 'success' ? 'Conectado' : 'Error' }}</span>
            </div>
            <div v-if="testResults.sap?.tiempo" class="test-detail">
              <span>Tiempo de respuesta:</span>
              <span>{{ testResults.sap.tiempo }}ms</span>
            </div>
            <div v-if="testResults.sap?.mensaje" class="test-message">
              {{ testResults.sap.mensaje }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logs de Errores -->
    <div v-if="showLogs" class="content-section">
      <div class="logs-header">
        <h3>Logs de Errores</h3>
        <div class="logs-actions">
          <select v-model="logLevel" class="select" style="max-width: 200px;">
            <option value="">Todos los niveles</option>
            <option value="error">Error</option>
            <option value="warning">Advertencia</option>
            <option value="info">Info</option>
          </select>
          <button class="btn btn-outline" @click="cargarLogs">
            🔄 Actualizar
          </button>
          <button class="btn btn-primary" @click="descargarLogs">
            💾 Descargar Logs
          </button>
        </div>
      </div>
      <div class="logs-container">
        <div v-if="logs.length === 0" class="empty-state">
          No hay logs disponibles
        </div>
        <div v-else class="logs-list">
          <div v-for="log in logs" :key="log.id" class="log-item" :class="log.nivel">
            <div class="log-header">
              <span class="log-level">{{ log.nivel.toUpperCase() }}</span>
              <span class="log-time">{{ formatters.datetime(log.fecha) }}</span>
            </div>
            <div class="log-message">{{ log.mensaje }}</div>
            <div v-if="log.detalles" class="log-details">
              <pre>{{ JSON.stringify(log.detalles, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Descarga de Payloads -->
    <div v-if="showPayloads" class="content-section">
      <h3>Descargar Payloads</h3>
      <div class="payloads-form">
        <div class="form-group">
          <label>Tipo de Documento:</label>
          <select v-model="payloadFilters.tipo" class="select">
            <option value="">Todos</option>
            <option value="despacho">Despacho</option>
            <option value="odc">ODC</option>
          </select>
        </div>
        <div class="form-group">
          <label>Fecha Desde:</label>
          <input v-model="payloadFilters.fechaDesde" type="date" class="input" />
        </div>
        <div class="form-group">
          <label>Fecha Hasta:</label>
          <input v-model="payloadFilters.fechaHasta" type="date" class="input" />
        </div>
        <div class="form-group">
          <label>Formato:</label>
          <select v-model="payloadFilters.formato" class="select">
            <option value="json">JSON</option>
            <option value="xml">XML</option>
          </select>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="descargarPayloads" :disabled="descargando">
            <span v-if="descargando" class="loading"></span>
            <span v-else>📥 Descargar Payloads</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { sapService } from '@/services/sapService'
import { useToast } from 'vue-toastification'
import { formatters } from '@/utils/formatters'

const testing = ref(false)
const testResults = ref(null)
const showLogs = ref(false)
const logs = ref([])
const logLevel = ref('')
const showPayloads = ref(false)
const payloadFilters = ref({
  tipo: '',
  fechaDesde: '',
  fechaHasta: '',
  formato: 'json'
})
const descargando = ref(false)

const toast = useToast()

async function testConexiones() {
  testing.value = true
  testResults.value = null
  
  try {
    // Test MBA3
    const mba3Start = Date.now()
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 500))
    const mba3Time = Date.now() - mba3Start
    
    // Test SAP
    const sapResult = await sapService.testConexion()
    const sapTime = sapResult.tiempo || 0
    
    testResults.value = {
      mba3: {
        estado: 'success',
        tiempo: mba3Time,
        mensaje: 'Conexión exitosa con MBA3'
      },
      sap: {
        estado: sapResult.conectado ? 'success' : 'error',
        tiempo: sapTime,
        mensaje: sapResult.mensaje || (sapResult.conectado ? 'Conexión exitosa con SAP' : 'Error al conectar con SAP')
      }
    }
    
    if (testResults.value.mba3.estado === 'success' && testResults.value.sap.estado === 'success') {
      toast.success('Todas las conexiones exitosas')
    } else {
      toast.warning('Algunas conexiones fallaron')
    }
  } catch (error) {
    testResults.value = {
      mba3: { estado: 'error', mensaje: 'Error al conectar con MBA3' },
      sap: { estado: 'error', mensaje: 'Error al conectar con SAP' }
    }
    toast.error('Error al ejecutar tests de conexión')
    console.error(error)
  } finally {
    testing.value = false
  }
}

function verLogs() {
  showLogs.value = true
  cargarLogs()
}

async function cargarLogs() {
  try {
    // Simular carga de logs - aquí se llamaría al servicio real
    logs.value = [
      {
        id: 1,
        nivel: 'error',
        fecha: new Date(),
        mensaje: 'Error al transformar despacho #12345',
        detalles: { codigo: 'ERR001', despachoId: 12345 }
      },
      {
        id: 2,
        nivel: 'warning',
        fecha: new Date(),
        mensaje: 'Advertencia: Cliente sin código SAP',
        detalles: { clienteId: 789 }
      }
    ]
  } catch (error) {
    toast.error('Error al cargar logs')
    console.error(error)
  }
}

function descargarLogs() {
  const logsText = logs.value.map(log => 
    `[${formatters.datetime(log.fecha)}] ${log.nivel.toUpperCase()}: ${log.mensaje}`
  ).join('\n')
  
  const blob = new Blob([logsText], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `logs_${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
  toast.success('Logs descargados exitosamente')
}

function descargarPayloads() {
  showPayloads.value = true
  // Aquí se implementaría la lógica de descarga de payloads
  toast.info('Funcionalidad de descarga de payloads en desarrollo')
}
</script>

<style lang="scss" scoped>
.soporte {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  h2 {
    font-size: 1.75rem;
    font-weight: 700;
  }
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.tool-card {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.tool-icon {
  font-size: 3rem;
}

.tool-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
  }

  p {
    font-size: 0.875rem;
    color: var(--text-secondary);
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

.test-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.test-item {
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);

  &.success {
    border-left: 4px solid var(--success-color);
  }

  &.error {
    border-left: 4px solid var(--error-color);
  }
}

.test-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.test-icon {
  font-size: 1.5rem;
}

.test-name {
  font-weight: 600;
}

.test-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.test-detail {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;

  span:first-child {
    color: var(--text-secondary);
  }
}

.test-message {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-color);
  border-radius: 4px;
  font-size: 0.875rem;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.logs-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.logs-container {
  max-height: 600px;
  overflow-y: auto;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.log-item {
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);

  &.error {
    border-left: 4px solid var(--error-color);
  }

  &.warning {
    border-left: 4px solid var(--warning-color);
  }

  &.info {
    border-left: 4px solid var(--primary-color);
  }
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.log-level {
  font-weight: 600;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: var(--bg-color);
}

.log-time {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.log-message {
  margin-bottom: 0.5rem;
}

.log-details {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-color);
  border-radius: 4px;
  overflow-x: auto;

  pre {
    margin: 0;
    font-size: 0.75rem;
  }
}

.payloads-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-weight: 500;
    font-size: 0.875rem;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}
</style>

