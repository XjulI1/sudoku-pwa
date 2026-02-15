<script setup lang="ts">
import { usePicrossStore } from '@/stores/picross'

const store = usePicrossStore()

const handleKeyPress = (event: KeyboardEvent) => {
  if (store.isCompleted || store.isPaused) return

  const key = event.key.toLowerCase()

  if (key === 'backspace' || key === 'delete') {
    store.clearSelectedCell()
  } else if (key === 'x' || key === 'n') {
    store.toggleInputMode()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeyPress)
}
</script>

<template>
  <div class="picross-controls">
    <div class="mode-selector">
      <button
        class="mode-btn"
        :class="{ active: store.inputMode === 'fill' }"
        @click="store.inputMode === 'fill' ? undefined : store.toggleInputMode()"
        :disabled="store.isCompleted || store.isPaused"
      >
        <span class="mode-icon filled-icon"></span>
        Remplir
      </button>
      <button
        class="mode-btn"
        :class="{ active: store.inputMode === 'cross' }"
        @click="store.inputMode === 'cross' ? undefined : store.toggleInputMode()"
        :disabled="store.isCompleted || store.isPaused"
      >
        <span class="mode-icon cross-icon">X</span>
        Marquer vide
      </button>
    </div>

    <div class="action-buttons">
      <button
        class="action-btn"
        @click="store.clearSelectedCell"
        :disabled="store.isCompleted || store.isPaused"
        title="Effacer (Backspace ou Delete)"
      >
        Effacer
      </button>
      <button
        class="action-btn hint-btn"
        @click="store.getHint"
        :disabled="store.isCompleted || store.isPaused"
        title="Reveler une cellule aleatoire"
      >
        Indice
      </button>
    </div>

    <p class="instruction-subtitle">
      Cliquez sur les cellules pour les remplir ou les marquer. Touche X pour changer de mode.
    </p>
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

.mode-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  font-size: clamp(1rem, 3vw, 1.25rem);
  font-weight: 600;
  border: 2px solid var(--border-light);
  background-color: var(--btn-bg);
  color: var(--text);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn:hover:not(:disabled) {
  background-color: var(--btn-hover);
}

.mode-btn.active {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

.mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-icon {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 2px;
}

.filled-icon {
  background-color: currentColor;
}

.cross-icon {
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.25rem;
  width: auto;
  height: auto;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.instruction-subtitle {
  font-size: clamp(0.875rem, 2vw, 1rem);
  color: var(--text-secondary);
  margin: 0;
  text-align: center;
}

@media (max-width: 640px) {
  .picross-controls {
    padding: 0.5rem;
  }

  .mode-btn {
    padding: 0.75rem;
    font-size: clamp(0.875rem, 2.5vw, 1rem);
  }

  .action-btn {
    padding: 0.75rem;
    font-size: clamp(0.875rem, 2.5vw, 1rem);
  }
}
</style>
