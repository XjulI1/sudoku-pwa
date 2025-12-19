<script setup lang="ts">
import { computed } from 'vue'
import SudokuCell from './SudokuCell.vue'
import { useSudokuStore } from '@/stores/sudoku'
import { GridSize } from '@/types/sudoku'

const store = useSudokuStore()

const isSelected = (row: number, col: number) => {
  return (
    store.selectedCell !== null &&
    store.selectedCell.row === row &&
    store.selectedCell.col === col
  )
}

const gridTemplateColumns = computed(() => {
  const size = store.grid.length
  return `repeat(${size}, 1fr)`
})

const gridTemplateRows = computed(() => {
  const size = store.grid.length
  return `repeat(${size}, 1fr)`
})
</script>

<template>
  <div class="sudoku-grid-container">
    <div
      class="sudoku-grid"
      :style="{
        gridTemplateColumns: gridTemplateColumns,
        gridTemplateRows: gridTemplateRows
      }"
      :class="{ 'grid-6x6': store.gridSize === 6 }"
    >
      <template v-for="(row, rowIndex) in store.grid" :key="rowIndex">
        <SudokuCell
          v-for="(cell, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          :cell="cell"
          :row="rowIndex"
          :col="colIndex"
          :grid-size="store.gridSize"
          :is-selected="isSelected(rowIndex, colIndex)"
          @select="store.selectCell"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.sudoku-grid-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.sudoku-grid {
  display: grid;
  border: 3px solid var(--border-thick);
  background-color: var(--border-thick);
  max-width: min(90vw, 600px);
  width: 100%;
  aspect-ratio: 1;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.sudoku-grid.grid-6x6 {
  max-width: min(90vw, 400px);
}

@media (max-width: 640px) {
  .sudoku-grid-container {
    padding: 0.5rem;
  }

  .sudoku-grid {
    max-width: 100%;
  }
}
</style>
