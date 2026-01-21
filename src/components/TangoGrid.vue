<script setup lang="ts">
import { computed } from 'vue'
import TangoCell from './TangoCell.vue'
import { useTangoStore } from '@/stores/tango'
import { ConstraintDirection, type TangoConstraint } from '@/types/tango'

const store = useTangoStore()

const isSelected = (row: number, col: number) => {
  return (
    store.selectedCell !== null &&
    store.selectedCell.row === row &&
    store.selectedCell.col === col
  )
}

// Vérifie s'il y a une contrainte horizontale pour une cellule
const getHorizontalConstraint = (row: number, col: number): TangoConstraint | undefined => {
  return store.constraints.find(
    (c) =>
      c.row === row &&
      c.col === col &&
      c.direction === ConstraintDirection.HORIZONTAL
  )
}

// Vérifie s'il y a une contrainte verticale pour une cellule
const getVerticalConstraint = (row: number, col: number): TangoConstraint | undefined => {
  return store.constraints.find(
    (c) =>
      c.row === row &&
      c.col === col &&
      c.direction === ConstraintDirection.VERTICAL
  )
}
</script>

<template>
  <div class="tango-grid-container">
    <div class="tango-grid-wrapper">
      <div class="tango-grid">
        <template v-for="(row, rowIndex) in store.grid" :key="rowIndex">
          <template v-for="(cell, colIndex) in row" :key="`${rowIndex}-${colIndex}`">
            <div class="cell-wrapper">
              <TangoCell
                :cell="cell"
                :row="rowIndex"
                :col="colIndex"
                :is-selected="isSelected(rowIndex, colIndex)"
                @select="store.selectCell"
              />

              <!-- Contrainte horizontale (à droite) -->
              <div
                v-if="getHorizontalConstraint(rowIndex, colIndex)"
                class="constraint horizontal"
              >
                {{ getHorizontalConstraint(rowIndex, colIndex)!.type }}
              </div>

              <!-- Contrainte verticale (en bas) -->
              <div
                v-if="getVerticalConstraint(rowIndex, colIndex)"
                class="constraint vertical"
              >
                {{ getVerticalConstraint(rowIndex, colIndex)!.type }}
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tango-grid-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  flex: 1;
}

.tango-grid-wrapper {
  position: relative;
  max-width: min(90vw, 500px);
  width: 100%;
}

.tango-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 0;
  border: 3px solid var(--border-thick);
  background-color: var(--border-thick);
  aspect-ratio: 1;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.cell-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.constraint {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg);
  font-size: clamp(0.75rem, 2vw, 1rem);
  font-weight: 700;
  color: var(--primary);
  z-index: 2;
  border: 1px solid var(--border-light);
  border-radius: 50%;
}

.constraint.horizontal {
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
}

.constraint.vertical {
  bottom: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 28px;
}

@media (max-width: 640px) {
  .tango-grid-container {
    padding: 0.5rem;
  }

  .tango-grid-wrapper {
    max-width: 100%;
  }

  .constraint.horizontal {
    right: -12px;
    width: 24px;
    height: 24px;
    font-size: 0.7rem;
  }

  .constraint.vertical {
    bottom: -12px;
    width: 24px;
    height: 24px;
    font-size: 0.7rem;
  }
}
</style>
