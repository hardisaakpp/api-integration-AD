<template>
  <div class="consultas-mba3">
    <div class="page-header">
      <h2>Consultas MBA3</h2>
      <p class="subtitle">Interfaz tipo Postman para realizar consultas a MBA3</p>
    </div>

    <div class="consultas-container">
      <!-- Panel de Configuración -->
      <div class="config-panel">
        <div class="section">
          <h3>🔗 URL del Endpoint</h3>
          <div class="form-group">
            <select v-model="requestMethod" class="method-select">
              <option value="POST">POST</option>
            </select>
            <input
              v-model="requestUrl"
              type="text"
              class="url-input"
              placeholder="http://192.168.2.159:8081/endpoint"
            />
          </div>
        </div>

        <div class="section">
          <h3>🔐 Autenticación Digest</h3>
          <div class="form-row">
            <div class="form-group">
              <label>Username:</label>
              <input
                v-model="authUsername"
                type="text"
                class="input"
                placeholder="Usuario"
              />
            </div>
            <div class="form-group">
              <label>Password:</label>
              <input
                v-model="authPassword"
                type="password"
                class="input"
                placeholder="Contraseña"
              />
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h3>📋 Headers</h3>
            <button class="btn btn-sm btn-outline" @click="addHeaderField">
              ➕ Agregar Header
            </button>
          </div>
          <div class="form-data-list">
            <div
              v-for="(field, index) in headerFields"
              :key="index"
              class="form-data-item"
            >
              <input
                v-model="field.key"
                type="text"
                class="input input-sm"
                placeholder="Nombre del Header"
              />
              <span class="separator">:</span>
              <input
                v-model="field.value"
                type="text"
                class="input input-sm"
                placeholder="Valor"
              />
              <button
                class="btn btn-sm btn-danger"
                @click="removeHeaderField(index)"
                :disabled="headerFields.length === 1"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h3>📝 Body (Form-Data)</h3>
            <button class="btn btn-sm btn-outline" @click="addFormField">
              ➕ Agregar Campo
            </button>
          </div>
          <div class="form-data-list">
            <div
              v-for="(field, index) in formDataFields"
              :key="index"
              class="form-data-item"
            >
              <input
                v-model="field.key"
                type="text"
                class="input input-sm"
                placeholder="Clave"
              />
              <span class="separator">:</span>
              <input
                v-model="field.value"
                type="text"
                class="input input-sm"
                placeholder="Valor"
              />
              <button
                class="btn btn-sm btn-danger"
                @click="removeFormField(index)"
                :disabled="formDataFields.length === 1"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <div class="section">
          <button
            class="btn btn-primary btn-large"
            @click="enviarConsulta"
            :disabled="enviando || !isFormValid"
          >
            <span v-if="enviando" class="loading"></span>
            <span v-else>🚀 Enviar Consulta</span>
          </button>
        </div>
      </div>

      <!-- Panel de Respuesta -->
      <div class="response-panel">
        <div class="section">
          <div class="section-header">
            <h3>📥 Respuesta</h3>
            <div class="response-status" :class="statusClass">
              <span v-if="responseStatus">{{ responseStatus }}</span>
              <span v-else>Pendiente</span>
            </div>
          </div>

          <div v-if="responseStatus" class="response-info">
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value" :class="statusClass">{{ responseStatus }}</span>
            </div>
            <div v-if="responseTime" class="info-row">
              <span class="info-label">Tiempo:</span>
              <span class="info-value">{{ responseTime }}ms</span>
            </div>
          </div>

          <div v-if="responseData !== null" class="response-body">
            <div class="response-tabs">
              <button
                class="tab-button"
                :class="{ active: responseTab === 'body' }"
                @click="responseTab = 'body'"
              >
                Body
              </button>
              <button
                class="tab-button"
                :class="{ active: responseTab === 'headers' }"
                @click="responseTab = 'headers'"
              >
                Headers
              </button>
            </div>

            <div v-if="responseTab === 'body'" class="response-content">
              <pre class="json-viewer">{{ formattedResponse }}</pre>
            </div>

            <div v-if="responseTab === 'headers'" class="response-content">
              <pre class="json-viewer">{{ formattedHeaders }}</pre>
            </div>

            <div class="response-actions">
              <button class="btn btn-sm btn-outline" @click="copyResponse">
                📋 Copiar Respuesta
              </button>
              <button class="btn btn-sm btn-outline" @click="clearResponse">
                🗑️ Limpiar
              </button>
            </div>
          </div>

          <div v-if="errorMessage" class="error-message">
            <strong>❌ Error:</strong> {{ errorMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mba3Service } from '@/services/mba3Service'

const requestMethod = ref('POST')
const requestUrl = ref('')
const authUsername = ref('')
const authPassword = ref('')
const headerFields = ref([{ key: '', value: '' }])
const formDataFields = ref([{ key: '', value: '' }])
const enviando = ref(false)
const responseStatus = ref(null)
const responseData = ref(null)
const responseHeaders = ref(null)
const responseTime = ref(null)
const errorMessage = ref('')
const responseTab = ref('body')

const isFormValid = computed(() => {
  return (
    requestUrl.value.trim() !== '' &&
    authUsername.value.trim() !== '' &&
    authPassword.value.trim() !== '' &&
    formDataFields.value.some(f => f.key.trim() !== '')
  )
})

const statusClass = computed(() => {
  if (!responseStatus.value) return ''
  const status = parseInt(responseStatus.value)
  if (status >= 200 && status < 300) return 'status-success'
  if (status >= 400 && status < 500) return 'status-error'
  if (status >= 500) return 'status-error'
  return 'status-info'
})

const formattedResponse = computed(() => {
  if (responseData.value === null) return ''
  try {
    return JSON.stringify(responseData.value, null, 2)
  } catch {
    return String(responseData.value)
  }
})

const formattedHeaders = computed(() => {
  if (!responseHeaders.value) return ''
  try {
    return JSON.stringify(responseHeaders.value, null, 2)
  } catch {
    return String(responseHeaders.value)
  }
})

function addHeaderField() {
  headerFields.value.push({ key: '', value: '' })
}

function removeHeaderField(index) {
  if (headerFields.value.length > 1) {
    headerFields.value.splice(index, 1)
  }
}

function addFormField() {
  formDataFields.value.push({ key: '', value: '' })
}

function removeFormField(index) {
  if (formDataFields.value.length > 1) {
    formDataFields.value.splice(index, 1)
  }
}

async function enviarConsulta() {
  if (!isFormValid.value) {
    errorMessage.value = 'Por favor completa todos los campos requeridos'
    return
  }

  enviando.value = true
  errorMessage.value = ''
  responseStatus.value = null
  responseData.value = null
  responseHeaders.value = null
  responseTime.value = null

  const startTime = Date.now()

  try {
    // Construir objeto form-data
    const formData = {}
    for (const field of formDataFields.value) {
      if (field.key.trim() !== '') {
        formData[field.key] = field.value || ''
      }
    }

    // Construir objeto headers
    const customHeaders = {}
    for (const field of headerFields.value) {
      if (field.key.trim() !== '') {
        customHeaders[field.key] = field.value || ''
      }
    }

    const result = await mba3Service.consulta(
      requestUrl.value,
      formData,
      authUsername.value,
      authPassword.value,
      customHeaders
    )

    responseTime.value = Date.now() - startTime
    responseStatus.value = result.status
    responseData.value = result.data
    responseHeaders.value = result.headers

    if (result.error) {
      errorMessage.value = result.error
    }
  } catch (error) {
    responseTime.value = Date.now() - startTime
    errorMessage.value = error.message || 'Error al realizar la consulta'
    responseStatus.value = error.response?.status || 'Error'
    responseData.value = error.response?.data || { error: error.message }
    responseHeaders.value = error.response?.headers || {}
  } finally {
    enviando.value = false
  }
}

function copyResponse() {
  const text = responseTab.value === 'body' 
    ? formattedResponse.value 
    : formattedHeaders.value
  
  navigator.clipboard.writeText(text).then(() => {
    // Podrías mostrar un toast aquí
    alert('Respuesta copiada al portapapeles')
  })
}

function clearResponse() {
  responseStatus.value = null
  responseData.value = null
  responseHeaders.value = null
  responseTime.value = null
  errorMessage.value = ''
}
</script>

<style scoped lang="scss">
.consultas-mba3 {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;

  h2 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 0.95rem;
  }
}

.consultas-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.config-panel,
.response-panel {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.section {
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    color: var(--text-color);
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h3 {
    margin-bottom: 0;
  }
}

.form-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-color);
  }
}

.method-select {
  width: 100px;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  font-weight: 600;
}

.url-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.input-sm {
  padding: 0.4rem;
  font-size: 0.9rem;
}

.form-data-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-data-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .input {
    flex: 1;
  }

  .separator {
    color: var(--text-secondary);
    font-weight: 600;
  }
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: var(--primary-color);
  color: white;

  &:hover:not(:disabled) {
    filter: brightness(0.9);
  }
}

.btn-large {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  justify-content: center;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);

  &:hover:not(:disabled) {
    background: var(--bg-secondary);
  }
}

.btn-danger {
  background: var(--error-color);
  color: white;

  &:hover:not(:disabled) {
    filter: brightness(0.9);
  }
}

.response-status {
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;

  &.status-success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success-color);
  }

  &.status-error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--error-color);
  }

  &.status-info {
    background: rgba(59, 130, 246, 0.1);
    color: var(--primary-color);
  }
}

.response-info {
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 600;
  color: var(--text-color);

  &.status-success {
    color: var(--success-color);
  }

  &.status-error {
    color: var(--error-color);
  }
}

.response-body {
  margin-top: 1rem;
}

.response-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
}

.tab-button {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  margin-bottom: -2px;
  transition: all 0.2s;

  &:hover {
    color: var(--text-color);
  }

  &.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
  }
}

.response-content {
  background: var(--bg-secondary);
  border-radius: 4px;
  padding: 1rem;
  max-height: 500px;
  overflow: auto;
}

.json-viewer {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: var(--text-color);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.response-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.error-message {
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border-left: 4px solid var(--error-color);
  border-radius: 4px;
  color: var(--error-color);
  margin-top: 1rem;
}

.loading {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

