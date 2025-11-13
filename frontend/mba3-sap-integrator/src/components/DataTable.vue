<template>
  <div class="data-table-wrapper">
    <div v-if="loading" class="loading-container">
      <div class="loading"></div>
      <p>Cargando datos...</p>
    </div>
    <div v-else>
      <div v-if="showFilters" class="table-filters">
        <slot name="filters"></slot>
      </div>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th v-for="column in columns" :key="column.key">
                {{ column.label }}
              </th>
              <th v-if="actions.length > 0">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedData" :key="index">
              <td v-for="column in columns" :key="column.key">
                <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                  {{ formatValue(row[column.key], column) }}
                </slot>
              </td>
              <td v-if="actions.length > 0" class="actions-cell">
                <button
                  v-for="action in actions"
                  :key="action.key"
                  class="btn btn-sm"
                  :class="action.class"
                  @click="action.handler(row)"
                  :title="action.title"
                >
                  {{ action.label }}
                </button>
              </td>
            </tr>
            <tr v-if="paginatedData.length === 0">
              <td :colspan="columns.length + (actions.length > 0 ? 1 : 0)" class="empty-state">
                No hay datos disponibles
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="pagination" class="table-pagination">
        <div class="pagination-info">
          Mostrando {{ startIndex + 1 }} - {{ endIndex }} de {{ totalItems }}
        </div>
        <div class="pagination-controls">
          <button
            class="btn btn-outline"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            Anterior
          </button>
          <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
          <button
            class="btn btn-outline"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { formatters } from '@/utils/formatters'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    required: true
  },
  actions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Boolean,
    default: true
  },
  itemsPerPage: {
    type: Number,
    default: 10
  },
  showFilters: {
    type: Boolean,
    default: true
  }
})

const currentPage = ref(1)

const totalItems = computed(() => props.data.length)
const totalPages = computed(() => Math.ceil(totalItems.value / props.itemsPerPage))
const startIndex = computed(() => (currentPage.value - 1) * props.itemsPerPage)
const endIndex = computed(() => Math.min(startIndex.value + props.itemsPerPage, totalItems.value))

const paginatedData = computed(() => {
  if (!props.pagination) return props.data
  return props.data.slice(startIndex.value, endIndex.value)
})

function formatValue(value, column) {
  if (value === null || value === undefined) return '-'
  
  if (column.format === 'date') {
    return formatters.date(value)
  }
  if (column.format === 'datetime') {
    return formatters.datetime(value)
  }
  if (column.format === 'currency') {
    return formatters.currency(value)
  }
  if (column.format === 'number') {
    return formatters.number(value)
  }
  
  return value
}
</script>

<style lang="scss" scoped>
.data-table-wrapper {
  background: var(--bg-color);
  border-radius: 8px;
  overflow: hidden;
}

.table-filters {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.table-container {
  overflow-x: auto;
}

.loading-container {
  padding: 3rem;
  text-align: center;
  color: var(--text-secondary);

  .loading {
    margin: 0 auto 1rem;
  }
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.actions-cell {
  white-space: nowrap;
  
  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    margin-right: 0.25rem;
  }
}

.table-pagination {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-info {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
</style>

