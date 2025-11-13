<template>
  <span class="status-badge" :style="{ backgroundColor: statusColor, color: textColor }">
    {{ status }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { ESTADOS_COLORS } from '@/utils/constants'

const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

const statusColor = computed(() => {
  return ESTADOS_COLORS[props.status] || '#6b7280'
})

const textColor = computed(() => {
  // Determinar si el texto debe ser claro u oscuro según el color de fondo
  const color = statusColor.value
  const rgb = color.match(/\d+/g)
  if (rgb && rgb.length === 3) {
    const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000
    return brightness > 128 ? '#000000' : '#ffffff'
  }
  return '#ffffff'
})
</script>

<style lang="scss" scoped>
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}
</style>

