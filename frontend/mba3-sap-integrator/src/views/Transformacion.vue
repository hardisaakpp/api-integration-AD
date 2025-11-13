<template>
  <div class="transformacion">
    <div class="page-header">
      <h2>Transformación de Despachos</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="showTransformModal = true">
          ⚙️ Transformar Despachos
        </button>
      </div>
    </div>

    <div class="info-card">
      <h3>📋 Instrucciones</h3>
      <ul>
        <li>Seleccione los despachos Rayo que desea transformar a ODC</li>
        <li>El sistema validará los datos antes de procesar</li>
        <li>Puede corregir datos antes de enviar a SAP</li>
        <li>Las ODC generadas aparecerán en la sección Store Control</li>
      </ul>
    </div>

    <div class="content-section">
      <h3>Despachos Pendientes de Transformación</h3>
      <DataTable
        :data="despachosPendientes"
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
            placeholder="Buscar despacho..."
            style="max-width: 300px;"
          />
          <button class="btn btn-outline" @click="loadDespachosPendientes">
            🔄 Actualizar
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

    <!-- Modal de transformación -->
    <div v-if="showTransformModal" class="modal-overlay" @click="closeTransformModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Transformar Despachos a ODC</h3>
          <button class="modal-close" @click="closeTransformModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Seleccione los despachos a transformar:</label>
            <div class="despachos-list">
              <label
                v-for="despacho in despachosPendientes"
                :key="despacho.id"
                class="despacho-checkbox"
              >
                <input
                  type="checkbox"
                  :value="despacho.id"
                  v-model="selectedDespachos"
                />
                <div class="despacho-info">
                  <div class="despacho-numero">{{ despacho.numero }}</div>
                  <div class="despacho-details">
                    {{ formatters.date(despacho.fecha) }} - 
                    {{ formatters.currency(despacho.monto) }}
                  </div>
                </div>
              </label>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="closeTransformModal">
              Cancelar
            </button>
            <button
              class="btn btn-primary"
              @click="validarYTransformar"
              :disabled="selectedDespachos.length === 0 || transforming"
            >
              <span v-if="transforming" class="loading"></span>
              <span v-else>Validar y Transformar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de corrección -->
    <div v-if="showCorrectionModal" class="modal-overlay" @click="closeCorrectionModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Corregir Datos del Documento</h3>
          <button class="modal-close" @click="closeCorrectionModal">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="documentToCorrect" class="correction-form">
            <div class="form-group">
              <label>Código de Producto:</label>
              <input
                v-model="correctionData.codigoProducto"
                type="text"
                class="input"
                placeholder="Ingrese código de producto"
              />
            </div>
            <div class="form-group">
              <label>Código de Cliente:</label>
              <input
                v-model="correctionData.codigoCliente"
                type="text"
                class="input"
                placeholder="Ingrese código de cliente"
              />
            </div>
            <div class="form-group">
              <label>Almacén:</label>
              <input
                v-model="correctionData.almacen"
                type="text"
                class="input"
                placeholder="Ingrese almacén"
              />
            </div>
            <div class="modal-actions">
              <button class="btn btn-outline" @click="closeCorrectionModal">
                Cancelar
              </button>
              <button class="btn btn-primary" @click="aplicarCorreccion" :disabled="correcting">
                <span v-if="correcting" class="loading"></span>
                <span v-else>Guardar Corrección</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { transformacionService } from '@/services/transformacionService'
import { storeControlService } from '@/services/storeControlService'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatters } from '@/utils/formatters'

const loading = ref(false)
const despachosPendientes = ref([])
const selectedDespachos = ref([])
const showTransformModal = ref(false)
const showCorrectionModal = ref(false)
const documentToCorrect = ref(null)
const correctionData = ref({
  codigoProducto: '',
  codigoCliente: '',
  almacen: ''
})
const transforming = ref(false)
const correcting = ref(false)

const toast = useToast()

const filters = ref({
  search: ''
})

const columns = [
  { key: 'numero', label: 'Número' },
  { key: 'fecha', label: 'Fecha', format: 'date' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'monto', label: 'Monto', format: 'currency' },
  { key: 'estado', label: 'Estado' }
]

const actions = computed(() => [
  {
    key: 'correct',
    label: 'Corregir',
    class: 'btn-warning',
    title: 'Corregir datos',
    handler: (row) => openCorrectionModal(row)
  }
])

async function loadDespachosPendientes() {
  loading.value = true
  try {
    const data = await storeControlService.getDespachos({ estado: 'Pendiente' })
    despachosPendientes.value = data.despachos || []
  } catch (error) {
    toast.error('Error al cargar despachos pendientes')
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function validarYTransformar() {
  if (selectedDespachos.value.length === 0) {
    toast.warning('Seleccione al menos un despacho')
    return
  }

  transforming.value = true
  try {
    // Primero validar
    const validacion = await transformacionService.validarDatos(selectedDespachos.value)
    
    if (validacion.errores && validacion.errores.length > 0) {
      toast.warning(`Se encontraron ${validacion.errores.length} errores. Revise los datos.`)
      // Mostrar errores
      return
    }

    // Transformar
    const resultado = await transformacionService.transformarDespachos(selectedDespachos.value)
    toast.success(`Se transformaron ${resultado.odcGeneradas || 0} despachos exitosamente`)
    closeTransformModal()
    await loadDespachosPendientes()
  } catch (error) {
    toast.error('Error al transformar despachos')
    console.error(error)
  } finally {
    transforming.value = false
  }
}

function openCorrectionModal(document) {
  documentToCorrect.value = document
  correctionData.value = {
    codigoProducto: document.codigoProducto || '',
    codigoCliente: document.codigoCliente || '',
    almacen: document.almacen || ''
  }
  showCorrectionModal.value = true
}

function closeCorrectionModal() {
  showCorrectionModal.value = false
  documentToCorrect.value = null
  correctionData.value = {
    codigoProducto: '',
    codigoCliente: '',
    almacen: ''
  }
}

async function aplicarCorreccion() {
  correcting.value = true
  try {
    await transformacionService.corregirDatos(documentToCorrect.value.id, correctionData.value)
    toast.success('Datos corregidos exitosamente')
    closeCorrectionModal()
    await loadDespachosPendientes()
  } catch (error) {
    toast.error('Error al corregir datos')
    console.error(error)
  } finally {
    correcting.value = false
  }
}

function closeTransformModal() {
  showTransformModal.value = false
  selectedDespachos.value = []
}

onMounted(() => {
  loadDespachosPendientes()
})
</script>

<style lang="scss" scoped>
.transformacion {
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

.info-card {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  border-left: 4px solid var(--primary-color);

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;

      &:before {
        content: '•';
        position: absolute;
        left: 0;
        color: var(--primary-color);
        font-weight: bold;
      }
    }
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
  max-width: 700px;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;

  label {
    font-weight: 500;
    font-size: 0.875rem;
  }
}

.despachos-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.5rem;
}

.despacho-checkbox {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--bg-secondary);
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
}

.despacho-info {
  flex: 1;
}

.despacho-numero {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.despacho-details {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.correction-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>

