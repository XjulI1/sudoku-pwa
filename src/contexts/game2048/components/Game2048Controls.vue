<script setup lang="ts">
import { useGame2048Store } from '@/contexts/game2048/store/game2048'
import { Direction } from '@/contexts/game2048/types/game2048'

const store = useGame2048Store()

function handleDirection(direction: Direction): void {
  store.move(direction)
}
</script>

<template>
  <div class="game2048-controls">
    <div class="instructions">
      <p class="instruction-text">Glissez ou utilisez les flèches du clavier</p>
      <p class="instruction-subtitle">Fusionnez les tuiles identiques pour atteindre {{ store.targetTile }}</p>
    </div>

    <div class="direction-pad">
      <button
        class="dir-btn up"
        @click="handleDirection(Direction.UP)"
        :disabled="!store.isPlaying || store.isPaused"
        aria-label="Haut"
      >
        ▲
      </button>
      <div class="dir-row">
        <button
          class="dir-btn left"
          @click="handleDirection(Direction.LEFT)"
          :disabled="!store.isPlaying || store.isPaused"
          aria-label="Gauche"
        >
          ◀
        </button>
        <button
          class="dir-btn right"
          @click="handleDirection(Direction.RIGHT)"
          :disabled="!store.isPlaying || store.isPaused"
          aria-label="Droite"
        >
          ▶
        </button>
      </div>
      <button
        class="dir-btn down"
        @click="handleDirection(Direction.DOWN)"
        :disabled="!store.isPlaying || store.isPaused"
        aria-label="Bas"
      >
        ▼
      </button>
    </div>
  </div>
</template>

<style scoped>
.game2048-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-width: 500px;
  margin: 0 auto;
}

.instructions {
  background: var(--cell-bg);
  border: 2px solid var(--border-light);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  text-align: center;
}

.instruction-text {
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--text);
}

.instruction-subtitle {
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  color: var(--text-secondary);
  margin: 0;
}

.direction-pad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.dir-row {
  display: flex;
  gap: 3.5rem;
}

.dir-btn {
  width: 3.5rem;
  height: 3.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  border: 2px solid var(--border-light);
  background-color: var(--btn-bg);
  color: var(--text);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dir-btn:hover:not(:disabled) {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
  transform: scale(1.05);
}

.dir-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.dir-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .game2048-controls {
    padding: 0.5rem;
  }

  .instructions {
    padding: 0.75rem 1rem;
  }

  .dir-btn {
    width: 3rem;
    height: 3rem;
    font-size: 1rem;
  }

  .dir-row {
    gap: 3rem;
  }
}
</style>
