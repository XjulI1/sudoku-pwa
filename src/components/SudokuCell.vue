<script setup lang="ts">
import { computed } from 'vue'
import type { Cell } from '@/types/sudoku'
import { GridSize } from '@/types/sudoku'

const props = defineProps<{
  cell: Cell
  row: number
  col: number
  gridSize: GridSize
  isSelected: boolean
}>()

const emit = defineEmits<{
  select: [row: number, col: number]
}>()

const regionCols = computed(() => (props.gridSize === GridSize.SIX ? 3 : 3))
const regionRows = computed(() => (props.gridSize === GridSize.SIX ? 2 : 3))
const maxIndex = computed(() => props.gridSize - 1)

const cellClass = computed(() => ({
  'sudoku-cell': true,
  'initial': props.cell.isInitial,
  'error': props.cell.isError,
  'highlighted': props.cell.isHighlighted,
  'selected': props.isSelected,
  'thick-right': (props.col + 1) % regionCols.value === 0 && props.col !== maxIndex.value,
  'thick-bottom': (props.row + 1) % regionRows.value === 0 && props.row !== maxIndex.value
}))

const notesArray = computed(() => {
  return Array.from(props.cell.notes).sort()
})

const notesGridTemplate = computed(() => {
  if (props.gridSize === GridSize.SIX) {
    return {
      areas: `'n1 n2 n3' 'n4 n5 n6'`,
      columns: 'repeat(3, 1fr)',
      rows: 'repeat(2, 1fr)'
    }
  }
  return {
    areas: `'n1 n2 n3' 'n4 n5 n6' 'n7 n8 n9'`,
    columns: 'repeat(3, 1fr)',
    rows: 'repeat(3, 1fr)'
  }
})
</script>

<template>
  <div :class="cellClass" @click="emit('select', row, col)">
    <div v-if="cell.value" class="cell-value">{{ cell.value }}</div>
    <div
      v-else-if="cell.notes.size > 0"
      class="cell-notes"
      :style="{
        gridTemplateAreas: notesGridTemplate.areas,
        gridTemplateColumns: notesGridTemplate.columns,
        gridTemplateRows: notesGridTemplate.rows
      }"
    >
      <span
        v-for="note in notesArray"
        :key="note"
        class="note"
        :style="{ gridArea: `n${note}` }"
      >
        {{ note }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.sudoku-cell {
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

.sudoku-cell:hover:not(.initial) {
  background-color: var(--cell-hover);
}

.sudoku-cell.initial {
  background-color: var(--cell-initial);
  cursor: default;
  font-weight: 600;
}

.sudoku-cell.error {
  background-color: var(--cell-error);
  color: var(--error-text);
}

.sudoku-cell.highlighted {
  background-color: var(--cell-highlighted);
}

.sudoku-cell.selected {
  background-color: var(--cell-selected);
  outline: 2px solid var(--primary);
  outline-offset: -2px;
  z-index: 1;
}

.sudoku-cell.thick-right {
  border-right: 2px solid var(--border-thick);
}

.sudoku-cell.thick-bottom {
  border-bottom: 2px solid var(--border-thick);
}

.cell-value {
  font-size: clamp(1.25rem, 4vw, 2rem);
  font-weight: 500;
}

.cell-notes {
  display: grid;
  width: 100%;
  height: 100%;
  padding: 2px;
}

.note {
  font-size: clamp(0.5rem, 1.5vw, 0.75rem);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--note-color);
}

@media (max-width: 640px) {
  .cell-value {
    font-size: clamp(1rem, 5vw, 1.5rem);
  }

  .note {
    font-size: clamp(0.4rem, 2vw, 0.6rem);
  }
}
</style>
