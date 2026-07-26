<script setup lang="ts">
import { computed } from 'vue'
import { useGame2048Store } from '@/stores/game2048'
import { Game2048GridSize } from '@/types/game2048'

const store = useGame2048Store()

const emit = defineEmits<{
  newGame: []
  goHome: []
}>()

const gridSizeLabel = computed(() => {
  switch (store.gridSize) {
    case Game2048GridSize.THREE:
      return '3×3'
    case Game2048GridSize.FOUR:
      return '4×4'
    case Game2048GridSize.FIVE:
      return '5×5'
    default:
      return '4×4'
  }
})

const progressPercent = computed(() => Math.round(store.progress))
</script>

<template>
  <div class="game2048-header">
    <div class="header-top">
      <h1 class="title">2048</h1>
      <div class="timer">⏱️ {{ store.formattedTime }}</div>
    </div>

    <div class="scores-row">
      <div class="score-box">
        <div class="score-label">Score</div>
        <div class="score-value">{{ store.score }}</div>
        <div v-if="store.lastMoveScore > 0" class="score-add">+{{ store.lastMoveScore }}</div>
      </div>
      <div class="score-box">
        <div class="score-label">Meilleur</div>
        <div class="score-value">{{ store.bestScore }}</div>
      </div>
    </div>

    <div class="header-info">
      <div class="info-item">
        <span class="label">Grille:</span>
        <span class="value">{{ gridSizeLabel }}</span>
      </div>
      <div class="info-item">
        <span class="label">Objectif:</span>
        <span class="value target">{{ store.targetTile }}</span>
      </div>
      <div class="info-item">
        <span class="label">Max:</span>
        <span class="value">{{ store.highestTile }}</span>
      </div>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
    </div>

    <div class="header-actions">
      <button
        v-if="!store.isPaused && store.isPlaying"
        class="header-btn"
        @click="store.pauseGame"
      >
        ⏸️ Pause
      </button>
      <button class="header-btn" @click="emit('newGame')">🔄 Nouvelle partie</button>
      <button class="header-btn" @click="emit('goHome')">🏠 Revenir à l'accueil</button>
    </div>

    <div v-if="store.isCompleted" class="completion-message">
      <h2>🎉 Félicitations !</h2>
      <p>Vous avez atteint {{ store.targetTile }} !</p>
      <p class="sub">Score: {{ store.score }} en {{ store.formattedTime }}</p>
      <button class="header-btn primary continue-btn" @click="store.continueGame">
        ▶️ Continuer à jouer
      </button>
    </div>

    <div v-if="store.isGameOver" class="game-over-message">
      <h2>😵 Game Over !</h2>
      <p>Plus de mouvements possibles</p>
      <p class="sub">Score final: {{ store.score }} | Max: {{ store.highestTile }}</p>
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
.game2048-header {
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
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  color: var(--primary);
  margin: 0;
}

.timer {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.scores-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.score-box {
  flex: 1;
  background-color: var(--primary);
  color: white;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  text-align: center;
  position: relative;
}

.score-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.9;
}

.score-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.score-add {
  position: absolute;
  top: 0.25rem;
  right: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  opacity: 0.8;
  animation: score-pop 0.6s ease-out;
}

@keyframes score-pop {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-1rem);
  }
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

.target {
  color: var(--primary);
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
  flex-wrap: wrap;
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

.completion-message .sub {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.continue-btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
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
  margin: 0.25rem 0;
  font-size: 1.125rem;
}

.game-over-message .sub {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
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
  .game2048-header {
    padding: 1rem;
  }

  .scores-row {
    gap: 0.75rem;
  }

  .score-value {
    font-size: 1.25rem;
  }

  .header-info {
    gap: 1rem;
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
