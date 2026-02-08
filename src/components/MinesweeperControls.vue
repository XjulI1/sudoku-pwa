<script setup lang="ts">
import { useMinesweeperStore } from '@/stores/minesweeper'

const store = useMinesweeperStore()
</script>

<template>
  <div class="minesweeper-controls">
    <div class="instructions">
      <p class="instruction-text">
        Cliquez pour révéler, utilisez le mode drapeau pour marquer les mines
      </p>
      <p class="instruction-subtitle">Clic droit (ou mode drapeau) = poser/retirer un drapeau</p>
    </div>

    <div class="action-buttons">
      <button
        class="action-btn flag-btn"
        :class="{ active: store.flagMode }"
        @click="store.toggleFlagMode"
        :disabled="store.isCompleted || store.isGameOver || store.isPaused"
        title="Basculer le mode drapeau"
      >
        🚩 Drapeau
      </button>
    </div>
  </div>
</template>

<style scoped>
.minesweeper-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-width: 700px;
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

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.action-btn {
  padding: 1rem 2rem;
  font-size: clamp(1rem, 3vw, 1.25rem);
  font-weight: 500;
  border: 2px solid var(--border-light);
  background-color: var(--btn-bg);
  color: var(--text);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background-color: var(--btn-hover);
}

.action-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.active {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

@media (max-width: 640px) {
  .minesweeper-controls {
    padding: 0.5rem;
  }

  .instructions {
    padding: 0.75rem 1rem;
  }

  .action-btn {
    padding: 0.75rem 1.5rem;
    font-size: clamp(0.875rem, 2.5vw, 1rem);
  }
}
</style>
