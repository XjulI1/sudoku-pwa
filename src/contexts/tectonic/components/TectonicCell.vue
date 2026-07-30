<script setup lang="ts">
import { computed } from 'vue'
import type { TectonicCell } from '@/contexts/tectonic/types/tectonic'
import { getRegionColor } from '@/contexts/tectonic/utils/tectonicColors'

const props = defineProps<{
  cell: TectonicCell
  row: number
  col: number
  isSelected: boolean
  borders: { top: boolean; right: boolean; bottom: boolean; left: boolean }
}>()

const emit = defineEmits<{
  select: [row: number, col: number]
}>()

const cellClass = computed(() => ({
  'tectonic-cell': true,
  initial: props.cell.isInitial,
  error: props.cell.isError,
  highlighted: props.cell.isHighlighted,
  selected: props.isSelected,
  'border-top': props.borders.top,
  'border-right': props.borders.right,
  'border-bottom': props.borders.bottom,
  'border-left': props.borders.left
}))

const cellStyle = computed(() => ({
  backgroundColor: getRegionColor(props.cell.regionId)
}))
</script>

<template>
  <div :class="cellClass" :style="cellStyle" @click="emit('select', row, col)">
    <span v-if="cell.value !== null" class="cell-value">{{ cell.value }}</span>
  </div>
</template>

<style scoped>
.tectonic-cell {
  width: 100%;
  height: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-light);
  cursor: pointer;
  transition: outline 0.15s ease;
  position: relative;
  user-select: none;
  box-sizing: border-box;
}

.tectonic-cell.border-top {
  border-top: 3px solid var(--border-thick);
}
.tectonic-cell.border-right {
  border-right: 3px solid var(--border-thick);
}
.tectonic-cell.border-bottom {
  border-bottom: 3px solid var(--border-thick);
}
.tectonic-cell.border-left {
  border-left: 3px solid var(--border-thick);
}

.tectonic-cell.initial {
  cursor: default;
  font-weight: 700;
}

.tectonic-cell.highlighted {
  filter: brightness(1.1);
}

.tectonic-cell.selected {
  outline: 3px solid var(--primary);
  outline-offset: -3px;
  z-index: 1;
}

.tectonic-cell.error .cell-value {
  color: var(--error-text);
}

.cell-value {
  font-size: clamp(1rem, 4vw, 1.75rem);
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 640px) {
  .cell-value {
    font-size: clamp(0.9rem, 5vw, 1.4rem);
  }
}
</style>
