<script setup lang="ts">
import { usePicrossStore } from '@/contexts/picross/store/picross'
import { PicrossCellState } from '@/contexts/picross/types/picross'

const store = usePicrossStore()

const isSelected = (row: number, col: number) => {
  return (
    store.selectedCell !== null &&
    store.selectedCell.row === row &&
    store.selectedCell.col === col
  )
}

const cellClass = (row: number, col: number) => {
  const cell = store.grid[row]![col]!
  return {
    'picross-cell': true,
    filled: cell.state === PicrossCellState.FILLED,
    error: cell.isError,
    selected: isSelected(row, col)
  }
}
</script>

<template>
  <div class="picross-grid-container">
    <div class="picross-grid-wrapper">
      <table class="picross-table" :style="{ '--cols': store.gridSize }">
        <!-- En-tête: indices des colonnes -->
        <thead>
          <tr>
            <!-- Cellule vide coin supérieur gauche -->
            <th class="corner-cell"></th>
            <th
              v-for="(clue, colIndex) in store.colClues"
              :key="colIndex"
              class="col-clue"
              :class="{ 'clue-complete': store.isColComplete(colIndex) }"
            >
              <div class="clue-numbers vertical">
                <span
                  v-for="(num, i) in clue"
                  :key="i"
                  class="clue-number"
                >{{ num }}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in store.grid" :key="rowIndex">
            <!-- Indices de la ligne -->
            <th
              class="row-clue"
              :class="{ 'clue-complete': store.isRowComplete(rowIndex) }"
            >
              <div class="clue-numbers horizontal">
                <span
                  v-for="(num, i) in store.rowClues[rowIndex]"
                  :key="i"
                  class="clue-number"
                >{{ num }}</span>
              </div>
            </th>
            <!-- Cellules de la grille -->
            <td
              v-for="(cell, colIndex) in row"
              :key="colIndex"
              :class="cellClass(rowIndex, colIndex)"
              @click="store.selectCell(rowIndex, colIndex)"
            >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.picross-grid-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  flex: 1;
  overflow: auto;
}

.picross-grid-wrapper {
  max-width: min(95vw, 600px);
  overflow: auto;
}

.picross-table {
  --cell-size: calc(min(92vw, 550px) / var(--cols));
  border-collapse: collapse;
  border-spacing: 0;
  border: 2px solid var(--border-thick);
}

.corner-cell {
  background-color: var(--bg);
  border: none;
}

/* Indices des colonnes */
.col-clue {
  padding: 0.25rem 0;
  background-color: var(--bg);
  vertical-align: bottom;
  border: none;
}

.col-clue.clue-complete .clue-number {
  color: var(--success);
  opacity: 0.6;
}

/* Indices des lignes */
.row-clue {
  padding: 0 0.5rem;
  background-color: var(--bg);
  text-align: right;
  white-space: nowrap;
  border: none;
}

.row-clue.clue-complete .clue-number {
  color: var(--success);
  opacity: 0.6;
}

/* Conteneur des indices */
.clue-numbers {
  display: flex;
  gap: 0.2rem;
}

.clue-numbers.vertical {
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-height: 1.5rem;
}

.clue-numbers.horizontal {
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
}

.clue-number {
  font-size: calc(var(--cell-size) * 0.35);
  font-weight: 600;
  color: var(--text);
  line-height: 1.2;
  min-width: 0.8em;
  text-align: center;
}

/* Cellules de la grille */
.picross-cell {
  width: var(--cell-size);
  height: var(--cell-size);
  border: 1px solid var(--border-light);
  background-color: var(--cell-bg);
  cursor: pointer;
  transition: background-color 0.15s ease;
  position: relative;
  text-align: center;
  vertical-align: middle;
  user-select: none;
}

.picross-cell:hover {
  background-color: var(--cell-hover);
}

.picross-cell.selected {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
  z-index: 1;
}

.picross-cell.filled {
  background-color: var(--text);
}

.picross-cell.error {
  background-color: var(--error-text);
}

@media (max-width: 640px) {
  .picross-grid-container {
    padding: 0.25rem;
  }

  .picross-grid-wrapper {
    max-width: 100%;
  }

  .picross-table {
    --cell-size: calc(min(97vw, 480px) / var(--cols));
  }

  .row-clue {
    padding: 0 0.25rem;
  }
}
</style>
