import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  PicrossCellState,
  PicrossDifficulty,
  type PicrossGrid,
  type PicrossClue,
  type PicrossPosition
} from '@/contexts/picross/types/picross'
import { PicrossGenerator } from '@/contexts/picross/utils/picrossGenerator'
import { PicrossStatsManager } from '@/contexts/picross/utils/picrossStatsManager'

const STORAGE_KEY = 'picross-game-state'

export const usePicrossStore = defineStore('picross', () => {
  // État
  const grid = ref<PicrossGrid>([])
  const rowClues = ref<PicrossClue[]>([])
  const colClues = ref<PicrossClue[]>([])
  const difficulty = ref<PicrossDifficulty>(PicrossDifficulty.EASY)
  const gridSize = ref(5)
  const startTime = ref<number>(0)
  const elapsedTime = ref<number>(0)
  const isCompleted = ref(false)
  const isPaused = ref(false)
  const hintsUsed = ref(0)
  const selectedCell = ref<PicrossPosition | null>(null)
  const showErrors = ref(true)
  const errorsCount = ref(0)
  const totalPauseTime = ref(0)
  const lastPauseStart = ref<number | null>(null)

  // Timer
  let timerInterval: number | null = null
  let errorCountTimeout: number | null = null

  // Computed
  const formattedTime = computed(() => {
    const totalSeconds = Math.floor(elapsedTime.value / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  const progress = computed(() => {
    if (grid.value.length === 0) return 0
    let correctFilled = 0
    let totalToFill = 0
    for (let row = 0; row < gridSize.value; row++) {
      for (let col = 0; col < gridSize.value; col++) {
        const cell = grid.value[row]![col]!
        if (cell.solution) {
          totalToFill++
          if (cell.state === PicrossCellState.FILLED) {
            correctFilled++
          }
        }
      }
    }
    return totalToFill > 0 ? (correctFilled / totalToFill) * 100 : 0
  })

  // Vérifie si les indices d'une ligne sont satisfaits
  function isRowComplete(row: number): boolean {
    const line: boolean[] = []
    for (let col = 0; col < gridSize.value; col++) {
      line.push(grid.value[row]![col]!.state === PicrossCellState.FILLED)
    }
    const currentClue = computeLineClue(line)
    const expectedClue = rowClues.value[row]!
    return cluesMatch(currentClue, expectedClue)
  }

  // Vérifie si les indices d'une colonne sont satisfaits
  function isColComplete(col: number): boolean {
    const line: boolean[] = []
    for (let row = 0; row < gridSize.value; row++) {
      line.push(grid.value[row]![col]!.state === PicrossCellState.FILLED)
    }
    const currentClue = computeLineClue(line)
    const expectedClue = colClues.value[col]!
    return cluesMatch(currentClue, expectedClue)
  }

  function computeLineClue(line: boolean[]): PicrossClue {
    const clue: PicrossClue = []
    let count = 0
    for (const cell of line) {
      if (cell) {
        count++
      } else if (count > 0) {
        clue.push(count)
        count = 0
      }
    }
    if (count > 0) {
      clue.push(count)
    }
    return clue.length > 0 ? clue : [0]
  }

  function cluesMatch(a: PicrossClue, b: PicrossClue): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false
    }
    return true
  }

  // Créer une grille vide
  function createEmptyGrid(size: number): PicrossGrid {
    return Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({
        state: PicrossCellState.EMPTY,
        solution: false,
        isError: false
      }))
    )
  }

  // Démarrer une nouvelle partie
  function newGame(newDifficulty: PicrossDifficulty) {
    difficulty.value = newDifficulty
    const result = PicrossGenerator.generate(newDifficulty)

    gridSize.value = result.gridSize
    rowClues.value = result.rowClues
    colClues.value = result.colClues
    grid.value = createEmptyGrid(result.gridSize)

    // Stocker la solution dans chaque cellule
    for (let row = 0; row < result.gridSize; row++) {
      for (let col = 0; col < result.gridSize; col++) {
        grid.value[row]![col]!.solution = result.solution[row]![col]!
      }
    }

    startTime.value = Date.now()
    elapsedTime.value = 0
    isCompleted.value = false
    isPaused.value = false
    hintsUsed.value = 0
    selectedCell.value = null
    errorsCount.value = 0
    totalPauseTime.value = 0
    lastPauseStart.value = null

    startTimer()
    saveGame()
  }

  // Timer
  function startTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
    }
    timerInterval = window.setInterval(() => {
      if (!isPaused.value && !isCompleted.value) {
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

  // Sélectionner et toggle une cellule
  function selectCell(row: number, col: number) {
    if (isCompleted.value || isPaused.value) return

    const cell = grid.value[row]![col]!
    selectedCell.value = { row, col }

    if (cell.state === PicrossCellState.FILLED) {
      cell.state = PicrossCellState.EMPTY
    } else {
      cell.state = PicrossCellState.FILLED
    }

    updateErrors()
    checkCompletion()
    saveGame()
  }

  // Effacer la cellule sélectionnée
  function clearSelectedCell() {
    if (!selectedCell.value) return
    const { row, col } = selectedCell.value
    grid.value[row]![col]!.state = PicrossCellState.EMPTY
    updateErrors()
    saveGame()
  }

  // Mettre à jour les erreurs visuelles
  function updateErrorsDisplay() {
    if (!showErrors.value) {
      for (let row = 0; row < gridSize.value; row++) {
        for (let col = 0; col < gridSize.value; col++) {
          grid.value[row]![col]!.isError = false
        }
      }
      return
    }

    for (let row = 0; row < gridSize.value; row++) {
      for (let col = 0; col < gridSize.value; col++) {
        const cell = grid.value[row]![col]!
        cell.isError = cell.state === PicrossCellState.FILLED && !cell.solution
      }
    }
  }

  function countErrors() {
    if (!showErrors.value) return

    let currentErrors = 0
    for (let row = 0; row < gridSize.value; row++) {
      for (let col = 0; col < gridSize.value; col++) {
        if (grid.value[row]![col]!.isError) {
          currentErrors++
        }
      }
    }

    if (currentErrors > errorsCount.value) {
      errorsCount.value = currentErrors
    }
  }

  function clearErrorsDisplay() {
    for (let row = 0; row < gridSize.value; row++) {
      for (let col = 0; col < gridSize.value; col++) {
        grid.value[row]![col]!.isError = false
      }
    }
  }

  function updateErrors() {
    clearErrorsDisplay()

    if (errorCountTimeout !== null) {
      clearTimeout(errorCountTimeout)
    }

    errorCountTimeout = window.setTimeout(() => {
      updateErrorsDisplay()
      countErrors()
      errorCountTimeout = null
    }, 1000)
  }

  // Vérifier si le puzzle est terminé
  function checkCompletion() {
    for (let row = 0; row < gridSize.value; row++) {
      for (let col = 0; col < gridSize.value; col++) {
        const cell = grid.value[row]![col]!
        if (cell.solution && cell.state !== PicrossCellState.FILLED) return
        if (!cell.solution && cell.state === PicrossCellState.FILLED) return
      }
    }

    isCompleted.value = true
    if (timerInterval !== null) {
      clearInterval(timerInterval)
    }

    PicrossStatsManager.saveGameStats(
      difficulty.value,
      elapsedTime.value,
      errorsCount.value,
      hintsUsed.value,
      totalPauseTime.value
    )
  }

  // Obtenir un indice (révéler une cellule)
  function getHint() {
    if (isCompleted.value) return

    const emptyCells: PicrossPosition[] = []
    for (let row = 0; row < gridSize.value; row++) {
      for (let col = 0; col < gridSize.value; col++) {
        const cell = grid.value[row]![col]!
        if (cell.solution && cell.state !== PicrossCellState.FILLED) {
          emptyCells.push({ row, col })
        }
      }
    }

    if (emptyCells.length === 0) return

    const randomIndex = Math.floor(Math.random() * emptyCells.length)
    const { row, col } = emptyCells[randomIndex]!
    grid.value[row]![col]!.state = PicrossCellState.FILLED

    hintsUsed.value++
    updateErrors()
    checkCompletion()
    saveGame()
  }

  // Sauvegarder
  function saveGame() {
    const state = {
      grid: grid.value,
      rowClues: rowClues.value,
      colClues: colClues.value,
      difficulty: difficulty.value,
      gridSize: gridSize.value,
      startTime: startTime.value,
      elapsedTime: elapsedTime.value,
      isCompleted: isCompleted.value,
      hintsUsed: hintsUsed.value,
      errorsCount: errorsCount.value,
      totalPauseTime: totalPauseTime.value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  // Charger
  function loadGame() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return false

    try {
      const state = JSON.parse(saved)
      grid.value = state.grid
      rowClues.value = state.rowClues
      colClues.value = state.colClues
      difficulty.value = state.difficulty
      gridSize.value = state.gridSize
      startTime.value = Date.now() - state.elapsedTime
      elapsedTime.value = state.elapsedTime
      isCompleted.value = state.isCompleted
      hintsUsed.value = state.hintsUsed
      errorsCount.value = state.errorsCount || 0
      totalPauseTime.value = state.totalPauseTime || 0
      isPaused.value = false
      selectedCell.value = null

      if (!isCompleted.value) {
        startTimer()
      }

      return true
    } catch (error) {
      console.error('Erreur lors du chargement de la partie Picross:', error)
      return false
    }
  }

  // Réinitialiser
  function resetGame() {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
    }
    grid.value = []
    rowClues.value = []
    colClues.value = []
    startTime.value = 0
    elapsedTime.value = 0
    isCompleted.value = false
    isPaused.value = false
    hintsUsed.value = 0
    selectedCell.value = null
    errorsCount.value = 0
    totalPauseTime.value = 0
    lastPauseStart.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    // État
    grid,
    rowClues,
    colClues,
    difficulty,
    gridSize,
    startTime,
    elapsedTime,
    isCompleted,
    isPaused,
    hintsUsed,
    selectedCell,
    showErrors,
    errorsCount,
    totalPauseTime,

    // Computed
    formattedTime,
    progress,
    isRowComplete,
    isColComplete,

    // Actions
    newGame,
    pauseGame,
    resumeGame,
    selectCell,
    clearSelectedCell,
    updateErrors,
    getHint,
    saveGame,
    loadGame,
    resetGame
  }
})
