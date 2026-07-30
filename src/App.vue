<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useSudokuStore } from '@/stores/sudoku'
import { useTangoStore } from '@/stores/tango'
import { useMinesweeperStore } from '@/stores/minesweeper'
import { useGame2048Store } from '@/stores/game2048'
import { usePicrossStore } from '@/stores/picross'
import { useDedaleStore } from '@/stores/dedale'
import { useTectonicStore } from '@/stores/tectonic'
import DifficultySelector from '@/components/DifficultySelector.vue'
import GameHeader from '@/components/GameHeader.vue'
import SudokuGrid from '@/components/SudokuGrid.vue'
import GameControls from '@/components/GameControls.vue'
import TangoHeader from '@/components/TangoHeader.vue'
import TangoGrid from '@/components/TangoGrid.vue'
import TangoControls from '@/components/TangoControls.vue'
import MinesweeperHeader from '@/components/MinesweeperHeader.vue'
import MinesweeperGrid from '@/components/MinesweeperGrid.vue'
import MinesweeperControls from '@/components/MinesweeperControls.vue'
import Game2048Header from '@/components/Game2048Header.vue'
import Game2048Grid from '@/components/Game2048Grid.vue'
import Game2048Controls from '@/components/Game2048Controls.vue'
import PicrossHeader from '@/components/PicrossHeader.vue'
import PicrossGrid from '@/components/PicrossGrid.vue'
import PicrossControls from '@/components/PicrossControls.vue'
import DedaleHeader from '@/components/DedaleHeader.vue'
import DedaleGrid from '@/components/DedaleGrid.vue'
import DedaleControls from '@/components/DedaleControls.vue'
import TectonicHeader from '@/components/TectonicHeader.vue'
import TectonicGrid from '@/components/TectonicGrid.vue'
import TectonicControls from '@/components/TectonicControls.vue'
import Statistics from '@/components/Statistics.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

type GameType = 'sudoku' | 'tango' | 'minesweeper' | 'game2048' | 'picross' | 'dedale' | 'tectonic'

const sudokuStore = useSudokuStore()
const tangoStore = useTangoStore()
const minesweeperStore = useMinesweeperStore()
const game2048Store = useGame2048Store()
const picrossStore = usePicrossStore()
const dedaleStore = useDedaleStore()
const tectonicStore = useTectonicStore()
const currentGameType = ref<GameType>('sudoku')
const showMenu = ref(false)
const showStats = ref(false)
const showConfirmNewGame = ref(false)
const pendingAction = ref<'restart' | 'home' | null>(null)

const hasActiveGame = computed(() => {
  if (currentGameType.value === 'sudoku') {
    return sudokuStore.grid.length > 0
  } else if (currentGameType.value === 'tango') {
    return tangoStore.grid.length > 0
  } else if (currentGameType.value === 'minesweeper') {
    return minesweeperStore.grid.length > 0
  } else if (currentGameType.value === 'game2048') {
    return game2048Store.grid.length > 0
  } else if (currentGameType.value === 'picross') {
    return picrossStore.grid.length > 0
  } else if (currentGameType.value === 'dedale') {
    return dedaleStore.grid.length > 0
  } else {
    return tectonicStore.grid.length > 0
  }
})

onMounted(() => {
  // Essayer de charger une partie sauvegardée
  const sudokuLoaded = sudokuStore.loadGame()
  const tangoLoaded = tangoStore.loadGame()
  const minesweeperLoaded = minesweeperStore.loadGame()
  const game2048Loaded = game2048Store.loadGame()
  const picrossLoaded = picrossStore.loadGame()
  const dedaleLoaded = dedaleStore.loadGame()
  const tectonicLoaded = tectonicStore.loadGame()

  if (sudokuLoaded) {
    currentGameType.value = 'sudoku'
    showMenu.value = false
  } else if (tangoLoaded) {
    currentGameType.value = 'tango'
    showMenu.value = false
  } else if (minesweeperLoaded) {
    currentGameType.value = 'minesweeper'
    showMenu.value = false
  } else if (game2048Loaded) {
    currentGameType.value = 'game2048'
    showMenu.value = false
  } else if (picrossLoaded) {
    currentGameType.value = 'picross'
    showMenu.value = false
  } else if (dedaleLoaded) {
    currentGameType.value = 'dedale'
    showMenu.value = false
  } else if (tectonicLoaded) {
    currentGameType.value = 'tectonic'
    showMenu.value = false
  } else {
    showMenu.value = true
  }
})

const handleStart = (gameType: GameType) => {
  currentGameType.value = gameType
  showMenu.value = false
}

const requestNewGame = () => {
  if (hasActiveGame.value) {
    pendingAction.value = 'restart'
    showConfirmNewGame.value = true
  } else {
    restartCurrentGame()
  }
}

const requestGoHome = () => {
  if (hasActiveGame.value) {
    pendingAction.value = 'home'
    showConfirmNewGame.value = true
  } else {
    goHome()
  }
}

const restartCurrentGame = () => {
  if (currentGameType.value === 'sudoku') {
    sudokuStore.newGame(sudokuStore.difficulty, sudokuStore.gridSize)
  } else if (currentGameType.value === 'tango') {
    tangoStore.newGame(tangoStore.difficulty)
  } else if (currentGameType.value === 'minesweeper') {
    minesweeperStore.newGame(minesweeperStore.difficulty)
  } else if (currentGameType.value === 'game2048') {
    game2048Store.newGame(game2048Store.gridSize)
  } else if (currentGameType.value === 'picross') {
    picrossStore.newGame(picrossStore.difficulty)
  } else if (currentGameType.value === 'dedale') {
    dedaleStore.newGame(dedaleStore.difficulty)
  } else {
    tectonicStore.newGame(tectonicStore.difficulty)
  }
}

const goHome = () => {
  if (currentGameType.value === 'sudoku') {
    sudokuStore.resetGame()
  } else if (currentGameType.value === 'tango') {
    tangoStore.resetGame()
  } else if (currentGameType.value === 'minesweeper') {
    minesweeperStore.resetGame()
  } else if (currentGameType.value === 'game2048') {
    game2048Store.resetGame()
  } else if (currentGameType.value === 'picross') {
    picrossStore.resetGame()
  } else if (currentGameType.value === 'dedale') {
    dedaleStore.resetGame()
  } else {
    tectonicStore.resetGame()
  }
  showMenu.value = true
}

const confirmPendingAction = () => {
  if (pendingAction.value === 'restart') {
    restartCurrentGame()
  } else if (pendingAction.value === 'home') {
    goHome()
  }
  pendingAction.value = null
}

const confirmModalText = computed(() => {
  if (pendingAction.value === 'home') {
    return {
      title: "Revenir à l'accueil",
      message: "Voulez-vous vraiment revenir à l'accueil ? La partie en cours sera perdue.",
      confirmText: "Revenir à l'accueil",
    }
  }
  return {
    title: 'Nouvelle partie',
    message: 'Voulez-vous vraiment commencer une nouvelle partie ? La partie en cours sera perdue.',
    confirmText: 'Nouvelle partie',
  }
})

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
      <DifficultySelector :initial-game-type="currentGameType" @start="handleStart" @show-stats="openStats" />
    </div>

    <div v-else class="game-view">
      <!-- Sudoku Game -->
      <template v-if="currentGameType === 'sudoku'">
        <GameHeader @new-game="requestNewGame" @go-home="requestGoHome" />
        <SudokuGrid />
        <GameControls />
      </template>

      <!-- Tango Game -->
      <template v-else-if="currentGameType === 'tango'">
        <TangoHeader @new-game="requestNewGame" @go-home="requestGoHome" />
        <TangoGrid />
        <TangoControls />
      </template>

      <!-- Minesweeper Game -->
      <template v-else-if="currentGameType === 'minesweeper'">
        <MinesweeperHeader @new-game="requestNewGame" @go-home="requestGoHome" />
        <MinesweeperGrid />
        <MinesweeperControls />
      </template>

      <!-- 2048 Game -->
      <template v-else-if="currentGameType === 'game2048'">
        <Game2048Header @new-game="requestNewGame" @go-home="requestGoHome" />
        <Game2048Grid />
        <Game2048Controls />
      </template>

      <!-- Picross Game -->
      <template v-else-if="currentGameType === 'picross'">
        <PicrossHeader @new-game="requestNewGame" @go-home="requestGoHome" />
        <PicrossGrid />
        <PicrossControls />
      </template>

      <!-- Dédale Game -->
      <template v-else-if="currentGameType === 'dedale'">
        <DedaleHeader @new-game="requestNewGame" @go-home="requestGoHome" />
        <DedaleGrid />
        <DedaleControls />
      </template>

      <!-- Tectonic Game -->
      <template v-else>
        <TectonicHeader @new-game="requestNewGame" @go-home="requestGoHome" />
        <TectonicGrid />
        <TectonicControls />
      </template>
    </div>

    <Statistics v-if="showStats" @close="closeStats" />

    <ConfirmModal
      v-model="showConfirmNewGame"
      :title="confirmModalText.title"
      :message="confirmModalText.message"
      :confirm-text="confirmModalText.confirmText"
      cancel-text="Annuler"
      @confirm="confirmPendingAction"
      @cancel="pendingAction = null"
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
