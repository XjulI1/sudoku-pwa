<script setup lang="ts">
import { useDedaleStore } from '@/stores/dedale'
import { DedaleDirection } from '@/types/dedale'

const store = useDedaleStore()

const handleKeyPress = (event: KeyboardEvent) => {
  if (store.isCompleted || store.isPaused) return

  switch (event.key) {
    case 'Backspace':
    case 'Delete':
      store.clearActivePath()
      break
    case 'Escape':
      store.deselectActivePair()
      break
    case 'ArrowUp':
      store.moveActiveFrontier(DedaleDirection.UP)
      break
    case 'ArrowDown':
      store.moveActiveFrontier(DedaleDirection.DOWN)
      break
    case 'ArrowLeft':
      store.moveActiveFrontier(DedaleDirection.LEFT)
      break
    case 'ArrowRight':
      store.moveActiveFrontier(DedaleDirection.RIGHT)
      break
  }
}

// Ajouter l'écouteur d'événements clavier
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeyPress)
}
</script>

<template>
  <div class="dedale-controls">
    <div class="instructions">
      <p class="instruction-text">Reliez chaque paire de lettres identiques</p>
      <p class="instruction-subtitle">
        Glissez ou cliquez case par case depuis une lettre. Toutes les cases doivent être traversées.
      </p>
    </div>

    <div class="action-buttons">
      <button
        class="action-btn"
        @click="store.clearActivePath"
        :disabled="store.isCompleted || store.isPaused || store.activePairIndex === null"
        title="Effacer le tracé actif (Backspace ou Delete)"
      >
        ❌ Effacer
      </button>
      <button
        class="action-btn hint-btn"
        @click="store.getHint"
        :disabled="store.isCompleted || store.isPaused"
        title="Révéler une paire aléatoire"
      >
        💡 Indice
      </button>
    </div>
  </div>
</template>

<style scoped>
.dedale-controls {
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
  font-size: clamp(1.1rem, 3vw, 1.4rem);
  font-weight: 600;
  margin: 0 0 0.5rem 0;
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
  .dedale-controls {
    padding: 0.5rem;
  }

  .instructions {
    padding: 1rem;
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
