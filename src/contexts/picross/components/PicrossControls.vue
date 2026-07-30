<script setup lang="ts">
import { usePicrossStore } from '@/contexts/picross/store/picross'

const store = usePicrossStore()

const handleKeyPress = (event: KeyboardEvent) => {
  if (store.isCompleted || store.isPaused) return

  const key = event.key.toLowerCase()

  if (key === 'backspace' || key === 'delete') {
    store.clearSelectedCell()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeyPress)
}
</script>

<template>
  <div class="picross-controls">
    <div class="action-buttons">
      <button
        class="action-btn"
        @click="store.clearSelectedCell"
        :disabled="store.isCompleted || store.isPaused"
        title="Effacer (Backspace ou Delete)"
      >
        ❌ Effacer
      </button>
      <button
        class="action-btn hint-btn"
        @click="store.getHint"
        :disabled="store.isCompleted || store.isPaused"
        title="Révéler une cellule aléatoire"
      >
        💡 Indice
      </button>
    </div>
  </div>
</template>

<style scoped>
.picross-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-width: 500px;
  margin: 0 auto;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.action-btn {
  padding: 1rem;
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

.hint-btn:hover:not(:disabled) {
  background-color: var(--warning);
  border-color: var(--warning);
  color: white;
}

@media (max-width: 640px) {
  .picross-controls {
    padding: 0.5rem;
  }

  .action-btn {
    padding: 0.75rem;
    font-size: clamp(0.875rem, 2.5vw, 1rem);
  }
}
</style>
