import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TectonicGrid, RegionGrid, Position } from '@/types/tectonic'
import { TectonicDifficulty } from '@/types/tectonic'
import { TectonicGenerator } from '@/utils/tectonicGenerator'
import { TectonicValidator } from '@/utils/tectonicValidator'
import { TectonicStatsManager } from '@/utils/tectonicStatsManager'

const STORAGE_KEY = 'tectonic-game-state'

export const useTectonicStore = defineStore('tectonic', () => {
  // État
  const grid = ref<TectonicGrid>([])
  const solution = ref<number[][]>([])
  const regionGrid = ref<RegionGrid>([])
  const maxRegionSize = ref(5)
  const difficulty = ref<TectonicDifficulty>(TectonicDifficulty.FACILE)
  const rows = ref(6)
  const cols = ref(6)
  const startTime = ref<number>(0)
  const elapsedTime = ref<number>(0)
  const isCompleted = ref(false)
  const isPaused = ref(false)
  const hintsUsed = ref(0)
  const selectedCell = ref<Position | null>(null)
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
    let filled = 0
    let total = 0
    for (let row = 0; row < rows.value; row++) {
      for (let col = 0; col < cols.value; col++) {
        const cell = grid.value[row]![col]!
        if (!cell.isInitial) {
          total++
          if (cell.value !== null) filled++
        }
      }
    }
    return total > 0 ? (filled / total) * 100 : 0
  })

  // Créer la grille de jeu à partir du puzzle généré
  function buildGrid(puzzle: number[][], regions: RegionGrid): TectonicGrid {
    return Array.from({ length: rows.value }, (_, row) =>
      Array.from({ length: cols.value }, (_, col) => {
        const value = puzzle[row]![col]!
        return {
          value: value === 0 ? null : value,
          regionId: regions[row]![col]!,
          isInitial: value !== 0,
          isError: false,
          isHighlighted: false
        }
      })
    )
  }

  // Démarrer une nouvelle partie
  function newGame(newDifficulty: TectonicDifficulty) {
    difficulty.value = newDifficulty
    const config = TectonicGenerator.getDifficultyConfig(newDifficulty)
    rows.value = config.rows
    cols.value = config.cols
    maxRegionSize.value = config.maxRegionSize

    const generator = new TectonicGenerator(newDifficulty)
    const result = generator.generate()

    solution.value = result.solution
    regionGrid.value = result.regionGrid
    grid.value = buildGrid(result.puzzle, result.regionGrid)

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

  // Sélectionner une cellule
  function selectCell(row: number, col: number) {
    if (isCompleted.value || isPaused.value) return
    if (grid.value[row]![col]!.isInitial) return
    selectedCell.value = { row, col }
  }

  // Saisir une valeur dans la cellule sélectionnée
  function handleNumberInput(num: number) {
    if (isCompleted.value || isPaused.value || !selectedCell.value) return

    const { row, col } = selectedCell.value
    const cell = grid.value[row]![col]!
    if (cell.isInitial) return

    cell.value = num

    updateErrors()
    checkCompletion()
    saveGame()
  }

  // Effacer la cellule sélectionnée
  function clearSelectedCell() {
    if (!selectedCell.value) return
    const { row, col } = selectedCell.value
    const cell = grid.value[row]![col]!
    if (cell.isInitial) return

    cell.value = null
    updateErrors()
    saveGame()
  }

  // Mettre à jour les erreurs visuelles (affichage différé pour ne pas gêner la saisie)
  function updateErrorsDisplay() {
    if (!showErrors.value) {
      for (let row = 0; row < rows.value; row++) {
        for (let col = 0; col < cols.value; col++) {
          grid.value[row]![col]!.isError = false
        }
      }
      return
    }

    for (let row = 0; row < rows.value; row++) {
      for (let col = 0; col < cols.value; col++) {
        const cell = grid.value[row]![col]!
        cell.isError =
          cell.value !== null && !TectonicValidator.isValidMove(grid.value, regionGrid.value, row, col, cell.value)
      }
    }
  }

  function countErrors() {
    if (!showErrors.value) return

    let currentErrors = 0
    for (let row = 0; row < rows.value; row++) {
      for (let col = 0; col < cols.value; col++) {
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
    for (let row = 0; row < rows.value; row++) {
      for (let col = 0; col < cols.value; col++) {
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
    if (!TectonicValidator.isComplete(grid.value, solution.value)) return

    isCompleted.value = true
    if (timerInterval !== null) {
      clearInterval(timerInterval)
    }

    TectonicStatsManager.saveGameStats(
      difficulty.value,
      elapsedTime.value,
      errorsCount.value,
      hintsUsed.value,
      totalPauseTime.value
    )
  }

  // Obtenir un indice (révéler une cellule aléatoire)
  function getHint() {
    if (isCompleted.value) return

    const emptyCells: Position[] = []
    for (let row = 0; row < rows.value; row++) {
      for (let col = 0; col < cols.value; col++) {
        const cell = grid.value[row]![col]!
        if (!cell.isInitial && cell.value === null) {
          emptyCells.push({ row, col })
        }
      }
    }

    if (emptyCells.length === 0) return

    const randomIndex = Math.floor(Math.random() * emptyCells.length)
    const { row, col } = emptyCells[randomIndex]!
    grid.value[row]![col]!.value = solution.value[row]![col]!

    hintsUsed.value++
    updateErrors()
    checkCompletion()
    saveGame()
  }

  // Sauvegarder
  function saveGame() {
    const state = {
      grid: grid.value,
      solution: solution.value,
      regionGrid: regionGrid.value,
      maxRegionSize: maxRegionSize.value,
      difficulty: difficulty.value,
      rows: rows.value,
      cols: cols.value,
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
      solution.value = state.solution
      regionGrid.value = state.regionGrid
      maxRegionSize.value = state.maxRegionSize
      difficulty.value = state.difficulty
      rows.value = state.rows
      cols.value = state.cols
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
      console.error('Erreur lors du chargement de la partie Tectonic:', error)
      return false
    }
  }

  // Réinitialiser
  function resetGame() {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
    }
    grid.value = []
    solution.value = []
    regionGrid.value = []
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
    regionGrid,
    maxRegionSize,
    difficulty,
    rows,
    cols,
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
    handleNumberInput,
    clearSelectedCell,
    updateErrors,
    getHint,
    saveGame,
    loadGame,
    resetGame
  }
})
