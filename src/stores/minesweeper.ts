import { defineStore } from 'pinia'
import { ref, computed, triggerRef } from 'vue'
import {
  MinesweeperCellState,
  MinesweeperDifficulty,
  MinesweeperGameStatus,
  type MinesweeperGrid,
  type MinesweeperConfig,
  type MinesweeperPosition
} from '@/types/minesweeper'
import { MinesweeperGenerator } from '@/utils/minesweeperGenerator'
import { MinesweeperStatsManager } from '@/utils/minesweeperStatsManager'

const STORAGE_KEY = 'minesweeper-game-state'

export const useMinesweeperStore = defineStore('minesweeper', () => {
  // État
  const grid = ref<MinesweeperGrid>([])
  const difficulty = ref<MinesweeperDifficulty>(MinesweeperDifficulty.BEGINNER)
  const config = ref<MinesweeperConfig>({ rows: 9, cols: 9, mines: 10 })
  const gameStatus = ref<MinesweeperGameStatus>(MinesweeperGameStatus.PLAYING)
  const startTime = ref<number>(0)
  const elapsedTime = ref<number>(0)
  const isPaused = ref(false)
  const flagMode = ref(false)
  const isFirstClick = ref(true)
  const totalPauseTime = ref(0)
  const lastPauseStart = ref<number | null>(null)
  const selectedCell = ref<MinesweeperPosition | null>(null)

  // Timer
  let timerInterval: number | null = null

  // Computed
  const formattedTime = computed(() => {
    const totalSeconds = Math.floor(elapsedTime.value / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  const flagsPlaced = computed(() => {
    let count = 0
    for (let r = 0; r < config.value.rows; r++) {
      for (let c = 0; c < config.value.cols; c++) {
        if (grid.value[r]?.[c]?.state === MinesweeperCellState.FLAGGED) {
          count++
        }
      }
    }
    return count
  })

  const remainingMines = computed(() => {
    return config.value.mines - flagsPlaced.value
  })

  const revealedCount = computed(() => {
    let count = 0
    for (let r = 0; r < config.value.rows; r++) {
      for (let c = 0; c < config.value.cols; c++) {
        if (grid.value[r]?.[c]?.state === MinesweeperCellState.REVEALED) {
          count++
        }
      }
    }
    return count
  })

  const totalSafeCells = computed(() => {
    return config.value.rows * config.value.cols - config.value.mines
  })

  const progress = computed(() => {
    if (totalSafeCells.value === 0) return 0
    return (revealedCount.value / totalSafeCells.value) * 100
  })

  const isCompleted = computed(() => {
    return gameStatus.value === MinesweeperGameStatus.WON
  })

  const isGameOver = computed(() => {
    return gameStatus.value === MinesweeperGameStatus.LOST
  })

  // Nouveau jeu
  function newGame(newDifficulty: MinesweeperDifficulty) {
    difficulty.value = newDifficulty
    config.value = MinesweeperGenerator.getConfig(newDifficulty)
    grid.value = MinesweeperGenerator.createEmptyGrid(config.value)
    gameStatus.value = MinesweeperGameStatus.PLAYING
    startTime.value = Date.now()
    elapsedTime.value = 0
    isPaused.value = false
    flagMode.value = false
    isFirstClick.value = true
    totalPauseTime.value = 0
    lastPauseStart.value = null
    selectedCell.value = null

    startTimer()
    saveGame()
  }

  // Timer
  function startTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
    }
    timerInterval = window.setInterval(() => {
      if (
        !isPaused.value &&
        gameStatus.value === MinesweeperGameStatus.PLAYING
      ) {
        elapsedTime.value = Date.now() - startTime.value
      }
    }, 100)
  }

  function pauseGame() {
    isPaused.value = true
    lastPauseStart.value = Date.now()
  }

  function resumeGame() {
    isPaused.value = false
    if (lastPauseStart.value !== null) {
      totalPauseTime.value += Date.now() - lastPauseStart.value
      lastPauseStart.value = null
    }
    startTime.value = Date.now() - elapsedTime.value
  }

  // Révéler une cellule
  function revealCell(row: number, col: number) {
    if (
      gameStatus.value !== MinesweeperGameStatus.PLAYING ||
      isPaused.value
    ) {
      return
    }

    const cell = grid.value[row]?.[col]
    if (!cell || cell.state !== MinesweeperCellState.HIDDEN) return

    // Premier clic : placer les mines
    if (isFirstClick.value) {
      MinesweeperGenerator.placeMines(grid.value, config.value, row, col)
      isFirstClick.value = false
    }

    if (cell.isMine) {
      // Game over
      cell.state = MinesweeperCellState.REVEALED
      gameStatus.value = MinesweeperGameStatus.LOST
      revealAllMines()
      stopTimer()

      MinesweeperStatsManager.saveGameStats(
        difficulty.value,
        elapsedTime.value,
        false,
        flagsPlaced.value,
        revealedCount.value,
        config.value.rows * config.value.cols,
        config.value.mines,
        totalPauseTime.value
      )
    } else {
      // Flood fill si 0 mines adjacentes
      floodReveal(row, col)
      checkWin()
    }

    triggerRef(grid)
    saveGame()
  }

  // Révélation en cascade (flood fill)
  function floodReveal(row: number, col: number) {
    const cell = grid.value[row]?.[col]
    if (!cell || cell.state !== MinesweeperCellState.HIDDEN || cell.isMine) return

    cell.state = MinesweeperCellState.REVEALED

    if (cell.adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = row + dr
          const nc = col + dc
          if (nr >= 0 && nr < config.value.rows && nc >= 0 && nc < config.value.cols) {
            floodReveal(nr, nc)
          }
        }
      }
    }
  }

  // Basculer un drapeau
  function toggleFlag(row: number, col: number) {
    if (
      gameStatus.value !== MinesweeperGameStatus.PLAYING ||
      isPaused.value
    ) {
      return
    }

    const cell = grid.value[row]?.[col]
    if (!cell || cell.state === MinesweeperCellState.REVEALED) return

    if (cell.state === MinesweeperCellState.FLAGGED) {
      cell.state = MinesweeperCellState.HIDDEN
    } else {
      cell.state = MinesweeperCellState.FLAGGED
    }

    triggerRef(grid)
    saveGame()
  }

  // Gérer le clic sur une cellule (en fonction du mode)
  function handleCellClick(row: number, col: number) {
    if (flagMode.value) {
      toggleFlag(row, col)
    } else {
      revealCell(row, col)
    }
    selectedCell.value = { row, col }
  }

  // Gérer le clic droit (toujours drapeau)
  function handleCellRightClick(row: number, col: number) {
    toggleFlag(row, col)
    selectedCell.value = { row, col }
  }

  // Révéler toutes les mines (game over)
  function revealAllMines() {
    for (let r = 0; r < config.value.rows; r++) {
      for (let c = 0; c < config.value.cols; c++) {
        const cell = grid.value[r]![c]!
        if (cell.isMine && cell.state !== MinesweeperCellState.REVEALED) {
          cell.state = MinesweeperCellState.REVEALED
        }
      }
    }
  }

  // Vérifier la victoire
  function checkWin() {
    if (revealedCount.value === totalSafeCells.value) {
      gameStatus.value = MinesweeperGameStatus.WON
      stopTimer()

      // Placer automatiquement les drapeaux sur les mines restantes
      for (let r = 0; r < config.value.rows; r++) {
        for (let c = 0; c < config.value.cols; c++) {
          const cell = grid.value[r]![c]!
          if (cell.isMine && cell.state === MinesweeperCellState.HIDDEN) {
            cell.state = MinesweeperCellState.FLAGGED
          }
        }
      }

      MinesweeperStatsManager.saveGameStats(
        difficulty.value,
        elapsedTime.value,
        true,
        flagsPlaced.value,
        revealedCount.value,
        config.value.rows * config.value.cols,
        config.value.mines,
        totalPauseTime.value
      )
    }
  }

  function stopTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  // Basculer le mode drapeau
  function toggleFlagMode() {
    flagMode.value = !flagMode.value
  }

  // Sauvegarder
  function saveGame() {
    const state = {
      grid: grid.value.map((row) =>
        row.map((cell) => ({
          isMine: cell.isMine,
          state: cell.state,
          adjacentMines: cell.adjacentMines,
          isHighlighted: false
        }))
      ),
      difficulty: difficulty.value,
      config: config.value,
      gameStatus: gameStatus.value,
      startTime: startTime.value,
      elapsedTime: elapsedTime.value,
      isFirstClick: isFirstClick.value,
      totalPauseTime: totalPauseTime.value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  // Charger
  function loadGame(): boolean {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return false

    try {
      const state = JSON.parse(saved)
      grid.value = state.grid
      difficulty.value = state.difficulty
      config.value = state.config
      gameStatus.value = state.gameStatus
      startTime.value = Date.now() - state.elapsedTime
      elapsedTime.value = state.elapsedTime
      isFirstClick.value = state.isFirstClick
      totalPauseTime.value = state.totalPauseTime || 0
      isPaused.value = false
      flagMode.value = false
      selectedCell.value = null

      if (gameStatus.value === MinesweeperGameStatus.PLAYING) {
        startTimer()
      }

      return true
    } catch (error) {
      console.error('Erreur lors du chargement de la partie Démineur:', error)
      return false
    }
  }

  // Réinitialiser
  function resetGame() {
    stopTimer()
    grid.value = []
    config.value = { rows: 9, cols: 9, mines: 10 }
    gameStatus.value = MinesweeperGameStatus.PLAYING
    startTime.value = 0
    elapsedTime.value = 0
    isPaused.value = false
    flagMode.value = false
    isFirstClick.value = true
    selectedCell.value = null
    totalPauseTime.value = 0
    lastPauseStart.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    // État
    grid,
    difficulty,
    config,
    gameStatus,
    startTime,
    elapsedTime,
    isPaused,
    flagMode,
    isFirstClick,
    selectedCell,
    totalPauseTime,

    // Computed
    formattedTime,
    flagsPlaced,
    remainingMines,
    revealedCount,
    totalSafeCells,
    progress,
    isCompleted,
    isGameOver,

    // Actions
    newGame,
    pauseGame,
    resumeGame,
    revealCell,
    toggleFlag,
    handleCellClick,
    handleCellRightClick,
    toggleFlagMode,
    saveGame,
    loadGame,
    resetGame
  }
})
