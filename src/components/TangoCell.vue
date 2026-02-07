<script setup lang="ts">
import { computed } from 'vue'
import type { TangoCell } from '@/types/tango'
import { TangoSymbol } from '@/types/tango'

const props = defineProps<{
  cell: TangoCell
  row: number
  col: number
  isSelected: boolean
}>()

const emit = defineEmits<{
  select: [row: number, col: number]
}>()

const cellClass = computed(() => ({
  'tango-cell': true,
  initial: props.cell.isInitial,
  error: props.cell.isError,
  highlighted: props.cell.isHighlighted,
  selected: props.isSelected
}))

const displaySymbol = computed(() => {
  if (props.cell.value === TangoSymbol.EMPTY) return ''
  return props.cell.value
})
</script>

<template>
  <div :class="cellClass" @click="emit('select', row, col)">
    <div v-if="displaySymbol" class="cell-value">
      {{ displaySymbol }}
    </div>
  </div>
</template>

<style scoped>
.tango-cell {
  width: 100%;
  height: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-light);
  background-color: var(--cell-bg);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  user-select: none;
}

.tango-cell:hover:not(.initial) {
  background-color: var(--cell-hover);
}

.tango-cell.initial {
  background-color: var(--cell-initial);
  cursor: default;
  font-weight: 600;
}

.tango-cell.error {
  background-color: var(--cell-error);
}

.tango-cell.highlighted {
  background-color: var(--cell-highlighted);
}

.tango-cell.selected {
  background-color: var(--cell-selected);
  outline: 2px solid var(--primary);
  outline-offset: -2px;
  z-index: 1;
}

.cell-value {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
}

.cell-value.moon {
  color: #1e3a8a; /* Bleu foncé pour la lune */
  text-shadow: 0 0 2px rgba(30, 58, 138, 0.5);
}

@media (max-width: 640px) {
  .cell-value {
    font-size: clamp(1.25rem, 6vw, 2rem);
  }
}
</style>
