<script setup lang="ts">
import { ref, computed } from 'vue'
import { Difficulty, GridSize } from '@/types/sudoku'
import { TangoDifficulty } from '@/types/tango'
import { MinesweeperDifficulty } from '@/types/minesweeper'
import { StatsManager } from '@/utils/statsManager'
import { TangoStatsManager } from '@/utils/tangoStatsManager'
import { MinesweeperStatsManager } from '@/utils/minesweeperStatsManager'

defineOptions({
  name: 'GameStatistics'
})

defineEmits<{
  close: []
}>()

type GameType = 'sudoku' | 'tango' | 'minesweeper'

const selectedGameType = ref<GameType>('sudoku')

const sudokuDifficulties = [
  { value: Difficulty.SIMPLE, label: 'Simple' },
  { value: Difficulty.NORMAL, label: 'Normal' },
  { value: Difficulty.EXPERT, label: 'Expert' },
  { value: Difficulty.MAITRE, label: 'Maître' },
  { value: Difficulty.DIEUX_SUDOKU, label: 'Dieux' },
]

const tangoDifficulties = [
  { value: TangoDifficulty.EASY, label: 'Facile' },
  { value: TangoDifficulty.MEDIUM, label: 'Moyen' },
  { value: TangoDifficulty.HARD, label: 'Difficile' },
]

const minesweeperDifficulties = [
  { value: MinesweeperDifficulty.BEGINNER, label: 'Débutant' },
  { value: MinesweeperDifficulty.INTERMEDIATE, label: 'Intermédiaire' },
  { value: MinesweeperDifficulty.EXPERT, label: 'Expert' },
]

const gridSizes = [
  { value: GridSize.SIX, label: '6x6' },
  { value: GridSize.NINE, label: '9x9' },
]

const selectedDifficulty = ref<Difficulty>(Difficulty.NORMAL)
const selectedTangoDifficulty = ref<TangoDifficulty>(TangoDifficulty.MEDIUM)
const selectedMinesweeperDifficulty = ref<MinesweeperDifficulty>(MinesweeperDifficulty.BEGINNER)
const selectedGridSize = ref<GridSize>(GridSize.NINE)

const totalGamesPlayed = computed(() => {
  if (selectedGameType.value === 'sudoku') {
    return StatsManager.getTotalGamesPlayed()
  } else if (selectedGameType.value === 'tango') {
    return TangoStatsManager.getTotalGamesPlayed()
  } else {
    return MinesweeperStatsManager.getTotalGamesPlayed()
  }
})

const bestScore = computed(() => {
  if (selectedGameType.value === 'sudoku') {
    return StatsManager.getBestScore()
  } else if (selectedGameType.value === 'tango') {
    return TangoStatsManager.getBestScore()
  } else {
    return MinesweeperStatsManager.getBestScore()
  }
})

const currentStats = computed(() => {
  if (selectedGameType.value === 'sudoku') {
    return StatsManager.loadDifficultyStats(selectedDifficulty.value, selectedGridSize.value)
  } else if (selectedGameType.value === 'tango') {
    return TangoStatsManager.loadDifficultyStats(selectedTangoDifficulty.value)
  } else {
    return MinesweeperStatsManager.loadDifficultyStats(selectedMinesweeperDifficulty.value)
  }
})

const sortedHistory = computed(() => {
  if (!currentStats.value) return []
  return [...currentStats.value.history].sort((a, b) => b.completedAt - a.completedAt)
})

const difficulties = computed(() => {
  if (selectedGameType.value === 'sudoku') {
    return sudokuDifficulties
  } else if (selectedGameType.value === 'tango') {
    return tangoDifficulties
  } else {
    return minesweeperDifficulties
  }
})

const currentDifficulty = computed({
  get: () => {
    if (selectedGameType.value === 'sudoku') {
      return selectedDifficulty.value
    } else if (selectedGameType.value === 'tango') {
      return selectedTangoDifficulty.value
    } else {
      return selectedMinesweeperDifficulty.value
    }
  },
  set: (value: Difficulty | TangoDifficulty | MinesweeperDifficulty) => {
    if (selectedGameType.value === 'sudoku') {
      selectedDifficulty.value = value as Difficulty
    } else if (selectedGameType.value === 'tango') {
      selectedTangoDifficulty.value = value as TangoDifficulty
    } else {
      selectedMinesweeperDifficulty.value = value as MinesweeperDifficulty
    }
  }
})

// Compte le nombre de parties pour une taille de grille donnée (Sudoku uniquement)
const getGridSizeCount = (gridSize: GridSize): number => {
  let total = 0
  sudokuDifficulties.forEach((diff) => {
    const stats = StatsManager.loadDifficultyStats(diff.value, gridSize)
    if (stats) {
      total += stats.gamesPlayed
    }
  })
  return total
}

// Compte le nombre de parties pour une difficulté et taille données
const getDifficultyCount = (difficulty: Difficulty | TangoDifficulty | MinesweeperDifficulty): number => {
  if (selectedGameType.value === 'sudoku') {
    const stats = StatsManager.loadDifficultyStats(difficulty as Difficulty, selectedGridSize.value)
    return stats?.gamesPlayed || 0
  } else if (selectedGameType.value === 'tango') {
    const stats = TangoStatsManager.loadDifficultyStats(difficulty as TangoDifficulty)
    return stats?.gamesPlayed || 0
  } else {
    const stats = MinesweeperStatsManager.loadDifficultyStats(difficulty as MinesweeperDifficulty)
    return stats?.gamesPlayed || 0
  }
}

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

    <div class="filter-section">
      <div class="game-type-tabs">
        <button
          :class="{ active: selectedGameType === 'sudoku' }"
          @click="selectedGameType = 'sudoku'"
        >
          🔢 Sudoku
          <span class="count">({{ selectedGameType === 'sudoku' ? totalGamesPlayed : StatsManager.getTotalGamesPlayed() }})</span>
        </button>
        <button
          :class="{ active: selectedGameType === 'tango' }"
          @click="selectedGameType = 'tango'"
        >
          ☀️🌑 Tango
          <span class="count">({{ selectedGameType === 'tango' ? totalGamesPlayed : TangoStatsManager.getTotalGamesPlayed() }})</span>
        </button>
        <button
          :class="{ active: selectedGameType === 'minesweeper' }"
          @click="selectedGameType = 'minesweeper'"
        >
          💣 Démineur
          <span class="count">({{ selectedGameType === 'minesweeper' ? totalGamesPlayed : MinesweeperStatsManager.getTotalGamesPlayed() }})</span>
        </button>
      </div>

      <div v-if="selectedGameType === 'sudoku'" class="grid-size-tabs">
        <button
          v-for="size in gridSizes"
          :key="size.value"
          :class="{ active: selectedGridSize === size.value }"
          @click="selectedGridSize = size.value"
        >
          {{ size.label }}
          <span class="count">({{ getGridSizeCount(size.value) }})</span>
        </button>
      </div>

      <div class="difficulty-tabs">
        <button
          v-for="diff in difficulties"
          :key="diff.value"
          :class="{ active: currentDifficulty === diff.value }"
          @click="currentDifficulty = diff.value"
        >
          {{ diff.label }}
          <span class="count">({{ getDifficultyCount(diff.value) }})</span>
        </button>
      </div>
    </div>

    <div v-if="currentStats" class="difficulty-stats">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Parties jouées</div>
          <div class="stat-value">{{ currentStats.gamesPlayed }}</div>
        </div>
        <div v-if="'gamesWon' in currentStats" class="stat-card">
          <div class="stat-label">Parties gagnées</div>
          <div class="stat-value">{{ currentStats.gamesWon }}</div>
        </div>
        <div v-if="'winRate' in currentStats" class="stat-card">
          <div class="stat-label">Taux de victoire</div>
          <div class="stat-value">{{ (currentStats.winRate * 100).toFixed(0) }}%</div>
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
        <div v-if="'totalErrors' in currentStats" class="stat-card">
          <div class="stat-label">Total erreurs</div>
          <div class="stat-value">{{ currentStats.totalErrors }}</div>
        </div>
        <div v-if="'totalHints' in currentStats" class="stat-card">
          <div class="stat-label">Total indices</div>
          <div class="stat-value">{{ currentStats.totalHints }}</div>
        </div>
        <div v-if="'totalErrors' in currentStats" class="stat-card">
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
                <span v-if="'won' in game">{{ game.won ? 'Gagné' : 'Perdu' }}</span>
                <span v-if="'errorsCount' in game">{{ game.errorsCount }} erreurs</span>
                <span v-if="'hintsUsed' in game">{{ game.hintsUsed }} indices</span>
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

.filter-section {
  margin-bottom: 1.5rem;
}

.game-type-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.game-type-tabs button {
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: var(--cell-bg);
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.game-type-tabs button:hover {
  background: var(--cell-hover);
}

.game-type-tabs button.active {
  background: var(--primary);
  color: white;
}

.grid-size-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.grid-size-tabs button {
  padding: 0.75rem 1.5rem;
  background: var(--cell-bg);
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.grid-size-tabs button:hover {
  background: var(--cell-hover);
}

.grid-size-tabs button.active {
  background: var(--primary);
  color: white;
}

.difficulty-tabs {
  display: flex;
  gap: 0.5rem;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.difficulty-tabs button:hover {
  background: var(--cell-hover);
}

.difficulty-tabs button.active {
  background: var(--primary);
  color: white;
}

.count {
  opacity: 0.7;
  font-size: 0.85em;
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
