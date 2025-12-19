<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useSudokuStore } from '@/stores/sudoku'
import DifficultySelector from '@/components/DifficultySelector.vue'
import GameHeader from '@/components/GameHeader.vue'
import SudokuGrid from '@/components/SudokuGrid.vue'
import GameControls from '@/components/GameControls.vue'
import Statistics from '@/components/Statistics.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

const store = useSudokuStore()
const showMenu = ref(false)
const showStats = ref(false)
const showConfirmNewGame = ref(false)

const hasActiveGame = computed(() => store.grid.length > 0)

onMounted(() => {
  // Essayer de charger une partie sauvegardée
  const loaded = store.loadGame()
  if (!loaded) {
    showMenu.value = true
  }
})

const startNewGameFromMenu = () => {
  if (hasActiveGame.value) {
    showConfirmNewGame.value = true
  } else {
    confirmNewGame()
  }
}

const confirmNewGame = () => {
  store.resetGame()
  showMenu.value = true
}

const openStats = () => {
  showStats.value = true
}

const closeStats = () => {
  showStats.value = false
}
</script>

<template>
  <div class="app">
    <div v-if="showMenu || !hasActiveGame" class="menu-view">
      <DifficultySelector @start="showMenu = false" @show-stats="openStats" />
    </div>

    <div v-else class="game-view">
      <GameHeader @new-game="startNewGameFromMenu" />
      <SudokuGrid />
      <GameControls />
    </div>

    <Statistics v-if="showStats" @close="closeStats" />

    <ConfirmModal
      v-model="showConfirmNewGame"
      title="Nouvelle partie"
      message="Voulez-vous vraiment commencer une nouvelle partie ? La partie en cours sera perdue."
      confirm-text="Nouvelle partie"
      cancel-text="Annuler"
      @confirm="confirmNewGame"
    />
  </div>
</template>

<style>
:root {
  /* Couleurs principales */
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --primary-light: #dbeafe;

  /* Texte */
  --text: #1f2937;
  --text-secondary: #6b7280;

  /* Bordures */
  --border-light: #e5e7eb;
  --border-thick: #1f2937;

  /* Backgrounds */
  --bg: #f9fafb;
  --bg-primary: #f9fafb;
  --header-bg: #ffffff;
  --card-bg: #ffffff;
  --card-hover: #f3f4f6;
  --text-primary: #1f2937;

  /* Cellules */
  --cell-bg: #ffffff;
  --cell-hover: #f3f4f6;
  --cell-initial: #e5e7eb;
  --cell-highlighted: #dbeafe;
  --cell-selected: #bfdbfe;
  --cell-error: #fee2e2;
  --error-text: #dc2626;
  --note-color: #6b7280;

  /* Boutons */
  --btn-bg: #ffffff;
  --btn-hover: #f3f4f6;

  /* Autres */
  --success: #10b981;
  --success-bg: #d1fae5;
  --warning: #f59e0b;
  --progress-bg: #e5e7eb;
  --overlay-bg: rgba(255, 255, 255, 0.95);
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Couleurs principales */
    --primary: #60a5fa;
    --primary-dark: #3b82f6;
    --primary-light: #1e3a8a;

    /* Texte */
    --text: #f9fafb;
    --text-secondary: #9ca3af;

    /* Bordures */
    --border-light: #374151;
    --border-thick: #9ca3af;

    /* Backgrounds */
    --bg: #111827;
    --bg-primary: #111827;
    --header-bg: #1f2937;
    --card-bg: #1f2937;
    --card-hover: #374151;
    --text-primary: #f9fafb;

    /* Cellules */
    --cell-bg: #1f2937;
    --cell-hover: #374151;
    --cell-initial: #374151;
    --cell-highlighted: #1e3a8a;
    --cell-selected: #1e40af;
    --cell-error: #7f1d1d;
    --error-text: #fca5a5;
    --note-color: #9ca3af;

    /* Boutons */
    --btn-bg: #1f2937;
    --btn-hover: #374151;

    /* Autres */
    --success: #34d399;
    --success-bg: #064e3b;
    --warning: #fbbf24;
    --progress-bg: #374151;
    --overlay-bg: rgba(17, 24, 39, 0.95);
  }
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
    'Helvetica Neue', sans-serif;
  background-color: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.menu-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
