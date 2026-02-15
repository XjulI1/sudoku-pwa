<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Difficulty, GridSize } from '@/types/sudoku'
import { TangoDifficulty } from '@/types/tango'
import { MinesweeperDifficulty } from '@/types/minesweeper'
import { Game2048GridSize } from '@/types/game2048'
import { useSudokuStore } from '@/stores/sudoku'
import { useTangoStore } from '@/stores/tango'
import { useMinesweeperStore } from '@/stores/minesweeper'
import { useGame2048Store } from '@/stores/game2048'

const sudokuStore = useSudokuStore()
const tangoStore = useTangoStore()
const minesweeperStore = useMinesweeperStore()
const game2048Store = useGame2048Store()

type GameType = 'sudoku' | 'tango' | 'minesweeper' | 'game2048'

const props = withDefaults(defineProps<{
  initialGameType?: GameType
}>(), {
  initialGameType: 'sudoku'
})

const selectedGameType = ref<GameType>(props.initialGameType)

watch(() => props.initialGameType, (val) => {
  selectedGameType.value = val
})
const selectedSudokuDifficulty = ref<Difficulty>(Difficulty.NORMAL)
const selectedTangoDifficulty = ref<TangoDifficulty>(TangoDifficulty.MEDIUM)
const selectedMinesweeperDifficulty = ref<MinesweeperDifficulty>(MinesweeperDifficulty.BEGINNER)
const selected2048GridSize = ref<Game2048GridSize>(Game2048GridSize.FOUR)
const selectedGridSize = ref<GridSize>(GridSize.NINE)

const emit = defineEmits<{
  start: [gameType: GameType]
  showStats: []
}>()

const gameTypes = [
  { value: 'sudoku' as GameType, label: 'Sudoku', icon: '🔢', description: 'Jeu de logique classique' },
  { value: 'tango' as GameType, label: 'Tango', icon: '☀️🌑', description: 'Puzzle de symboles' },
  { value: 'minesweeper' as GameType, label: 'Démineur', icon: '💣', description: 'Trouvez les mines cachées' },
  { value: 'game2048' as GameType, label: '2048', icon: '🎯', description: 'Fusionnez les tuiles' },
]

const sudokuDifficulties = [
  { value: Difficulty.SIMPLE, label: 'Simple', description: 'Parfait pour débuter' },
  { value: Difficulty.NORMAL, label: 'Normal', description: 'Difficulté moyenne' },
  { value: Difficulty.EXPERT, label: 'Expert', description: 'Pour les joueurs expérimentés' },
  { value: Difficulty.MAITRE, label: 'Maître', description: 'Défi ultime' },
  {
    value: Difficulty.DIEUX_SUDOKU,
    label: 'Dieux du Sudoku',
    description: 'Pour les dieux du Sudoku uniquement',
  },
]

const tangoDifficulties = [
  { value: TangoDifficulty.EASY, label: 'Facile', description: 'Parfait pour découvrir Tango' },
  { value: TangoDifficulty.MEDIUM, label: 'Moyen', description: 'Un bon défi' },
  { value: TangoDifficulty.HARD, label: 'Difficile', description: 'Pour les experts' },
]

const minesweeperDifficulties = [
  { value: MinesweeperDifficulty.BEGINNER, label: 'Débutant', description: 'Grille 9x9, 10 mines' },
  { value: MinesweeperDifficulty.INTERMEDIATE, label: 'Intermédiaire', description: 'Grille 16x16, 40 mines' },
  { value: MinesweeperDifficulty.EXPERT, label: 'Expert', description: '99 mines, grille adaptative' },
]

const game2048GridSizes = [
  { value: Game2048GridSize.THREE, label: '3×3', description: 'Mini - Objectif 512' },
  { value: Game2048GridSize.FOUR, label: '4×4', description: 'Classique - Objectif 2048' },
  { value: Game2048GridSize.FIVE, label: '5×5', description: 'Grand - Objectif 4096' },
]

const gridSizes = [
  { value: GridSize.SIX, label: '6x6', description: 'Grille 6x6 (2x3 régions)' },
  { value: GridSize.NINE, label: '9x9', description: 'Grille classique 9x9 (3x3 régions)' },
]

const currentDifficulties = computed(() => {
  if (selectedGameType.value === 'sudoku') return sudokuDifficulties
  if (selectedGameType.value === 'tango') return tangoDifficulties
  if (selectedGameType.value === 'minesweeper') return minesweeperDifficulties
  return game2048GridSizes
})

const selectedDifficulty = computed({
  get: () => {
    if (selectedGameType.value === 'sudoku') return selectedSudokuDifficulty.value
    if (selectedGameType.value === 'tango') return selectedTangoDifficulty.value
    if (selectedGameType.value === 'minesweeper') return selectedMinesweeperDifficulty.value
    return selected2048GridSize.value
  },
  set: (value: Difficulty | TangoDifficulty | MinesweeperDifficulty | Game2048GridSize) => {
    if (selectedGameType.value === 'sudoku') {
      selectedSudokuDifficulty.value = value as Difficulty
    } else if (selectedGameType.value === 'tango') {
      selectedTangoDifficulty.value = value as TangoDifficulty
    } else if (selectedGameType.value === 'minesweeper') {
      selectedMinesweeperDifficulty.value = value as MinesweeperDifficulty
    } else {
      selected2048GridSize.value = value as Game2048GridSize
    }
  }
})

const isDifficultySelected = (diffValue: Difficulty | TangoDifficulty | MinesweeperDifficulty | Game2048GridSize) => {
  if (selectedGameType.value === 'sudoku') {
    return selectedSudokuDifficulty.value === diffValue
  } else if (selectedGameType.value === 'tango') {
    return selectedTangoDifficulty.value === diffValue
  } else if (selectedGameType.value === 'minesweeper') {
    return selectedMinesweeperDifficulty.value === diffValue
  } else {
    return selected2048GridSize.value === diffValue
  }
}

const startNewGame = () => {
  if (selectedGameType.value === 'sudoku') {
    sudokuStore.newGame(selectedSudokuDifficulty.value, selectedGridSize.value)
  } else if (selectedGameType.value === 'tango') {
    tangoStore.newGame(selectedTangoDifficulty.value)
  } else if (selectedGameType.value === 'minesweeper') {
    minesweeperStore.newGame(selectedMinesweeperDifficulty.value)
  } else {
    game2048Store.newGame(selected2048GridSize.value)
  }
  emit('start', selectedGameType.value)
}

const openStats = () => {
  emit('showStats')
}
</script>

<template>
  <div class="difficulty-selector">
    <img src="/icon.svg" alt="Puzzle Games" class="app-icon" />
    <h2>Nouvelle partie</h2>
    <p class="subtitle">Choisissez votre jeu et configurez la partie</p>

    <!-- Sélection du type de jeu -->
    <div class="section">
      <h3 class="section-title">Type de jeu</h3>
      <div class="game-type-options">
        <label
          v-for="game in gameTypes"
          :key="game.value"
          class="game-type-option"
          :class="{ selected: selectedGameType === game.value }"
          @click="selectedGameType = game.value"
        >
          <div class="option-content">
            <div class="game-header">
              <span class="game-icon">{{ game.icon }}</span>
              <h4 class="option-title">{{ game.label }}</h4>
            </div>
            <p class="option-description">{{ game.description }}</p>
          </div>
        </label>
      </div>
    </div>

    <!-- Taille de grille (seulement pour Sudoku) -->
    <div v-if="selectedGameType === 'sudoku'" class="section">
      <h3 class="section-title">Taille de la grille</h3>
      <div class="grid-size-options">
        <label
          v-for="size in gridSizes"
          :key="size.value"
          class="grid-size-option"
          :class="{ selected: selectedGridSize === size.value }"
          @click="selectedGridSize = size.value"
        >
          <div class="option-content">
            <h4 class="option-title">{{ size.label }}</h4>
            <p class="option-description">{{ size.description }}</p>
          </div>
        </label>
      </div>
    </div>

    <!-- Difficulté / Taille de grille pour 2048 -->
    <div class="section">
      <h3 class="section-title">{{ selectedGameType === 'game2048' ? 'Taille de la grille' : 'Difficulté' }}</h3>
      <div class="difficulty-options">
        <label
          v-for="diff in currentDifficulties"
          :key="diff.value"
          class="difficulty-option"
          :class="{ selected: isDifficultySelected(diff.value) }"
          @click="selectedDifficulty = diff.value"
        >
          <div class="option-content">
            <h4 class="option-title">{{ diff.label }}</h4>
            <p class="option-description">{{ diff.description }}</p>
          </div>
        </label>
      </div>
    </div>

    <button class="start-btn" @click="startNewGame">Commencer</button>
    <button class="stats-btn" @click="openStats">📊 Voir les statistiques</button>
  </div>
</template>

<style scoped>
.difficulty-selector {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
}

.app-icon {
  width: 100px;
  height: 100px;
  display: block;
  margin: 0 auto 1.5rem auto;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

h2 {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin: 0 0 0.5rem 0;
  color: var(--primary);
}

.subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin: 0 0 2rem 0;
}

.section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--text);
}

.game-type-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.game-type-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 2px solid var(--border-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--card-bg);
  min-width: 0;
}

.game-type-option:hover {
  border-color: var(--primary);
  background-color: var(--card-hover);
  transform: translateY(-2px);
}

.game-type-option.selected {
  border-color: var(--primary);
  background-color: var(--primary-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.game-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.game-icon {
  font-size: 1.5rem;
}

.grid-size-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.grid-size-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid var(--border-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--card-bg);
}

.grid-size-option:hover {
  border-color: var(--primary);
  background-color: var(--card-hover);
}

.grid-size-option.selected {
  border-color: var(--primary);
  background-color: var(--primary-light);
}

.difficulty-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.difficulty-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border: 2px solid var(--border-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--card-bg);
}

.difficulty-option:hover {
  border-color: var(--primary);
  background-color: var(--card-hover);
}

.difficulty-option.selected {
  border-color: var(--primary);
  background-color: var(--primary-light);
}

.option-content {
  flex: 1;
}

.option-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--text);
}

.option-description {
  font-size: 0.875rem;
  margin: 0;
  color: var(--text-secondary);
}

.start-btn {
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  border: none;
  background-color: var(--primary);
  color: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.start-btn:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.start-btn:active {
  transform: translateY(0);
}

.stats-btn {
  width: 100%;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 500;
  border: 2px solid var(--border-light);
  background-color: var(--btn-bg);
  color: var(--text);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.75rem;
}

.stats-btn:hover {
  background-color: var(--btn-hover);
  border-color: var(--primary);
}

@media (max-width: 640px) {
  .difficulty-selector {
    padding: 1rem;
    margin: 1rem auto;
  }

  h2 {
    font-size: 1.5rem;
  }

  .game-type-options {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .game-type-option {
    flex-direction: column;
    text-align: center;
    padding: 0.75rem 0.5rem;
    gap: 0.25rem;
  }

  .game-header {
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0;
  }

  .game-icon {
    font-size: 1.75rem;
  }

  .game-type-option .option-title {
    font-size: 0.85rem;
  }

  .game-type-option .option-description {
    display: none;
  }

  .grid-size-options {
    grid-template-columns: 1fr;
  }

  .grid-size-option,
  .difficulty-option {
    padding: 1rem;
  }

  .option-title {
    font-size: 1rem;
  }

  .option-description {
    font-size: 0.8rem;
  }
}
</style>
