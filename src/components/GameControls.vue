<script setup lang="ts">
import { useSudokuStore } from '@/stores/sudoku'

const store = useSudokuStore()

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const handleKeyPress = (event: KeyboardEvent) => {
  if (store.isCompleted || store.isPaused) return

  const key = event.key
  if (key >= '1' && key <= '9') {
    store.handleNumberInput(parseInt(key))
  } else if (key === 'Backspace' || key === 'Delete') {
    store.clearSelectedCell()
  } else if (key === 'n' || key === 'N') {
    store.noteMode = !store.noteMode
  }
}

// Ajouter l'écouteur d'événements clavier
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeyPress)
}
</script>

<template>
  <div class="game-controls">
    <div class="number-pad">
      <button
        v-for="num in numbers"
        :key="num"
        class="number-btn"
        :class="{ disabled: store.isCompleted || store.isPaused }"
        @click="store.handleNumberInput(num)"
        :disabled="store.isCompleted || store.isPaused"
      >
        {{ num }}
      </button>
    </div>

    <div class="action-buttons">
      <button
        class="action-btn"
        :class="{ active: store.noteMode }"
        @click="store.noteMode = !store.noteMode"
        :disabled="store.isCompleted || store.isPaused"
      >
        📝 Notes
      </button>
      <button
        class="action-btn"
        @click="store.clearSelectedCell"
        :disabled="store.isCompleted || store.isPaused"
      >
        ❌ Effacer
      </button>
      <button
        class="action-btn hint-btn"
        @click="store.getHint"
        :disabled="store.isCompleted || store.isPaused"
      >
        💡 Indice
      </button>
    </div>
  </div>
</template>

<style scoped>
.game-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.number-pad {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 0.5rem;
}

.number-btn {
  aspect-ratio: 1;
  font-size: clamp(1rem, 3vw, 1.5rem);
  font-weight: 600;
  border: 2px solid var(--border-light);
  background-color: var(--btn-bg);
  color: var(--text);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.number-btn:hover:not(:disabled) {
  background-color: var(--btn-hover);
  transform: scale(1.05);
}

.number-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.number-btn.disabled,
.number-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.action-btn {
  padding: 0.75rem 1rem;
  font-size: clamp(0.875rem, 2vw, 1rem);
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

.hint-btn:hover:not(:disabled) {
  background-color: var(--warning);
  border-color: var(--warning);
  color: white;
}

@media (max-width: 640px) {
  .game-controls {
    padding: 0.5rem;
  }

  .number-pad {
    gap: 0.25rem;
  }

  .action-buttons {
    gap: 0.25rem;
  }

  .action-btn {
    padding: 0.5rem;
    font-size: 0.75rem;
  }
}
</style>
