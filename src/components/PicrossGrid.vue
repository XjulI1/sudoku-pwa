<script setup lang="ts">
import { usePicrossStore } from '@/stores/picross'
import { PicrossCellState } from '@/types/picross'

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
      <table class="picross-table">
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
  max-width: min(90vw, 600px);
  overflow: auto;
}

.picross-table {
  border-collapse: collapse;
  border-spacing: 0;
}

.corner-cell {
  background-color: var(--bg);
}

/* Indices des colonnes */
.col-clue {
  padding: 0.25rem 0;
  background-color: var(--bg);
  vertical-align: bottom;
  min-width: 1.5rem;
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
  font-size: clamp(0.65rem, 1.5vw, 0.85rem);
  font-weight: 600;
  color: var(--text);
  line-height: 1.2;
  min-width: 0.8em;
  text-align: center;
}

/* Cellules de la grille */
.picross-cell {
  width: clamp(1.5rem, 4vw, 2.5rem);
  height: clamp(1.5rem, 4vw, 2.5rem);
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

/* Bordures épaisses tous les 5 cellules */
.picross-cell:nth-child(5n + 1) {
  border-left: 2px solid var(--border-thick);
}

tr:nth-child(5n + 1) .picross-cell {
  border-top: 2px solid var(--border-thick);
}

/* Bordure extérieure */
thead + tbody tr:first-child .picross-cell {
  border-top: 2px solid var(--border-thick);
}

tbody tr:last-child .picross-cell {
  border-bottom: 2px solid var(--border-thick);
}

tbody tr .picross-cell:last-child {
  border-right: 2px solid var(--border-thick);
}

/* Le premier picross-cell de chaque ligne (qui suit le row-clue th) */
tbody tr .picross-cell:first-of-type {
  border-left: 2px solid var(--border-thick);
}

@media (max-width: 640px) {
  .picross-grid-container {
    padding: 0.5rem;
  }

  .picross-grid-wrapper {
    max-width: 100%;
  }

  .clue-number {
    font-size: clamp(0.55rem, 1.2vw, 0.75rem);
  }

  .row-clue {
    padding: 0 0.25rem;
  }
}
</style>
