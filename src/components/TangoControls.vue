<script setup lang="ts">
import { useTangoStore } from '@/stores/tango'

const store = useTangoStore()

const handleKeyPress = (event: KeyboardEvent) => {
  if (store.isCompleted || store.isPaused) return

  const key = event.key.toLowerCase()

  if (key === 'backspace' || key === 'delete') {
    store.clearSelectedCell()
  }
}

// Ajouter l'écouteur d'événements clavier
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeyPress)
}
</script>

<template>
  <div class="tango-controls">
    <div class="instructions">
      <p class="instruction-text">
        <span class="symbol-demo">🌑</span> →
        <span class="symbol-demo sun">☀️</span> →
        <span class="symbol-demo empty">vide</span>
      </p>
      <p class="instruction-subtitle">Cliquez sur une case pour alterner entre les symboles</p>
    </div>

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
      >
        💡 Indice
      </button>
    </div>
  </div>
</template>

<style scoped>
.tango-controls {
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
  padding: 1.5rem;
  text-align: center;
}

.instruction-text {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.symbol-demo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.symbol-demo:first-child {
  color: #1e3a8a;
  font-size: 1.8em;
}

.symbol-demo.sun {
  font-size: 1.8em;
}

.symbol-demo.empty {
  font-size: 0.9em;
  opacity: 0.7;
  font-style: italic;
}

.instruction-subtitle {
  font-size: clamp(0.875rem, 2vw, 1rem);
  color: var(--text-secondary);
  margin: 0;
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
  .tango-controls {
    padding: 0.5rem;
  }

  .instructions {
    padding: 1rem;
  }

  .instruction-text {
    font-size: clamp(1.25rem, 3.5vw, 1.5rem);
    gap: 0.75rem;
  }

  .action-buttons {
    gap: 0.375rem;
  }

  .action-btn {
    padding: 0.75rem;
    font-size: clamp(0.875rem, 2.5vw, 1rem);
  }
}
</style>
