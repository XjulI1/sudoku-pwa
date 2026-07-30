<script setup lang="ts">
import { useTectonicStore } from '@/stores/tectonic'
import TectonicCell from '@/components/TectonicCell.vue'

const store = useTectonicStore()

const isSelected = (row: number, col: number) => {
  return store.selectedCell !== null && store.selectedCell.row === row && store.selectedCell.col === col
}

// Bord épais entre deux cases de zones différentes (ou en bord de grille)
const cellBorders = (row: number, col: number) => {
  const regionId = store.grid[row]![col]!.regionId
  return {
    top: row === 0 || store.grid[row - 1]![col]!.regionId !== regionId,
    left: col === 0 || store.grid[row]![col - 1]!.regionId !== regionId,
    right: col === store.cols - 1 || store.grid[row]![col + 1]!.regionId !== regionId,
    bottom: row === store.rows - 1 || store.grid[row + 1]![col]!.regionId !== regionId
  }
}
</script>

<template>
  <div class="tectonic-grid-container">
    <div
      class="tectonic-grid"
      :style="{ gridTemplateColumns: `repeat(${store.cols}, 1fr)`, aspectRatio: `${store.cols} / ${store.rows}` }"
    >
      <TectonicCell
        v-for="(cell, index) in store.grid.flat()"
        :key="index"
        :cell="cell"
        :row="Math.floor(index / store.cols)"
        :col="index % store.cols"
        :is-selected="isSelected(Math.floor(index / store.cols), index % store.cols)"
        :borders="cellBorders(Math.floor(index / store.cols), index % store.cols)"
        @select="store.selectCell"
      />
    </div>
  </div>
</template>

<style scoped>
.tectonic-grid-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  flex: 1;
  overflow: auto;
}

.tectonic-grid {
  display: grid;
  width: min(95vw, 560px);
  border: 2px solid var(--border-thick);
}

@media (max-width: 640px) {
  .tectonic-grid-container {
    padding: 0.25rem;
  }

  .tectonic-grid {
    width: min(98vw, 480px);
  }
}
</style>
