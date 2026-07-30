<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useSudokuStore } from '@/contexts/sudoku/store/sudoku'
import { useTangoStore } from '@/contexts/tango/store/tango'
import { useMinesweeperStore } from '@/contexts/minesweeper/store/minesweeper'
import { useGame2048Store } from '@/contexts/game2048/store/game2048'
import { usePicrossStore } from '@/contexts/picross/store/picross'
import { useDedaleStore } from '@/contexts/dedale/store/dedale'
import { useTectonicStore } from '@/contexts/tectonic/store/tectonic'
import { useRikudoStore } from '@/contexts/rikudo/store/rikudo'
import DifficultySelector from '@/components/DifficultySelector.vue'
import SudokuHeader from '@/contexts/sudoku/components/SudokuHeader.vue'
import SudokuGrid from '@/contexts/sudoku/components/SudokuGrid.vue'
import SudokuControls from '@/contexts/sudoku/components/SudokuControls.vue'
import TangoHeader from '@/contexts/tango/components/TangoHeader.vue'
import TangoGrid from '@/contexts/tango/components/TangoGrid.vue'
import TangoControls from '@/contexts/tango/components/TangoControls.vue'
import MinesweeperHeader from '@/contexts/minesweeper/components/MinesweeperHeader.vue'
import MinesweeperGrid from '@/contexts/minesweeper/components/MinesweeperGrid.vue'
import MinesweeperControls from '@/contexts/minesweeper/components/MinesweeperControls.vue'
import Game2048Header from '@/contexts/game2048/components/Game2048Header.vue'
import Game2048Grid from '@/contexts/game2048/components/Game2048Grid.vue'
import Game2048Controls from '@/contexts/game2048/components/Game2048Controls.vue'
import PicrossHeader from '@/contexts/picross/components/PicrossHeader.vue'
import PicrossGrid from '@/contexts/picross/components/PicrossGrid.vue'
import PicrossControls from '@/contexts/picross/components/PicrossControls.vue'
import DedaleHeader from '@/contexts/dedale/components/DedaleHeader.vue'
import DedaleGrid from '@/contexts/dedale/components/DedaleGrid.vue'
import DedaleControls from '@/contexts/dedale/components/DedaleControls.vue'
import TectonicHeader from '@/contexts/tectonic/components/TectonicHeader.vue'
import TectonicGrid from '@/contexts/tectonic/components/TectonicGrid.vue'
import TectonicControls from '@/contexts/tectonic/components/TectonicControls.vue'
import RikudoHeader from '@/contexts/rikudo/components/RikudoHeader.vue'
import RikudoGrid from '@/contexts/rikudo/components/RikudoGrid.vue'
import RikudoControls from '@/contexts/rikudo/components/RikudoControls.vue'
import Statistics from '@/components/Statistics.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

type GameType = 'sudoku' | 'tango' | 'minesweeper' | 'game2048' | 'picross' | 'dedale' | 'tectonic' | 'rikudo'

const sudokuStore = useSudokuStore()
const tangoStore = useTangoStore()
const minesweeperStore = useMinesweeperStore()
const game2048Store = useGame2048Store()
const picrossStore = usePicrossStore()
const dedaleStore = useDedaleStore()
const tectonicStore = useTectonicStore()
const rikudoStore = useRikudoStore()
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
  } else if (currentGameType.value === 'tectonic') {
    return tectonicStore.grid.length > 0
  } else {
    return rikudoStore.grid.length > 0
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
  const rikudoLoaded = rikudoStore.loadGame()

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
  } else if (rikudoLoaded) {
    currentGameType.value = 'rikudo'
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
  } else if (currentGameType.value === 'tectonic') {
    tectonicStore.newGame(tectonicStore.difficulty)
  } else {
    rikudoStore.newGame(rikudoStore.difficulty)
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
  } else if (currentGameType.value === 'tectonic') {
    tectonicStore.resetGame()
  } else {
    rikudoStore.resetGame()
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
        <SudokuHeader @new-game="requestNewGame" @go-home="requestGoHome" />
        <SudokuGrid />
        <SudokuControls />
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
      <template v-else-if="currentGameType === 'tectonic'">
        <TectonicHeader @new-game="requestNewGame" @go-home="requestGoHome" />
        <TectonicGrid />
        <TectonicControls />
      </template>

      <!-- Rikudo Game -->
      <template v-else>
        <RikudoHeader @new-game="requestNewGame" @go-home="requestGoHome" />
        <RikudoGrid />
        <RikudoControls />
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
