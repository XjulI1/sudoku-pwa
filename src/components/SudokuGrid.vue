<script setup lang="ts">
import { computed } from 'vue'
import SudokuCell from './SudokuCell.vue'
import { useSudokuStore } from '@/stores/sudoku'

const store = useSudokuStore()

const isSelected = (row: number, col: number) => {
  return (
    store.selectedCell !== null &&
    store.selectedCell.row === row &&
    store.selectedCell.col === col
  )
}
</script>

<template>
  <div class="sudoku-grid-container">
    <div class="sudoku-grid">
      <template v-for="(row, rowIndex) in store.grid" :key="rowIndex">
        <SudokuCell
          v-for="(cell, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          :cell="cell"
          :row="rowIndex"
          :col="colIndex"
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
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(9, 1fr);
  border: 3px solid var(--border-thick);
  background-color: var(--border-thick);
  max-width: min(90vw, 600px);
  width: 100%;
  aspect-ratio: 1;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
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
