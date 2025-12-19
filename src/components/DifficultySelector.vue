<script setup lang="ts">
import { ref } from 'vue'
import { Difficulty, GridSize } from '@/types/sudoku'
import { useSudokuStore } from '@/stores/sudoku'

const store = useSudokuStore()
const selectedDifficulty = ref<Difficulty>(Difficulty.NORMAL)
const selectedGridSize = ref<GridSize>(GridSize.NINE)

const emit = defineEmits<{
  start: []
  showStats: []
}>()

const difficulties = [
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

const gridSizes = [
  { value: GridSize.SIX, label: '6x6', description: 'Grille 6x6 (2x3 régions)' },
  { value: GridSize.NINE, label: '9x9', description: 'Grille classique 9x9 (3x3 régions)' },
]

const startNewGame = () => {
  store.newGame(selectedDifficulty.value, selectedGridSize.value)
  emit('start')
}

const openStats = () => {
  emit('showStats')
}
</script>

<template>
  <div class="difficulty-selector">
    <img src="/icon.svg" alt="Sudoku" class="app-icon" />
    <h2>Nouvelle partie</h2>
    <p class="subtitle">Choisissez la taille de la grille et le niveau de difficulté</p>

    <div class="section">
      <h3 class="section-title">Taille de la grille</h3>
      <div class="grid-size-options">
        <label
          v-for="size in gridSizes"
          :key="size.value"
          class="grid-size-option"
          :class="{ selected: selectedGridSize === size.value }"
        >
          <input
            type="radio"
            :value="size.value"
            v-model="selectedGridSize"
            class="size-radio"
          />
          <div class="option-content">
            <h4 class="option-title">{{ size.label }}</h4>
            <p class="option-description">{{ size.description }}</p>
          </div>
        </label>
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">Difficulté</h3>
      <div class="difficulty-options">
        <label
          v-for="diff in difficulties"
          :key="diff.value"
          class="difficulty-option"
          :class="{ selected: selectedDifficulty === diff.value }"
        >
          <input
            type="radio"
            :value="diff.value"
            v-model="selectedDifficulty"
            class="difficulty-radio"
          />
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

.difficulty-radio,
.size-radio {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--primary);
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
