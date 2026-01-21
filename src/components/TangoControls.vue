<script setup lang="ts">
import { useTangoStore } from '@/stores/tango'
import { TangoSymbol } from '@/types/tango'

const store = useTangoStore()

const handleKeyPress = (event: KeyboardEvent) => {
  if (store.isCompleted || store.isPaused) return

  const key = event.key.toLowerCase()

  if (key === 's') {
    // S pour Soleil/Sun
    store.handleSymbolInput(TangoSymbol.SUN)
  } else if (key === 'm' || key === 'l') {
    // M pour Moon ou L pour Lune
    store.handleSymbolInput(TangoSymbol.MOON)
  } else if (key === 'backspace' || key === 'delete') {
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
    <div class="symbol-buttons">
      <button
        class="symbol-btn sun-btn"
        :class="{ disabled: store.isCompleted || store.isPaused }"
        @click="store.handleSymbolInput(TangoSymbol.SUN)"
        :disabled="store.isCompleted || store.isPaused"
        title="Soleil (touche S)"
      >
        ☀️ Soleil
      </button>
      <button
        class="symbol-btn moon-btn"
        :class="{ disabled: store.isCompleted || store.isPaused }"
        @click="store.handleSymbolInput(TangoSymbol.MOON)"
        :disabled="store.isCompleted || store.isPaused"
        title="Lune (touche M ou L)"
      >
        🌙 Lune
      </button>
    </div>

    <div class="action-buttons">
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
.tango-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-width: 500px;
  margin: 0 auto;
}

.symbol-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.symbol-btn {
  padding: 1.5rem;
  font-size: clamp(1.5rem, 5vw, 2rem);
  font-weight: 600;
  border: 3px solid var(--border-light);
  background-color: var(--btn-bg);
  color: var(--text);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  touch-action: manipulation;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.symbol-btn:hover:not(:disabled) {
  background-color: var(--btn-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.symbol-btn:active:not(:disabled) {
  transform: translateY(0);
}

.symbol-btn.disabled,
.symbol-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sun-btn:hover:not(:disabled) {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.moon-btn:hover:not(:disabled) {
  border-color: #6366f1;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
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

  .symbol-buttons {
    gap: 0.5rem;
  }

  .symbol-btn {
    padding: 1rem;
    font-size: clamp(1.25rem, 4vw, 1.5rem);
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
