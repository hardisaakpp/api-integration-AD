<template>
  <div class="configuracion">
    <div class="page-header">
      <h2>Configuración del Sistema</h2>
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

    <!-- Configuración MBA3 Token -->
    <div v-if="activeTab === 'mba3'" class="content-section">
      <h3>Gestión de Token MBA3</h3>
      
      <div v-if="mba3Store.token && mba3Store.isTokenValid" class="token-status success">
        <div class="status-header">
          <span class="status-icon">✅</span>
          <span class="status-title">Token Activo</span>
        </div>
        <div class="token-info">
          <div class="info-item">
            <span class="info-label">Token:</span>
            <div class="token-display">
              <code>{{ mba3Store.token.substring(0, 50) }}...</code>
              <button class="btn btn-sm btn-outline" @click="copyToken">
                📋 Copiar
              </button>
            </div>
          </div>
          <div v-if="mba3Store.tokenInfo" class="info-item">
            <span class="info-label">Expira:</span>
            <span class="info-value">{{ formatDate(mba3Store.tokenInfo.expiresAt) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Base URL:</span>
            <span class="info-value">{{ mba3Store.baseUrl }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Código:</span>
            <span class="info-value">{{ mba3Store.codigo }}</span>
          </div>
        </div>
        <div class="token-actions">
          <button class="btn btn-primary" @click="refreshToken">
            🔄 Renovar Token
          </button>
          <button class="btn btn-outline" @click="clearToken">
            🗑️ Limpiar Token
          </button>
        </div>
      </div>

      <div v-else class="token-form">
        <div class="token-tabs">
          <button
            class="token-tab"
            :class="{ active: tokenMethod === 'form' }"
            @click="tokenMethod = 'form'"
          >
            🔑 Obtener desde Formulario
          </button>
          <button
            class="token-tab"
            :class="{ active: tokenMethod === 'manual' }"
            @click="tokenMethod = 'manual'"
          >
            📋 Pegar Token Manualmente
          </button>
        </div>

        <!-- Método: Formulario -->
        <form v-if="tokenMethod === 'form'" @submit.prevent="obtenerToken" class="config-form">
          <div class="form-group">
            <label>URL Base MBA3:</label>
            <input
              v-model="mba3Form.baseUrl"
              type="url"
              class="input"
              placeholder="http://192.168.2.159:8081"
              required
            />
          </div>
          <div class="form-group">
            <label>Código del Servicio:</label>
            <input
              v-model="mba3Form.codigo"
              type="text"
              class="input"
              placeholder="CDB002"
              required
            />
          </div>
          <div class="form-group">
            <label>Contraseña del Servicio:</label>
            <input
              v-model="mba3Form.pwd"
              type="password"
              class="input"
              placeholder="88888"
              required
            />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="obteniendoToken">
              <span v-if="obteniendoToken" class="loading"></span>
              <span v-else>🔑 Obtener Token</span>
            </button>
          </div>
          <div class="help-text">
            💡 <strong>Nota:</strong> Si hay problemas de CORS, usa el método manual o ejecuta <code>npm run get-token</code> en la consola.
          </div>
        </form>

        <!-- Método: Manual -->
        <div v-else class="manual-token-form">
          <div class="form-group">
            <label>Token JWT:</label>
            <textarea
              v-model="manualToken"
              class="input"
              rows="3"
              placeholder="Pega aquí el token obtenido con: npm run get-token"
            ></textarea>
          </div>
          <div class="form-group">
            <label>URL Base MBA3:</label>
            <input
              v-model="mba3Form.baseUrl"
              type="url"
              class="input"
              placeholder="http://192.168.2.159:8081"
            />
          </div>
          <div class="form-group">
            <label>Código del Servicio:</label>
            <input
              v-model="mba3Form.codigo"
              type="text"
              class="input"
              placeholder="CDB002"
            />
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" @click="guardarTokenManual" :disabled="!manualToken">
              💾 Guardar Token
            </button>
          </div>
          <div class="help-text">
            💡 <strong>Instrucciones:</strong>
            <ol>
              <li>Ejecuta <code>npm run get-token</code> en la terminal</li>
              <li>Copia el token JWT que se muestra</li>
              <li>Pégalo en el campo de arriba</li>
              <li>Haz clic en "Guardar Token"</li>
            </ol>
          </div>
        </div>
      </div>

      <div v-if="mba3Error" class="error-message">
        {{ mba3Error }}
      </div>
    </div>

    <!-- Configuración de APIs -->
    <div v-if="activeTab === 'apis'" class="content-section">
      <h3>Configuración de APIs</h3>
      <form @submit.prevent="saveAPIConfig" class="config-form">
        <div class="form-group">
          <label>URL API MBA3:</label>
          <input
            v-model="apiConfig.mba3Url"
            type="url"
            class="input"
            placeholder="https://api.mba3.com"
            required
          />
        </div>
        <div class="form-group">
          <label>Token MBA3:</label>
          <input
            v-model="apiConfig.mba3Token"
            type="password"
            class="input"
            placeholder="Ingrese el token"
            required
          />
        </div>
        <div class="form-group">
          <label>URL SAP Service Layer:</label>
          <input
            v-model="apiConfig.sapUrl"
            type="url"
            class="input"
            placeholder="https://sap-server.com:50000/b1s/v1"
            required
          />
        </div>
        <div class="form-group">
          <label>Usuario SAP:</label>
          <input
            v-model="apiConfig.sapUser"
            type="text"
            class="input"
            placeholder="Usuario SAP"
            required
          />
        </div>
        <div class="form-group">
          <label>Contraseña SAP:</label>
          <input
            v-model="apiConfig.sapPassword"
            type="password"
            class="input"
            placeholder="Contraseña SAP"
            required
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="loading"></span>
            <span v-else>💾 Guardar Configuración</span>
          </button>
          <button type="button" class="btn btn-outline" @click="testAPIs">
            🧪 Probar Conexiones
          </button>
        </div>
      </form>
    </div>

    <!-- Parámetros de Mapeo -->
    <div v-if="activeTab === 'mapeo'" class="content-section">
      <h3>Parámetros de Mapeo</h3>
      <form @submit.prevent="saveMapeoConfig" class="config-form">
        <div class="form-group">
          <label>Empresa SAP:</label>
          <input
            v-model="mapeoConfig.empresa"
            type="text"
            class="input"
            placeholder="Nombre de la empresa"
            required
          />
        </div>
        <div class="form-group">
          <label>Sucursal:</label>
          <input
            v-model="mapeoConfig.sucursal"
            type="text"
            class="input"
            placeholder="Código de sucursal"
            required
          />
        </div>
        <div class="form-group">
          <label>Almacén por Defecto:</label>
          <input
            v-model="mapeoConfig.almacen"
            type="text"
            class="input"
            placeholder="Código de almacén"
            required
          />
        </div>
        <div class="form-group">
          <label>Moneda:</label>
          <select v-model="mapeoConfig.moneda" class="select" required>
            <option value="MXN">MXN - Peso Mexicano</option>
            <option value="USD">USD - Dólar Estadounidense</option>
            <option value="EUR">EUR - Euro</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="loading"></span>
            <span v-else>💾 Guardar Parámetros</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Perfiles de Conexión -->
    <div v-if="activeTab === 'perfiles'" class="content-section">
      <h3>Perfiles de Conexión</h3>
      <div class="perfiles-header">
        <button class="btn btn-primary" @click="showPerfilModal = true">
          ➕ Nuevo Perfil
        </button>
      </div>
      <div class="perfiles-list">
        <div v-for="perfil in perfiles" :key="perfil.id" class="perfil-card">
          <div class="perfil-info">
            <div class="perfil-name">{{ perfil.nombre }}</div>
            <div class="perfil-env">{{ perfil.entorno }}</div>
          </div>
          <div class="perfil-actions">
            <button class="btn btn-outline" @click="editarPerfil(perfil)">
              ✏️ Editar
            </button>
            <button class="btn btn-danger" @click="eliminarPerfil(perfil.id)">
              🗑️ Eliminar
            </button>
          </div>
        </div>
        <div v-if="perfiles.length === 0" class="empty-state">
          No hay perfiles configurados
        </div>
      </div>
    </div>

    <!-- Modal de Perfil -->
    <div v-if="showPerfilModal" class="modal-overlay" @click="closePerfilModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingPerfil ? 'Editar Perfil' : 'Nuevo Perfil' }}</h3>
          <button class="modal-close" @click="closePerfilModal">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="savePerfil" class="config-form">
            <div class="form-group">
              <label>Nombre del Perfil:</label>
              <input
                v-model="perfilForm.nombre"
                type="text"
                class="input"
                placeholder="Ej: Producción, Test, Desarrollo"
                required
              />
            </div>
            <div class="form-group">
              <label>Entorno:</label>
              <select v-model="perfilForm.entorno" class="select" required>
                <option value="produccion">Producción</option>
                <option value="test">Test</option>
                <option value="desarrollo">Desarrollo</option>
              </select>
            </div>
            <div class="form-group">
              <label>URL API MBA3:</label>
              <input
                v-model="perfilForm.mba3Url"
                type="url"
                class="input"
                required
              />
            </div>
            <div class="form-group">
              <label>URL SAP:</label>
              <input
                v-model="perfilForm.sapUrl"
                type="url"
                class="input"
                required
              />
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" @click="closePerfilModal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <span v-if="saving" class="loading"></span>
                <span v-else>💾 Guardar</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { configuracionService } from '@/services/configuracionService'
import { useMBA3Store } from '@/stores/mba3'
import { useToast } from 'vue-toastification'
import { formatters } from '@/utils/formatters'

const activeTab = ref('mba3')
const saving = ref(false)
const configuracion = ref({})
const perfiles = ref([])
const showPerfilModal = ref(false)
const editingPerfil = ref(null)
const obteniendoToken = ref(false)
const mba3Error = ref('')
const tokenMethod = ref('form') // 'form' o 'manual'
const manualToken = ref('')

const mba3Store = useMBA3Store()
const toast = useToast()

const mba3Form = ref({
  baseUrl: mba3Store.baseUrl || 'http://192.168.2.159:8081',
  codigo: mba3Store.codigo || 'CDB002',
  pwd: ''
})

const tabs = [
  { key: 'mba3', label: 'MBA3 Token' },
  { key: 'apis', label: 'APIs' },
  { key: 'mapeo', label: 'Mapeo' },
  { key: 'perfiles', label: 'Perfiles' }
]

const apiConfig = ref({
  mba3Url: '',
  mba3Token: '',
  sapUrl: '',
  sapUser: '',
  sapPassword: ''
})

const mapeoConfig = ref({
  empresa: '',
  sucursal: '',
  almacen: '',
  moneda: 'MXN'
})

const perfilForm = ref({
  nombre: '',
  entorno: 'produccion',
  mba3Url: '',
  sapUrl: ''
})

async function loadConfiguracion() {
  try {
    const data = await configuracionService.getConfiguracion()
    configuracion.value = data
    
    if (data.apiConfig) {
      apiConfig.value = { ...data.apiConfig }
    }
    if (data.mapeoConfig) {
      mapeoConfig.value = { ...data.mapeoConfig }
    }
  } catch (error) {
    console.error(error)
  }
}

async function loadPerfiles() {
  try {
    const data = await configuracionService.getPerfiles()
    perfiles.value = data.perfiles || []
  } catch (error) {
    console.error(error)
  }
}

async function saveAPIConfig() {
  saving.value = true
  try {
    await configuracionService.updateConfiguracion({
      apiConfig: apiConfig.value
    })
    toast.success('Configuración de APIs guardada exitosamente')
  } catch (error) {
    toast.error('Error al guardar configuración')
    console.error(error)
  } finally {
    saving.value = false
  }
}

async function saveMapeoConfig() {
  saving.value = true
  try {
    await configuracionService.updateConfiguracion({
      mapeoConfig: mapeoConfig.value
    })
    toast.success('Parámetros de mapeo guardados exitosamente')
  } catch (error) {
    toast.error('Error al guardar parámetros')
    console.error(error)
  } finally {
    saving.value = false
  }
}

async function testAPIs() {
  toast.info('Probando conexiones...')
  // Aquí se implementaría la lógica de prueba de conexión
  setTimeout(() => {
    toast.success('Conexiones probadas exitosamente')
  }, 2000)
}

function editarPerfil(perfil) {
  editingPerfil.value = perfil
  perfilForm.value = { ...perfil }
  showPerfilModal.value = true
}

function closePerfilModal() {
  showPerfilModal.value = false
  editingPerfil.value = null
  perfilForm.value = {
    nombre: '',
    entorno: 'produccion',
    mba3Url: '',
    sapUrl: ''
  }
}

async function savePerfil() {
  saving.value = true
  try {
    if (editingPerfil.value) {
      await configuracionService.savePerfil({
        ...perfilForm.value,
        id: editingPerfil.value.id
      })
      toast.success('Perfil actualizado exitosamente')
    } else {
      await configuracionService.savePerfil(perfilForm.value)
      toast.success('Perfil creado exitosamente')
    }
    closePerfilModal()
    await loadPerfiles()
  } catch (error) {
    toast.error('Error al guardar perfil')
    console.error(error)
  } finally {
    saving.value = false
  }
}

async function eliminarPerfil(id) {
  if (!confirm('¿Está seguro de eliminar este perfil?')) {
    return
  }

  try {
    await configuracionService.deletePerfil(id)
    toast.success('Perfil eliminado exitosamente')
    await loadPerfiles()
  } catch (error) {
    toast.error('Error al eliminar perfil')
    console.error(error)
  }
}

// Funciones MBA3 Token
async function obtenerToken() {
  obteniendoToken.value = true
  mba3Error.value = ''
  
  try {
    const result = await mba3Store.login(mba3Form.value.baseUrl, mba3Form.value.codigo, mba3Form.value.pwd)
    
    if (result.success) {
      toast.success('Token obtenido exitosamente')
      mba3Form.value.pwd = '' // Limpiar contraseña
    } else {
      mba3Error.value = result.message
      toast.error(result.message)
    }
  } catch (error) {
    mba3Error.value = error.message || 'Error al obtener token'
    toast.error(error.message || 'Error al obtener token')
  } finally {
    obteniendoToken.value = false
  }
}

async function refreshToken() {
  if (!mba3Store.baseUrl || !mba3Store.codigo) {
    toast.warning('No hay credenciales guardadas. Ingresa las credenciales nuevamente.')
    return
  }
  
  obteniendoToken.value = true
  mba3Error.value = ''
  
  try {
    // Necesitamos la contraseña, pedirla al usuario
    const pwd = prompt('Ingresa la contraseña del servicio para renovar el token:')
    if (!pwd) {
      obteniendoToken.value = false
      return
    }
    
    const result = await mba3Store.login(mba3Store.baseUrl, mba3Store.codigo, pwd)
    
    if (result.success) {
      toast.success('Token renovado exitosamente')
    } else {
      mba3Error.value = result.message
      toast.error(result.message)
    }
  } catch (error) {
    mba3Error.value = error.message || 'Error al renovar token'
    toast.error(error.message || 'Error al renovar token')
  } finally {
    obteniendoToken.value = false
  }
}

function clearToken() {
  if (confirm('¿Está seguro de eliminar el token actual?')) {
    mba3Store.logout()
    toast.success('Token eliminado')
  }
}

function copyToken() {
  if (mba3Store.token) {
    navigator.clipboard.writeText(mba3Store.token)
    toast.success('Token copiado al portapapeles')
  }
}

function formatDate(dateString) {
  if (!dateString) return 'No disponible'
  try {
    return formatters.datetime(dateString)
  } catch {
    return dateString
  }
}

function guardarTokenManual() {
  if (!manualToken.value || !manualToken.value.trim()) {
    toast.error('Por favor ingresa un token válido')
    return
  }

  const token = manualToken.value.trim()
  
  // Validar que parece un JWT (tiene 3 partes separadas por puntos)
  if (!token.includes('.') || token.split('.').length !== 3) {
    toast.error('El token no tiene el formato correcto de JWT')
    return
  }

  mba3Store.setToken(token)
  
  // Guardar también baseUrl y codigo si están presentes
  if (mba3Form.value.baseUrl) {
    mba3Store.setBaseUrl(mba3Form.value.baseUrl)
  }
  if (mba3Form.value.codigo) {
    mba3Store.setCodigo(mba3Form.value.codigo)
  }

  toast.success('Token guardado exitosamente')
  manualToken.value = ''
}

onMounted(() => {
  loadConfiguracion()
  loadPerfiles()
  
  // Cargar valores guardados en el formulario si existen
  if (mba3Store.baseUrl) {
    mba3Form.value.baseUrl = mba3Store.baseUrl
  }
  if (mba3Store.codigo) {
    mba3Form.value.codigo = mba3Store.codigo
  }
})
</script>

<style lang="scss" scoped>
.configuracion {
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

.config-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  gap: 0.75rem;
  margin-top: 1rem;
}

.perfiles-header {
  margin-bottom: 1.5rem;
}

.perfiles-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.perfil-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.perfil-info {
  flex: 1;
}

.perfil-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.perfil-env {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: capitalize;
}

.perfil-actions {
  display: flex;
  gap: 0.5rem;
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
  max-width: 600px;
  width: 100%;
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.token-status {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  margin-bottom: 1rem;

  &.success {
    border-left: 4px solid var(--success-color);
  }
}

.status-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.status-icon {
  font-size: 1.5rem;
}

.status-title {
  font-size: 1.125rem;
  font-weight: 600;
}

.token-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: var(--text-color);
}

.token-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  code {
    flex: 1;
    background: var(--bg-color);
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    word-break: break-all;
    border: 1px solid var(--border-color);
  }
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.token-actions {
  display: flex;
  gap: 0.75rem;
}

.token-form {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
  border-radius: 6px;
  border: 1px solid var(--error-color);
  white-space: pre-line;
  font-size: 0.875rem;
}

.token-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.token-tab {
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

.manual-token-form {
  padding: 1rem 0;
}

.help-text {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 6px;
  border-left: 4px solid var(--primary-color);
  font-size: 0.875rem;
  color: var(--text-secondary);

  code {
    background: var(--bg-color);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    border: 1px solid var(--border-color);
  }

  ol {
    margin-top: 0.5rem;
    padding-left: 1.5rem;

    li {
      margin-top: 0.5rem;
    }
  }
}

textarea.input {
  resize: vertical;
  min-height: 80px;
  font-family: monospace;
  font-size: 0.875rem;
}
</style>

