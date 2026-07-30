import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RikudoGrid, RikudoCoord, DiamondLink, RikudoCell } from '@/contexts/rikudo/types/rikudo'
import { RikudoDifficulty } from '@/contexts/rikudo/types/rikudo'
import { RikudoGenerator } from '@/contexts/rikudo/utils/rikudoGenerator'
import { RikudoValidator } from '@/contexts/rikudo/utils/rikudoValidator'
import { RikudoStatsManager } from '@/contexts/rikudo/utils/rikudoStatsManager'
import { hexCoordsInRadius, isHole, coordsEqual } from '@/contexts/rikudo/utils/rikudoGeometry'

const STORAGE_KEY = 'rikudo-game-state'

export const useRikudoStore = defineStore('rikudo', () => {
  // État
  const grid = ref<RikudoGrid>([])
  const solution = ref<RikudoCoord[]>([])
  const diamondLinks = ref<DiamondLink[]>([])
  const radius = ref(2)
  const difficulty = ref<RikudoDifficulty>(RikudoDifficulty.FACILE)
  const startTime = ref<number>(0)
  const elapsedTime = ref<number>(0)
  const isCompleted = ref(false)
  const isPaused = ref(false)
  const hintsUsed = ref(0)
  const selectedCoord = ref<RikudoCoord | null>(null)
  const pendingInput = ref('')
  const showErrors = ref(true)
  const errorsCount = ref(0)
  const totalPauseTime = ref(0)
  const lastPauseStart = ref<number | null>(null)

  // Timer
  let timerInterval: number | null = null
  let errorCountTimeout: number | null = null

  // Computed
  const maxValue = computed(() => solution.value.length)

  const formattedTime = computed(() => {
    const totalSeconds = Math.floor(elapsedTime.value / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  const progress = computed(() => {
    let filled = 0
    let total = 0
    for (const cell of grid.value) {
      if (cell.isHole || cell.isInitial) continue
      total++
      if (cell.value !== null) filled++
    }
    return total > 0 ? (filled / total) * 100 : 0
  })

  function findCell(coord: RikudoCoord): RikudoCell | undefined {
    return grid.value.find((c) => coordsEqual(c.coord, coord))
  }

  // Construit la grille de jeu à partir du chemin solution généré
  function buildGrid(path: RikudoCoord[], gridRadius: number): RikudoGrid {
    const cells: RikudoGrid = []
    for (const coord of hexCoordsInRadius(gridRadius)) {
      if (isHole(coord)) {
        cells.push({ value: null, coord, isInitial: false, isHole: true, isError: false, isHighlighted: false })
        continue
      }

      const index = path.findIndex((c) => coordsEqual(c, coord))
      const isEndpoint = index === 0 || index === path.length - 1
      cells.push({
        value: isEndpoint ? index + 1 : null,
        coord,
        isInitial: isEndpoint,
        isHole: false,
        isError: false,
        isHighlighted: false
      })
    }
    return cells
  }

  // Démarrer une nouvelle partie
  function newGame(newDifficulty: RikudoDifficulty) {
    difficulty.value = newDifficulty
    const config = RikudoGenerator.getDifficultyConfig(newDifficulty)
    radius.value = config.radius

    const generator = new RikudoGenerator(newDifficulty)
    const result = generator.generate()

    solution.value = result.path
    diamondLinks.value = result.diamondLinks
    grid.value = buildGrid(result.path, result.radius)

    startTime.value = Date.now()
    elapsedTime.value = 0
    isCompleted.value = false
    isPaused.value = false
    hintsUsed.value = 0
    selectedCoord.value = null
    pendingInput.value = ''
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

  // Sélectionner une case (case initiale et trou non sélectionnables)
  function selectCell(coord: RikudoCoord) {
    if (isCompleted.value || isPaused.value) return
    const cell = findCell(coord)
    if (!cell || cell.isHole || cell.isInitial) return

    selectedCoord.value = coord
    pendingInput.value = ''
  }

  // Saisir un chiffre dans la case sélectionnée (accumulation jusqu'à 2 chiffres,
  // un 3e chiffre recommence une nouvelle saisie)
  function handleDigitInput(digit: number) {
    if (isCompleted.value || isPaused.value || !selectedCoord.value) return
    const cell = findCell(selectedCoord.value)
    if (!cell || cell.isInitial) return

    const next = pendingInput.value.length >= 2 ? digit.toString() : pendingInput.value + digit.toString()
    const nextNum = parseInt(next, 10)
    if (nextNum === 0) return

    pendingInput.value = next
    cell.value = nextNum

    updateErrors()
    checkCompletion()
    saveGame()
  }

  // Effacer la cellule sélectionnée
  function clearSelectedCell() {
    if (!selectedCoord.value) return
    const cell = findCell(selectedCoord.value)
    if (!cell || cell.isInitial) return

    cell.value = null
    pendingInput.value = ''
    updateErrors()
    saveGame()
  }

  // Mettre à jour les erreurs visuelles (affichage différé pour ne pas gêner la saisie)
  function updateErrorsDisplay() {
    if (!showErrors.value) {
      for (const cell of grid.value) cell.isError = false
      return
    }

    for (const cell of grid.value) {
      if (cell.isHole || cell.value === null) {
        cell.isError = false
        continue
      }
      const outOfRange = cell.value < 1 || cell.value > maxValue.value
      cell.isError = outOfRange || !RikudoValidator.isValidMove(grid.value, diamondLinks.value, cell.coord, cell.value)
    }
  }

  function countErrors() {
    if (!showErrors.value) return

    let currentErrors = 0
    for (const cell of grid.value) {
      if (cell.isError) currentErrors++
    }

    if (currentErrors > errorsCount.value) {
      errorsCount.value = currentErrors
    }
  }

  function clearErrorsDisplay() {
    for (const cell of grid.value) cell.isError = false
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
    if (!RikudoValidator.isComplete(grid.value, solution.value)) return

    isCompleted.value = true
    if (timerInterval !== null) {
      clearInterval(timerInterval)
    }

    RikudoStatsManager.saveGameStats(difficulty.value, elapsedTime.value, errorsCount.value, hintsUsed.value, totalPauseTime.value)
  }

  // Obtenir un indice (révéler une case aléatoire)
  function getHint() {
    if (isCompleted.value) return

    const emptyCells = grid.value.filter((cell) => !cell.isHole && !cell.isInitial && cell.value === null)
    if (emptyCells.length === 0) return

    const randomIndex = Math.floor(Math.random() * emptyCells.length)
    const cell = emptyCells[randomIndex]!
    const solutionIndex = solution.value.findIndex((c) => coordsEqual(c, cell.coord))
    cell.value = solutionIndex + 1

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
      diamondLinks: diamondLinks.value,
      radius: radius.value,
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

  // Charger
  function loadGame() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return false

    try {
      const state = JSON.parse(saved)
      grid.value = state.grid
      solution.value = state.solution
      diamondLinks.value = state.diamondLinks
      radius.value = state.radius
      difficulty.value = state.difficulty
      startTime.value = Date.now() - state.elapsedTime
      elapsedTime.value = state.elapsedTime
      isCompleted.value = state.isCompleted
      hintsUsed.value = state.hintsUsed
      errorsCount.value = state.errorsCount || 0
      totalPauseTime.value = state.totalPauseTime || 0
      isPaused.value = false
      selectedCoord.value = null
      pendingInput.value = ''

      if (!isCompleted.value) {
        startTimer()
      }

      return true
    } catch (error) {
      console.error('Erreur lors du chargement de la partie Rikudo:', error)
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
    diamondLinks.value = []
    startTime.value = 0
    elapsedTime.value = 0
    isCompleted.value = false
    isPaused.value = false
    hintsUsed.value = 0
    selectedCoord.value = null
    pendingInput.value = ''
    errorsCount.value = 0
    totalPauseTime.value = 0
    lastPauseStart.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    // État
    grid,
    solution,
    diamondLinks,
    radius,
    difficulty,
    startTime,
    elapsedTime,
    isCompleted,
    isPaused,
    hintsUsed,
    selectedCoord,
    pendingInput,
    showErrors,
    errorsCount,
    totalPauseTime,

    // Computed
    maxValue,
    formattedTime,
    progress,

    // Actions
    newGame,
    pauseGame,
    resumeGame,
    selectCell,
    handleDigitInput,
    clearSelectedCell,
    updateErrors,
    getHint,
    saveGame,
    loadGame,
    resetGame
  }
})
