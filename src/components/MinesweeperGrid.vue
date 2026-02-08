<script setup lang="ts">
import { computed } from 'vue'
import MinesweeperCell from './MinesweeperCell.vue'
import { useMinesweeperStore } from '@/stores/minesweeper'

const store = useMinesweeperStore()

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${store.config.cols}, 1fr)`,
  gridTemplateRows: `repeat(${store.config.rows}, 1fr)`
}))
</script>

<template>
  <div class="minesweeper-grid-container">
    <div class="minesweeper-grid-wrapper">
      <div class="minesweeper-grid" :style="gridStyle">
        <template v-for="(row, rowIndex) in store.grid" :key="rowIndex">
          <MinesweeperCell
            v-for="(cell, colIndex) in row"
            :key="`${rowIndex}-${colIndex}`"
            :cell="cell"
            :row="rowIndex"
            :col="colIndex"
            :game-over="store.isGameOver"
            @click="store.handleCellClick"
            @rightclick="store.handleCellRightClick"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.minesweeper-grid-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  flex: 1;
  overflow: auto;
}

.minesweeper-grid-wrapper {
  position: relative;
  max-width: min(90vw, 700px);
  width: 100%;
}

.minesweeper-grid {
  display: grid;
  gap: 0;
  border: 3px solid var(--border-thick);
  background-color: var(--border-thick);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

/* Cellules carrées */
.minesweeper-grid > :deep(.mine-cell) {
  aspect-ratio: 1;
}

@media (max-width: 640px) {
  .minesweeper-grid-container {
    padding: 0.5rem;
  }

  .minesweeper-grid-wrapper {
    max-width: 100%;
  }
}
</style>
