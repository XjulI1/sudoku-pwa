<script setup lang="ts">
import { computed } from 'vue'
import { useMinesweeperStore } from '@/stores/minesweeper'
import { MinesweeperDifficulty } from '@/types/minesweeper'

const store = useMinesweeperStore()

const emit = defineEmits<{
  newGame: []
}>()

const difficultyLabel = computed(() => {
  switch (store.difficulty) {
    case MinesweeperDifficulty.BEGINNER:
      return 'Débutant'
    case MinesweeperDifficulty.INTERMEDIATE:
      return 'Intermédiaire'
    case MinesweeperDifficulty.EXPERT:
      return 'Expert'
    default:
      return 'Débutant'
  }
})

const progressPercent = computed(() => Math.round(store.progress))
</script>

<template>
  <div class="minesweeper-header">
    <div class="header-top">
      <h1 class="title">Démineur</h1>
      <div class="timer">⏱️ {{ store.formattedTime }}</div>
    </div>

    <div class="header-info">
      <div class="info-item">
        <span class="label">Difficulté:</span>
        <span class="value">{{ difficultyLabel }}</span>
      </div>
      <div class="info-item">
        <span class="label">Mines:</span>
        <span class="value mines-count">{{ store.remainingMines }}</span>
      </div>
      <div class="info-item">
        <span class="label">Progression:</span>
        <span class="value">{{ progressPercent }}%</span>
      </div>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
    </div>

    <div class="header-actions">
      <button
        v-if="!store.isPaused && !store.isCompleted && !store.isGameOver"
        class="header-btn"
        @click="store.pauseGame"
      >
        ⏸️ Pause
      </button>
      <button class="header-btn" @click="emit('newGame')">🔄 Nouvelle partie</button>
    </div>

    <div v-if="store.isCompleted" class="completion-message">
      <h2>🎉 Félicitations !</h2>
      <p>Vous avez déminé le terrain en {{ store.formattedTime }}</p>
    </div>

    <div v-if="store.isGameOver" class="game-over-message">
      <h2>💥 Boom !</h2>
      <p>Vous avez touché une mine !</p>
      <button class="header-btn primary retry-btn" @click="emit('newGame')">
        🔄 Réessayer
      </button>
    </div>

    <div v-if="store.isPaused" class="pause-overlay">
      <h2>⏸️ Jeu en pause</h2>
      <p>Cliquez sur "Reprendre" pour continuer</p>
      <button class="header-btn primary resume-btn" @click="store.resumeGame">
        ▶️ Reprendre
      </button>
    </div>
  </div>
</template>

<style scoped>
.minesweeper-header {
  padding: 1.5rem;
  background-color: var(--header-bg);
  border-bottom: 2px solid var(--border-light);
  position: relative;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.title {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 700;
  color: var(--primary);
  margin: 0;
}

.timer {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.header-info {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.mines-count {
  color: var(--error-text);
}

.progress-bar {
  height: 6px;
  background-color: var(--progress-bg);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary);
  transition: width 0.3s ease;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.header-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 2px solid var(--border-light);
  background-color: var(--btn-bg);
  color: var(--text);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-btn:hover {
  background-color: var(--btn-hover);
}

.header-btn.primary {
  background-color: var(--primary);
  border-color: var(--primary);
  color: white;
}

.header-btn.primary:hover {
  background-color: var(--primary-dark);
}

.completion-message {
  background-color: var(--success-bg);
  border: 2px solid var(--success);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  margin-top: 1rem;
}

.completion-message h2 {
  margin: 0 0 0.5rem 0;
  color: var(--success);
}

.completion-message p {
  margin: 0.25rem 0;
  font-size: 1.125rem;
}

.game-over-message {
  background-color: var(--cell-error);
  border: 2px solid var(--error-text);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  margin-top: 1rem;
}

.game-over-message h2 {
  margin: 0 0 0.5rem 0;
  color: var(--error-text);
}

.game-over-message p {
  margin: 0.25rem 0 1rem 0;
  font-size: 1.125rem;
}

.retry-btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
}

.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--overlay-bg);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.pause-overlay h2 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  padding: 0 1rem;
  text-align: center;
}

.pause-overlay p {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  color: var(--text-secondary);
  padding: 0 1rem;
  text-align: center;
}

.resume-btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
}

@media (max-width: 640px) {
  .minesweeper-header {
    padding: 1rem;
  }

  .header-info {
    gap: 1rem;
  }

  .info-item {
    font-size: 0.875rem;
  }

  .pause-overlay h2 {
    font-size: 1.5rem;
  }

  .pause-overlay p {
    font-size: 1rem;
    margin: 0 0 1rem 0;
  }

  .resume-btn {
    padding: 0.625rem 1.5rem;
    font-size: 0.875rem;
  }
}
</style>
