import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Grid, Position } from '@/types/sudoku'
import { Difficulty, GridSize } from '@/types/sudoku'
import { SudokuGenerator } from '@/utils/sudokuGenerator'
import { SudokuValidator } from '@/utils/sudokuValidator'
import { StatsManager } from '@/utils/statsManager'

const STORAGE_KEY = 'sudoku-game-state'

export const useSudokuStore = defineStore('sudoku', () => {
  // État
  const grid = ref<Grid>([])
  const solution = ref<number[][]>([])
  const difficulty = ref<Difficulty>(Difficulty.NORMAL)
  const gridSize = ref<GridSize>(GridSize.NINE)
  const startTime = ref<number>(0)
  const elapsedTime = ref<number>(0)
  const isCompleted = ref(false)
  const isPaused = ref(false)
  const hintsUsed = ref(0)
  const selectedCell = ref<Position | null>(null)
  const noteMode = ref(false)
  const showErrors = ref(true)
  const showHighlights = ref(true)
  const errorsCount = ref(0)
  const notesUsed = ref(0)
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
    const size = grid.value.length
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!grid.value[row]![col]!.isInitial) {
          total++
          if (grid.value[row]![col]!.value !== null) {
            filled++
          }
        }
      }
    }
    return total > 0 ? (filled / total) * 100 : 0
  })

  // Initialisation de la grille vide
  function createEmptyGrid(size: number): Grid {
    return Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({
        value: null,
        notes: new Set<number>(),
        isInitial: false,
        isError: false,
        isHighlighted: false
      }))
    )
  }

  // Démarre un nouveau jeu
  function newGame(newDifficulty: Difficulty, newGridSize: GridSize = GridSize.NINE) {
    difficulty.value = newDifficulty
    gridSize.value = newGridSize
    const generator = new SudokuGenerator(newGridSize)
    const { puzzle, solution: sol } = generator.generate(newDifficulty)

    solution.value = sol
    grid.value = createEmptyGrid(newGridSize)

    // Remplir la grille avec le puzzle
    for (let row = 0; row < newGridSize; row++) {
      for (let col = 0; col < newGridSize; col++) {
        if (puzzle[row]![col] !== 0) {
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
    noteMode.value = false
    errorsCount.value = 0
    notesUsed.value = 0
    totalPauseTime.value = 0
    lastPauseStart.value = null
    showHighlights.value = newDifficulty === Difficulty.SIMPLE || newDifficulty === Difficulty.NORMAL

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

  // Sélectionner une cellule
  function selectCell(row: number, col: number) {
    if (grid.value[row]![col]!.isInitial || isCompleted.value) {
      selectedCell.value = null
      return
    }
    selectedCell.value = { row, col }
    highlightRelatedCells(row, col)
  }

  // Mettre en surbrillance les cellules liées
  function highlightRelatedCells(row: number, col: number) {
    const size = grid.value.length
    const regionRows = gridSize.value === GridSize.SIX ? 2 : 3
    const regionCols = gridSize.value === GridSize.SIX ? 3 : 3

    // Toujours désactiver tous les surbrillances d'abord
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        grid.value[r]![c]!.isHighlighted = false
      }
    }

    // Si la surbrillance est désactivée, ne rien faire de plus
    if (!showHighlights.value) return

    // Ligne et colonne
    for (let i = 0; i < size; i++) {
      grid.value[row]![i]!.isHighlighted = true
      grid.value[i]![col]!.isHighlighted = true
    }

    // Région
    const startRow = row - (row % regionRows)
    const startCol = col - (col % regionCols)
    for (let i = 0; i < regionRows; i++) {
      for (let j = 0; j < regionCols; j++) {
        grid.value[startRow + i]![startCol + j]!.isHighlighted = true
      }
    }
  }

  // Définir la valeur d'une cellule
  function setCellValue(row: number, col: number, value: number | null) {
    if (grid.value[row]![col]!.isInitial || isCompleted.value) return

    const cell = grid.value[row]![col]!
    const hadNotes = cell.notes.size > 0

    cell.value = value
    cell.notes.clear()

    // Compter les notes utilisées (nombre total de notes ajoutées)
    if (hadNotes) {
      notesUsed.value += 1
    }

    updateErrors()
    checkCompletion()
    saveGame()
  }

  // Basculer une note
  function toggleNote(row: number, col: number, note: number) {
    if (grid.value[row]![col]!.isInitial || isCompleted.value) return
    if (grid.value[row]![col]!.value !== null) return

    const cell = grid.value[row]![col]!
    if (cell.notes.has(note)) {
      cell.notes.delete(note)
    } else {
      cell.notes.add(note)
      notesUsed.value += 1
    }

    saveGame()
  }

  // Gérer l'entrée d'un nombre
  function handleNumberInput(num: number) {
    if (!selectedCell.value) return

    const { row, col } = selectedCell.value
    if (noteMode.value) {
      toggleNote(row, col, num)
    } else {
      setCellValue(row, col, num)
    }
  }

  // Effacer la cellule sélectionnée
  function clearSelectedCell() {
    if (!selectedCell.value) return

    const { row, col } = selectedCell.value
    if (grid.value[row]![col]!.isInitial) return

    grid.value[row]![col]!.value = null
    grid.value[row]![col]!.notes.clear()

    updateErrors()
    saveGame()
  }

  // Mettre à jour les erreurs
  function updateErrors() {
    const size = grid.value.length
    if (!showErrors.value) {
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          grid.value[row]![col]!.isError = false
        }
      }
      return
    }

    let currentErrors = 0
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const cell = grid.value[row]![col]!
        if (cell.value !== null && !cell.isInitial) {
          const isError = !SudokuValidator.isValidMove(grid.value, row, col, cell.value)
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
    if (SudokuValidator.isFilled(grid.value)) {
      if (SudokuValidator.isComplete(grid.value, solution.value)) {
        isCompleted.value = true
        if (timerInterval !== null) {
          clearInterval(timerInterval)
        }

        // Enregistrer les statistiques de la partie
        StatsManager.saveGameStats(
          difficulty.value,
          gridSize.value,
          elapsedTime.value,
          errorsCount.value,
          hintsUsed.value,
          notesUsed.value,
          totalPauseTime.value
        )
      }
    }
  }

  // Obtenir un indice
  function getHint() {
    if (isCompleted.value) return

    const size = grid.value.length
    // Trouver une cellule vide
    const emptyCells: Position[] = []
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!grid.value[row]![col]!.isInitial && grid.value[row]![col]!.value === null) {
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
    grid.value[row]![col]!.notes.clear()

    hintsUsed.value++
    updateErrors()
    checkCompletion()
    saveGame()
  }

  // Sauvegarder le jeu
  function saveGame() {
    const state = {
      grid: grid.value.map((row) =>
        row.map((cell) => ({
          ...cell,
          notes: Array.from(cell.notes)
        }))
      ),
      solution: solution.value,
      difficulty: difficulty.value,
      gridSize: gridSize.value,
      startTime: startTime.value,
      elapsedTime: elapsedTime.value,
      isCompleted: isCompleted.value,
      hintsUsed: hintsUsed.value,
      errorsCount: errorsCount.value,
      notesUsed: notesUsed.value,
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
      grid.value = state.grid.map((row: unknown[]) =>
        row.map((cell: { notes: number[] }) => ({
          ...cell,
          notes: new Set(cell.notes)
        }))
      )
      solution.value = state.solution
      difficulty.value = state.difficulty
      gridSize.value = state.gridSize || GridSize.NINE
      startTime.value = Date.now() - state.elapsedTime
      elapsedTime.value = state.elapsedTime
      isCompleted.value = state.isCompleted
      hintsUsed.value = state.hintsUsed
      errorsCount.value = state.errorsCount || 0
      notesUsed.value = state.notesUsed || 0
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
    startTime.value = 0
    elapsedTime.value = 0
    isCompleted.value = false
    isPaused.value = false
    hintsUsed.value = 0
    selectedCell.value = null
    noteMode.value = false
    errorsCount.value = 0
    notesUsed.value = 0
    totalPauseTime.value = 0
    lastPauseStart.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    // État
    grid,
    solution,
    difficulty,
    gridSize,
    startTime,
    elapsedTime,
    isCompleted,
    isPaused,
    hintsUsed,
    selectedCell,
    noteMode,
    showErrors,
    showHighlights,
    errorsCount,
    notesUsed,
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
    toggleNote,
    handleNumberInput,
    clearSelectedCell,
    updateErrors,
    getHint,
    saveGame,
    loadGame,
    resetGame
  }
})
