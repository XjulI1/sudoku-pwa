<script setup lang="ts">
import { computed } from 'vue'
import DedaleCell from './DedaleCell.vue'
import { useDedaleStore } from '@/stores/dedale'

const store = useDedaleStore()

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${store.cols}, 1fr)`,
  gridTemplateRows: `repeat(${store.rows}, 1fr)`,
  aspectRatio: `${store.cols} / ${store.rows}`
}))

const isActive = (pairIndex: number | null) => pairIndex !== null && pairIndex === store.activePairIndex

let isDragging = false
let lastCell: { row: number; col: number } | null = null

// Retrouve la cellule (row/col) sous un point de l'écran, via les attributs
// data-row/data-col posés par DedaleCell. Nécessaire pour le glisser continu :
// avec la capture de pointeur, seul le conteneur reçoit les événements, donc on
// doit retrouver nous-mêmes l'élément réellement survolé.
function cellFromPoint(x: number, y: number): { row: number; col: number } | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null
  const target = el?.closest('[data-row]') as HTMLElement | null
  if (!target) return null
  const row = Number(target.dataset.row)
  const col = Number(target.dataset.col)
  if (Number.isNaN(row) || Number.isNaN(col)) return null
  return { row, col }
}

function onPointerDown(event: PointerEvent) {
  if (store.isPaused || store.isCompleted) return
  const pos = cellFromPoint(event.clientX, event.clientY)
  if (!pos) return

  const container = event.currentTarget as HTMLElement
  container.setPointerCapture(event.pointerId)
  isDragging = true
  lastCell = pos
  store.interactCell(pos.row, pos.col)
}

function onPointerMove(event: PointerEvent) {
  if (!isDragging) return
  const pos = cellFromPoint(event.clientX, event.clientY)
  if (!pos || (lastCell && pos.row === lastCell.row && pos.col === lastCell.col)) return
  lastCell = pos
  store.interactCell(pos.row, pos.col)
}

function endDrag() {
  isDragging = false
  lastCell = null
}
</script>

<template>
  <div class="dedale-grid-container">
    <div class="dedale-grid-wrapper">
      <div
        class="dedale-grid"
        :style="gridStyle"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="endDrag"
        @pointercancel="endDrag"
      >
        <template v-for="(row, rowIndex) in store.grid" :key="rowIndex">
          <DedaleCell
            v-for="(cell, colIndex) in row"
            :key="`${rowIndex}-${colIndex}`"
            :cell="cell"
            :row="rowIndex"
            :col="colIndex"
            :is-active="isActive(cell.pairIndex)"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dedale-grid-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  flex: 1;
}

.dedale-grid-wrapper {
  max-width: min(92vw, 560px);
  width: 100%;
}

.dedale-grid {
  display: grid;
  gap: 0;
  border: 3px solid var(--border-thick);
  background-color: var(--border-thick);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  touch-action: none;
}

@media (max-width: 640px) {
  .dedale-grid-container {
    padding: 0.5rem;
  }

  .dedale-grid-wrapper {
    max-width: 100%;
  }
}
</style>
