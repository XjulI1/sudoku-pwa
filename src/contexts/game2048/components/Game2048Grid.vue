<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useGame2048Store } from '@/contexts/game2048/store/game2048'
import { Direction } from '@/contexts/game2048/types/game2048'
import type { Tile } from '@/contexts/game2048/types/game2048'

const store = useGame2048Store()

const gridRef = ref<HTMLElement | null>(null)

// Touch handling
let touchStartX = 0
let touchStartY = 0
const SWIPE_THRESHOLD = 30

function handleTouchStart(e: TouchEvent): void {
  const touch = e.touches[0]
  if (touch) {
    touchStartX = touch.clientX
    touchStartY = touch.clientY
  }
}

function handleTouchEnd(e: TouchEvent): void {
  const touch = e.changedTouches[0]
  if (!touch) return

  const dx = touch.clientX - touchStartX
  const dy = touch.clientY - touchStartY
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return

  if (absDx > absDy) {
    store.move(dx > 0 ? Direction.RIGHT : Direction.LEFT)
  } else {
    store.move(dy > 0 ? Direction.DOWN : Direction.UP)
  }
}

// Keyboard handling
function handleKeyDown(e: KeyboardEvent): void {
  let direction: Direction | null = null

  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'z':
      direction = Direction.UP
      break
    case 'ArrowDown':
    case 's':
      direction = Direction.DOWN
      break
    case 'ArrowLeft':
    case 'a':
    case 'q':
      direction = Direction.LEFT
      break
    case 'ArrowRight':
    case 'd':
      direction = Direction.RIGHT
      break
  }

  if (direction) {
    e.preventDefault()
    store.move(direction)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${store.gridSize}, 1fr)`,
  gridTemplateRows: `repeat(${store.gridSize}, 1fr)`,
}))

function getTileClass(tile: Tile | null): string {
  if (!tile) return ''
  const classes = [`tile-${tile.value}`]
  if (tile.isNew) classes.push('tile-new')
  if (tile.mergedFrom) classes.push('tile-merged')
  if (tile.value > 2048) classes.push('tile-super')
  return classes.join(' ')
}
</script>

<template>
  <div class="game2048-grid-container">
    <div
      ref="gridRef"
      class="game2048-grid-wrapper"
      @touchstart.passive="handleTouchStart"
      @touchend.passive="handleTouchEnd"
    >
      <div class="game2048-grid" :style="gridStyle">
        <template v-for="(row, rowIndex) in store.grid" :key="rowIndex">
          <div
            v-for="(tile, colIndex) in row"
            :key="`${rowIndex}-${colIndex}`"
            class="cell"
          >
            <div
              v-if="tile"
              class="tile"
              :class="getTileClass(tile)"
            >
              {{ tile.value }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game2048-grid-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  flex: 1;
}

.game2048-grid-wrapper {
  position: relative;
  max-width: min(90vw, 500px);
  width: 100%;
  touch-action: none;
}

.game2048-grid {
  display: grid;
  gap: 8px;
  padding: 8px;
  border-radius: 12px;
  background-color: var(--grid-bg, #bbada0);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.cell {
  aspect-ratio: 1;
  background-color: var(--cell-empty, rgba(238, 228, 218, 0.35));
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.tile {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-weight: 700;
  font-size: clamp(1.25rem, 5vw, 2.5rem);
  transition: all 0.1s ease;
  /* Couleurs par défaut */
  background-color: #eee4da;
  color: #776e65;
}

/* Couleurs des tuiles */
.tile-2 {
  background-color: #eee4da;
  color: #776e65;
}

.tile-4 {
  background-color: #ede0c8;
  color: #776e65;
}

.tile-8 {
  background-color: #f2b179;
  color: #f9f6f2;
}

.tile-16 {
  background-color: #f59563;
  color: #f9f6f2;
}

.tile-32 {
  background-color: #f67c5f;
  color: #f9f6f2;
}

.tile-64 {
  background-color: #f65e3b;
  color: #f9f6f2;
}

.tile-128 {
  background-color: #edcf72;
  color: #f9f6f2;
  font-size: clamp(1.1rem, 4.5vw, 2.25rem);
}

.tile-256 {
  background-color: #edcc61;
  color: #f9f6f2;
  font-size: clamp(1.1rem, 4.5vw, 2.25rem);
}

.tile-512 {
  background-color: #edc850;
  color: #f9f6f2;
  font-size: clamp(1.1rem, 4.5vw, 2.25rem);
}

.tile-1024 {
  background-color: #edc53f;
  color: #f9f6f2;
  font-size: clamp(0.95rem, 4vw, 2rem);
}

.tile-2048 {
  background-color: #edc22e;
  color: #f9f6f2;
  font-size: clamp(0.95rem, 4vw, 2rem);
  box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0.4);
}

.tile-super {
  background-color: #3c3a32;
  color: #f9f6f2;
  font-size: clamp(0.8rem, 3.5vw, 1.75rem);
}

.tile-4096 {
  background-color: #3c3a32;
  color: #f9f6f2;
  font-size: clamp(0.85rem, 3.5vw, 1.75rem);
}

.tile-8192 {
  background-color: #3c3a32;
  color: #f9f6f2;
  font-size: clamp(0.8rem, 3.5vw, 1.5rem);
}

/* Animations */
.tile-new {
  animation: tile-appear 0.2s ease;
}

.tile-merged {
  animation: tile-pop 0.2s ease;
}

@keyframes tile-appear {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes tile-pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 640px) {
  .game2048-grid-container {
    padding: 0.5rem;
  }

  .game2048-grid-wrapper {
    max-width: 100%;
  }

  .game2048-grid {
    gap: 6px;
    padding: 6px;
  }
}

/* Dark mode adjustments for grid */
@media (prefers-color-scheme: dark) {
  .game2048-grid {
    --grid-bg: #5c5348;
    --cell-empty: rgba(238, 228, 218, 0.15);
  }
}
</style>
