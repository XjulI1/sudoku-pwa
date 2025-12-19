<template>
  <div class="statistics">
    <div class="stats-header">
      <h2>Statistiques</h2>
      <button class="close-btn" @click="$emit('close')" aria-label="Fermer">✕</button>
    </div>

    <div class="stats-summary">
      <div class="summary-card">
        <div class="summary-value">{{ totalGamesPlayed }}</div>
        <div class="summary-label">Parties jouées</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">{{ bestScore.toFixed(1) }}/10</div>
        <div class="summary-label">Meilleure note</div>
      </div>
    </div>

    <div class="difficulty-tabs">
      <button
        v-for="diff in difficulties"
        :key="diff.value"
        :class="{ active: selectedDifficulty === diff.value }"
        @click="selectedDifficulty = diff.value"
      >
        {{ diff.label }}
      </button>
    </div>

    <div v-if="currentStats" class="difficulty-stats">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Parties jouées</div>
          <div class="stat-value">{{ currentStats.gamesPlayed }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Note moyenne</div>
          <div class="stat-value">{{ currentStats.averageScore.toFixed(1) }}/10</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Meilleure note</div>
          <div class="stat-value">{{ currentStats.bestScore.toFixed(1) }}/10</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Meilleur temps</div>
          <div class="stat-value">{{ formatTime(currentStats.bestTime) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Temps moyen</div>
          <div class="stat-value">{{ formatTime(currentStats.averageTime) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total erreurs</div>
          <div class="stat-value">{{ currentStats.totalErrors }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total indices</div>
          <div class="stat-value">{{ currentStats.totalHints }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Moyenne erreurs</div>
          <div class="stat-value">
            {{ (currentStats.totalErrors / currentStats.gamesPlayed).toFixed(1) }}
          </div>
        </div>
      </div>

      <div class="history-section">
        <h3>Historique des parties</h3>
        <div class="history-list">
          <div v-for="(game, index) in sortedHistory" :key="index" class="history-item">
            <div class="history-score" :class="getScoreClass(game.score)">
              {{ game.score.toFixed(1) }}/10
            </div>
            <div class="history-details">
              <div class="history-time">{{ formatTime(game.completionTime) }}</div>
              <div class="history-meta">
                <span>{{ game.errorsCount }} erreurs</span>
                <span>{{ game.hintsUsed }} indices</span>
                <span>{{ formatTime(game.pauseTime) }} pause</span>
              </div>
            </div>
            <div class="history-date">{{ formatDate(game.completedAt) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-stats">
      <p>Aucune partie jouée pour ce niveau</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Difficulty } from '@/types/sudoku'
import { StatsManager } from '@/utils/statsManager'

defineEmits<{
  close: []
}>()

const difficulties = [
  { value: Difficulty.SIMPLE, label: 'Simple' },
  { value: Difficulty.NORMAL, label: 'Normal' },
  { value: Difficulty.EXPERT, label: 'Expert' },
  { value: Difficulty.MAITRE, label: 'Maître' },
  { value: Difficulty.DIEUX_SUDOKU, label: 'Dieux' }
]

const selectedDifficulty = ref<Difficulty>(Difficulty.NORMAL)

const totalGamesPlayed = computed(() => StatsManager.getTotalGamesPlayed())
const bestScore = computed(() => StatsManager.getBestScore())

const currentStats = computed(() => {
  return StatsManager.loadDifficultyStats(selectedDifficulty.value)
})

const sortedHistory = computed(() => {
  if (!currentStats.value) return []
  return [...currentStats.value.history].sort((a, b) => b.completedAt - a.completedAt)
})

function formatTime(milliseconds: number): string {
  return StatsManager.formatTime(milliseconds)
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays}j`

  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function getScoreClass(score: number): string {
  if (score >= 9) return 'excellent'
  if (score >= 7) return 'good'
  if (score >= 5) return 'average'
  return 'poor'
}
</script>

<style scoped>
.statistics {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: 1000;
  overflow-y: auto;
  padding: 1rem;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.stats-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0.5rem;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--primary);
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: var(--cell-bg);
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.summary-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.summary-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.difficulty-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.difficulty-tabs button {
  padding: 0.75rem 1.25rem;
  background: var(--cell-bg);
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
}

.difficulty-tabs button:hover {
  background: var(--cell-hover);
}

.difficulty-tabs button.active {
  background: var(--primary);
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--cell-bg);
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: bold;
}

.history-section h3 {
  margin: 0 0 1rem;
  color: var(--text-primary);
  font-size: 1.2rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  background: var(--cell-bg);
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.history-score {
  font-size: 1.25rem;
  font-weight: bold;
  min-width: 70px;
  text-align: center;
  padding: 0.5rem;
  border-radius: 4px;
}

.history-score.excellent {
  background: #10b981;
  color: white;
}

.history-score.good {
  background: #3b82f6;
  color: white;
}

.history-score.average {
  background: #f59e0b;
  color: white;
}

.history-score.poor {
  background: #ef4444;
  color: white;
}

.history-details {
  flex: 1;
}

.history-time {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.history-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.history-date {
  color: var(--text-secondary);
  font-size: 0.85rem;
  white-space: nowrap;
}

.no-stats {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .history-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
