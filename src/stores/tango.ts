import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  TangoSymbol,
  TangoDifficulty,
  type TangoGrid,
  type TangoPosition,
  type TangoConstraint
} from '@/types/tango'
import { TangoGenerator } from '@/utils/tangoGenerator'
import { TangoValidator } from '@/utils/tangoValidator'
import { TangoStatsManager } from '@/utils/tangoStatsManager'

const STORAGE_KEY = 'tango-game-state'
const GRID_SIZE = 6

export const useTangoStore = defineStore('tango', () => {
  // État
  const grid = ref<TangoGrid>([])
  const solution = ref<TangoSymbol[][]>([])
  const constraints = ref<TangoConstraint[]>([])
  const difficulty = ref<TangoDifficulty>(TangoDifficulty.MEDIUM)
  const startTime = ref<number>(0)
  const elapsedTime = ref<number>(0)
  const isCompleted = ref(false)
  const isPaused = ref(false)
  const hintsUsed = ref(0)
  const selectedCell = ref<TangoPosition | null>(null)
  const showErrors = ref(true)
  const errorsCount = ref(0)
  const totalPauseTime = ref(0)
  const lastPauseStart = ref<number | null>(null)

  // Timer
  let timerInterval: number | null = null

  // Computed
  const formattedTime = computed(() => {
    const totalSeconds = Math.floor(elapsedTime.value / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  const progress = computed(() => {
    let filled = 0
    let total = 0
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!grid.value[row]![col]!.isInitial) {
          total++
          if (grid.value[row]![col]!.value !== TangoSymbol.EMPTY) {
            filled++
          }
        }
      }
    }
    return total > 0 ? (filled / total) * 100 : 0
  })

  // Initialisation de la grille vide
  function createEmptyGrid(): TangoGrid {
    return Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => ({
        value: TangoSymbol.EMPTY,
        isInitial: false,
        isError: false,
        isHighlighted: false
      }))
    )
  }

  // Démarre un nouveau jeu
  function newGame(newDifficulty: TangoDifficulty) {
    difficulty.value = newDifficulty
    const generator = new TangoGenerator()
    const { puzzle, solution: sol, constraints: cons } = generator.generate(newDifficulty)

    solution.value = sol
    constraints.value = cons
    grid.value = createEmptyGrid()

    // Remplir la grille avec le puzzle
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (puzzle[row]![col] !== TangoSymbol.EMPTY) {
          grid.value[row]![col]!.value = puzzle[row]![col]!
          grid.value[row]![col]!.isInitial = true
        }
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

  // Gestion du timer
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

  // Sélectionner une cellule et toggle le symbole (vide → soleil → lune → vide)
  function selectCell(row: number, col: number) {
    if (grid.value[row]![col]!.isInitial || isCompleted.value) {
      return
    }

    const cell = grid.value[row]![col]!

    // Toggle cyclique : vide → soleil → lune → vide
    if (cell.value === TangoSymbol.EMPTY) {
      cell.value = TangoSymbol.SUN
    } else if (cell.value === TangoSymbol.SUN) {
      cell.value = TangoSymbol.MOON
    } else {
      cell.value = TangoSymbol.EMPTY
    }

    selectedCell.value = { row, col }
    highlightRelatedCells(row, col)
    updateErrors()
    checkCompletion()
    saveGame()
  }

  // Mettre en surbrillance les cellules liées
  function highlightRelatedCells(row: number, col: number) {
    // Désactiver tous les surbrillances d'abord
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        grid.value[r]![c]!.isHighlighted = false
      }
    }

    // Mettre en surbrillance la ligne et la colonne
    for (let i = 0; i < GRID_SIZE; i++) {
      grid.value[row]![i]!.isHighlighted = true
      grid.value[i]![col]!.isHighlighted = true
    }
  }

  // Définir la valeur d'une cellule
  function setCellValue(row: number, col: number, symbol: TangoSymbol) {
    if (grid.value[row]![col]!.isInitial || isCompleted.value) return

    const cell = grid.value[row]![col]!

    // Si la cellule a déjà cette valeur, on la vide
    if (cell.value === symbol) {
      cell.value = TangoSymbol.EMPTY
    } else {
      cell.value = symbol
    }

    updateErrors()
    checkCompletion()
    saveGame()
  }

  // Gérer l'entrée d'un symbole
  function handleSymbolInput(symbol: TangoSymbol) {
    if (!selectedCell.value || symbol === TangoSymbol.EMPTY) return

    const { row, col } = selectedCell.value
    setCellValue(row, col, symbol)
  }

  // Effacer la cellule sélectionnée
  function clearSelectedCell() {
    if (!selectedCell.value) return

    const { row, col } = selectedCell.value
    if (grid.value[row]![col]!.isInitial) return

    grid.value[row]![col]!.value = TangoSymbol.EMPTY

    updateErrors()
    saveGame()
  }

  // Mettre à jour les erreurs
  function updateErrors() {
    if (!showErrors.value) {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          grid.value[row]![col]!.isError = false
        }
      }
      return
    }

    let currentErrors = 0
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = grid.value[row]![col]!
        if (cell.value !== TangoSymbol.EMPTY && !cell.isInitial) {
          const isError = !TangoValidator.isValidMove(
            grid.value,
            row,
            col,
            cell.value,
            constraints.value
          )
          cell.isError = isError
          if (isError) {
            currentErrors++
          }
        } else {
          cell.isError = false
        }
      }
    }

    // Mettre à jour le compteur d'erreurs (accumule les erreurs)
    if (currentErrors > errorsCount.value) {
      errorsCount.value = currentErrors
    }
  }

  // Vérifier si le jeu est terminé
  function checkCompletion() {
    if (TangoValidator.isFilled(grid.value)) {
      if (TangoValidator.isComplete(grid.value, solution.value)) {
        isCompleted.value = true
        if (timerInterval !== null) {
          clearInterval(timerInterval)
        }

        // Enregistrer les statistiques de la partie
        TangoStatsManager.saveGameStats(
          difficulty.value,
          elapsedTime.value,
          errorsCount.value,
          hintsUsed.value,
          totalPauseTime.value
        )
      }
    }
  }

  // Obtenir un indice
  function getHint() {
    if (isCompleted.value) return

    // Trouver une cellule vide
    const emptyCells: TangoPosition[] = []
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (
          !grid.value[row]![col]!.isInitial &&
          grid.value[row]![col]!.value === TangoSymbol.EMPTY
        ) {
          emptyCells.push({ row, col })
        }
      }
    }

    if (emptyCells.length === 0) return

    // Choisir une cellule aléatoire
    const randomIndex = Math.floor(Math.random() * emptyCells.length)
    const { row, col } = emptyCells[randomIndex]!

    // Révéler la solution
    grid.value[row]![col]!.value = solution.value[row]![col]!

    hintsUsed.value++
    updateErrors()
    checkCompletion()
    saveGame()
  }

  // Sauvegarder le jeu
  function saveGame() {
    const state = {
      grid: grid.value,
      solution: solution.value,
      constraints: constraints.value,
      difficulty: difficulty.value,
      startTime: startTime.value,
      elapsedTime: elapsedTime.value,
      isCompleted: isCompleted.value,
      hintsUsed: hintsUsed.value,
      errorsCount: errorsCount.value,
      totalPauseTime: totalPauseTime.value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  // Charger le jeu
  function loadGame() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return false

    try {
      const state = JSON.parse(saved)
      grid.value = state.grid
      solution.value = state.solution
      constraints.value = state.constraints
      difficulty.value = state.difficulty
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
      console.error('Erreur lors du chargement de la partie:', error)
      return false
    }
  }

  // Réinitialiser le jeu
  function resetGame() {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
    }
    grid.value = []
    solution.value = []
    constraints.value = []
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
    solution,
    constraints,
    difficulty,
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

    // Actions
    newGame,
    pauseGame,
    resumeGame,
    selectCell,
    setCellValue,
    handleSymbolInput,
    clearSelectedCell,
    updateErrors,
    getHint,
    saveGame,
    loadGame,
    resetGame
  }
})
