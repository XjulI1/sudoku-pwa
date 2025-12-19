<script setup lang="ts">
import { ref } from 'vue'
import { Difficulty } from '@/types/sudoku'
import { useSudokuStore } from '@/stores/sudoku'

const store = useSudokuStore()
const selectedDifficulty = ref<Difficulty>(Difficulty.NORMAL)

const emit = defineEmits<{
  start: []
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

const startNewGame = () => {
  store.newGame(selectedDifficulty.value)
  emit('start')
}
</script>

<template>
  <div class="difficulty-selector">
    <img src="/icon.svg" alt="Sudoku" class="app-icon" />
    <h2>Nouvelle partie</h2>
    <p class="subtitle">Choisissez votre niveau de difficulté</p>

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
          <h3 class="option-title">{{ diff.label }}</h3>
          <p class="option-description">{{ diff.description }}</p>
        </div>
      </label>
    </div>

    <button class="start-btn" @click="startNewGame">Commencer</button>
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

.difficulty-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
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

.difficulty-radio {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--primary);
}

.option-content {
  flex: 1;
}

.option-title {
  font-size: 1.25rem;
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

@media (max-width: 640px) {
  .difficulty-selector {
    padding: 1rem;
    margin: 1rem auto;
  }

  h2 {
    font-size: 1.5rem;
  }

  .difficulty-option {
    padding: 1rem;
  }

  .option-title {
    font-size: 1.125rem;
  }
}
</style>
