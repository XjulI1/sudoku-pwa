<script setup lang="ts">
import { computed } from 'vue'
import { useTectonicStore } from '@/stores/tectonic'

const store = useTectonicStore()

const numbers = computed(() => {
  return Array.from({ length: store.maxRegionSize }, (_, i) => i + 1)
})

const handleKeyPress = (event: KeyboardEvent) => {
  if (store.isCompleted || store.isPaused) return

  const key = event.key
  if (key >= '1' && key <= String(store.maxRegionSize)) {
    store.handleNumberInput(parseInt(key))
  } else if (key === 'Backspace' || key === 'Delete') {
    store.clearSelectedCell()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeyPress)
}
</script>

<template>
  <div class="tectonic-controls">
    <div class="number-pad">
      <button
        v-for="num in numbers"
        :key="num"
        class="number-btn"
        :disabled="store.isCompleted || store.isPaused"
        @click="store.handleNumberInput(num)"
      >
        {{ num }}
      </button>
    </div>

    <div class="action-buttons">
      <button
        class="action-btn"
        :disabled="store.isCompleted || store.isPaused"
        title="Effacer (Backspace ou Delete)"
        @click="store.clearSelectedCell"
      >
        ❌ Effacer
      </button>
      <button
        class="action-btn hint-btn"
        :disabled="store.isCompleted || store.isPaused"
        title="Révéler une cellule aléatoire"
        @click="store.getHint"
      >
        💡 Indice
      </button>
    </div>
  </div>
</template>

<style scoped>
.tectonic-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.number-pad {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.number-btn {
  flex: 0 1 64px;
  aspect-ratio: 1;
  min-height: 48px;
  font-size: clamp(1.25rem, 4vw, 1.75rem);
  font-weight: 600;
  border: 2px solid var(--border-light);
  background-color: var(--btn-bg);
  color: var(--text);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  touch-action: manipulation;
}

.number-btn:hover:not(:disabled) {
  background-color: var(--btn-hover);
  transform: scale(1.05);
}

.number-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.number-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

.hint-btn:hover:not(:disabled) {
  background-color: var(--warning);
  border-color: var(--warning);
  color: white;
}

@media (max-width: 640px) {
  .tectonic-controls {
    padding: 0.5rem;
  }

  .number-btn {
    min-height: 52px;
  }

  .action-buttons {
    gap: 0.375rem;
  }

  .action-btn {
    padding: 0.5rem;
    font-size: 0.75rem;
  }
}
</style>
