import { defineStore } from 'pinia'
import { ref, computed, triggerRef } from 'vue'
import {
  DedaleDifficulty,
  type DedaleCell,
  type DedaleGrid,
  type DedalePosition,
  type DedaleDirection
} from '@/types/dedale'
import { DedaleGenerator } from '@/utils/dedaleGenerator'
import { DedaleValidator, neighborInDirection, directionBetween, oppositeDirection } from '@/utils/dedaleValidator'
import { DedaleStatsManager } from '@/utils/dedaleStatsManager'

const STORAGE_KEY = 'dedale-game-state'

function positionsEqual(a: DedalePosition, b: DedalePosition): boolean {
  return a.row === b.row && a.col === b.col
}

export const useDedaleStore = defineStore('dedale', () => {
  // État
  const grid = ref<DedaleGrid>([])
  const rows = ref(0)
  const cols = ref(0)
  const pairs = ref<[DedalePosition, DedalePosition][]>([])
  const solutionPaths = ref<DedalePosition[][]>([])
  const difficulty = ref<DedaleDifficulty>(DedaleDifficulty.MOYEN)
  const startTime = ref(0)
  const elapsedTime = ref(0)
  const isCompleted = ref(false)
  const isPaused = ref(false)
  const hintsUsed = ref(0)
  const retractionsCount = ref(0)
  const activePairIndex = ref<number | null>(null)
  const activeFrontier = ref<DedalePosition | null>(null)
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
    const total = rows.value * cols.value
    if (total === 0) return 0
    let filled = 0
    for (const row of grid.value) {
      for (const cell of row) {
        if (cell.connections.length > 0) filled++
      }
    }
    return (filled / total) * 100
  })

  // Initialisation de la grille vide
  function createEmptyGrid(rowsCount: number, colsCount: number): DedaleGrid {
    return Array.from({ length: rowsCount }, () =>
      Array.from({ length: colsCount }, () => ({
        letter: null,
        pairIndex: null,
        isEndpoint: false,
        connections: []
      }))
    )
  }

  // Démarre un nouveau jeu
  function newGame(newDifficulty: DedaleDifficulty) {
    difficulty.value = newDifficulty
    const generator = new DedaleGenerator()
    const puzzle = generator.generate(newDifficulty)

    rows.value = puzzle.rows
    cols.value = puzzle.cols
    pairs.value = puzzle.pairs
    solutionPaths.value = puzzle.solutionPaths

    const newGrid = createEmptyGrid(puzzle.rows, puzzle.cols)
    puzzle.pairs.forEach(([a, b], index) => {
      const letter = String.fromCharCode(65 + index)
      const cellA = newGrid[a.row]![a.col]!
      cellA.letter = letter
      cellA.pairIndex = index
      cellA.isEndpoint = true
      const cellB = newGrid[b.row]![b.col]!
      cellB.letter = letter
      cellB.pairIndex = index
      cellB.isEndpoint = true
    })
    grid.value = newGrid

    startTime.value = Date.now()
    elapsedTime.value = 0
    isCompleted.value = false
    isPaused.value = false
    hintsUsed.value = 0
    retractionsCount.value = 0
    activePairIndex.value = null
    activeFrontier.value = null
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

  // Une case est disponible pour que la paire active s'y étende : soit une case
  // libre jamais touchée, soit le point d'ancrage (non encore atteint) de cette paire
  function isAvailableForPair(cell: DedaleCell, pairIndex: number): boolean {
    return cell.pairIndex === null || (cell.pairIndex === pairIndex && cell.connections.length === 0)
  }

  // Retrouve l'extrémité ouverte (la "frontière") d'un tracé partiel, en
  // remontant la chaîne depuis le point d'ancrage déjà atteint
  function findChainTip(anchor: DedalePosition): DedalePosition {
    let current = anchor
    let previous: DedalePosition | null = null

    while (true) {
      const cell = grid.value[current.row]![current.col]!
      const next = cell.connections
        .map((dir) => neighborInDirection(current, dir))
        .find((pos) => !previous || !positionsEqual(pos, previous))

      if (!next) return current

      previous = current
      current = next
    }
  }

  // Sélectionne une paire comme paire active, en retrouvant sa frontière actuelle
  function selectPair(pairIndex: number, clickedEndpoint: DedalePosition) {
    const [a, b] = pairs.value[pairIndex]!

    if (DedaleValidator.isPairConnected(grid.value, a, b)) {
      resetPairCells(pairIndex)
      activePairIndex.value = pairIndex
      activeFrontier.value = clickedEndpoint
      triggerRef(grid)
      return
    }

    const cellA = grid.value[a.row]![a.col]!
    const cellB = grid.value[b.row]![b.col]!
    const untouched = cellA.connections.length === 0 && cellB.connections.length === 0

    activePairIndex.value = pairIndex
    if (untouched) {
      activeFrontier.value = clickedEndpoint
    } else {
      const anchor = cellA.connections.length > 0 ? a : b
      activeFrontier.value = findChainTip(anchor)
    }
  }

  // Réinitialise toutes les cases appartenant à une paire (conserve lettre/pairIndex des points d'ancrage)
  function resetPairCells(pairIndex: number) {
    for (let r = 0; r < rows.value; r++) {
      for (let c = 0; c < cols.value; c++) {
        const cell = grid.value[r]![c]!
        if (cell.pairIndex === pairIndex) {
          cell.connections = []
          if (!cell.isEndpoint) {
            cell.pairIndex = null
          }
        }
      }
    }
  }

  // Étend le tracé actif d'une case depuis la frontière vers une case adjacente
  function extendPath(pairIndex: number, frontier: DedalePosition, target: DedalePosition) {
    const dir = directionBetween(frontier, target)
    if (!dir) return
    const oppDir = oppositeDirection(dir)

    const frontierCell = grid.value[frontier.row]![frontier.col]!
    const targetCell = grid.value[target.row]![target.col]!

    frontierCell.connections = [...frontierCell.connections, dir]
    targetCell.connections = [...targetCell.connections, oppDir]
    targetCell.pairIndex = pairIndex

    activeFrontier.value = target

    const [a, b] = pairs.value[pairIndex]!
    if (DedaleValidator.isPairConnected(grid.value, a, b)) {
      activePairIndex.value = null
      activeFrontier.value = null
    }

    triggerRef(grid)
  }

  // Tronque le tracé actif jusqu'à une case donnée (gère la rétractation, y compris multi-cases)
  function truncatePath(keepPos: DedalePosition) {
    const frontier = activeFrontier.value
    if (!frontier || positionsEqual(keepPos, frontier)) return

    let current = frontier
    let previous: DedalePosition | null = null
    let removedAny = false

    while (!positionsEqual(current, keepPos)) {
      const cell = grid.value[current.row]![current.col]!
      const prevPos = cell.connections
        .map((dir) => neighborInDirection(current, dir))
        .find((pos) => !previous || !positionsEqual(pos, previous))

      if (!prevPos) break

      const prevCell = grid.value[prevPos.row]![prevPos.col]!
      const dirFromPrevToCurrent = directionBetween(prevPos, current)!
      prevCell.connections = prevCell.connections.filter((d) => d !== dirFromPrevToCurrent)

      cell.connections = []
      if (!cell.isEndpoint) {
        cell.pairIndex = null
      }

      removedAny = true
      previous = current
      current = prevPos
    }

    if (removedAny) {
      retractionsCount.value++
    }

    activeFrontier.value = keepPos
    triggerRef(grid)
  }

  // Point d'entrée unique pour interagir avec une case : gère aussi bien le clic
  // discret que le glisser continu (appelé une fois par case survolée)
  function interactCell(row: number, col: number) {
    if (isCompleted.value || isPaused.value) return
    if (row < 0 || row >= rows.value || col < 0 || col >= cols.value) return

    const cell = grid.value[row]![col]!
    const target: DedalePosition = { row, col }

    if (activePairIndex.value === null) {
      if (cell.isEndpoint) {
        selectPair(cell.pairIndex!, target)
        updateAfterChange()
      }
      return
    }

    const currentPairIndex = activePairIndex.value
    const frontier = activeFrontier.value!

    if (positionsEqual(target, frontier)) {
      return
    }

    if (cell.pairIndex === currentPairIndex && cell.connections.length > 0) {
      truncatePath(target)
      updateAfterChange()
      return
    }

    if (cell.isEndpoint && cell.pairIndex !== currentPairIndex) {
      selectPair(cell.pairIndex!, target)
      updateAfterChange()
      return
    }

    if (directionBetween(frontier, target) && isAvailableForPair(cell, currentPairIndex)) {
      extendPath(currentPairIndex, frontier, target)
      updateAfterChange()
    }
  }

  // Efface entièrement le tracé de la paire active
  function clearActivePath() {
    if (activePairIndex.value === null) return

    const pairIndex = activePairIndex.value
    const hasDrawnCells = grid.value.some((row) =>
      row.some((cell) => cell.pairIndex === pairIndex && cell.connections.length > 0)
    )

    resetPairCells(pairIndex)
    if (hasDrawnCells) {
      retractionsCount.value++
    }

    activePairIndex.value = null
    activeFrontier.value = null

    triggerRef(grid)
    updateAfterChange()
  }

  // Désélectionne la paire active sans effacer son tracé
  function deselectActivePair() {
    activePairIndex.value = null
    activeFrontier.value = null
  }

  // Déplace la frontière active dans une direction (support clavier) : étend si
  // la case est libre, rétracte si elle fait partie du tracé actif
  function moveActiveFrontier(dir: DedaleDirection) {
    if (activePairIndex.value === null || activeFrontier.value === null) return
    const target = neighborInDirection(activeFrontier.value, dir)
    interactCell(target.row, target.col)
  }

  // Vérifie si le jeu est terminé
  function checkCompletion() {
    if (DedaleValidator.isComplete(grid.value, pairs.value)) {
      isCompleted.value = true
      activePairIndex.value = null
      activeFrontier.value = null
      if (timerInterval !== null) {
        clearInterval(timerInterval)
      }

      DedaleStatsManager.saveGameStats(
        difficulty.value,
        elapsedTime.value,
        retractionsCount.value,
        hintsUsed.value,
        totalPauseTime.value
      )
    }
  }

  function updateAfterChange() {
    checkCompletion()
    saveGame()
  }

  // Obtient un indice : révèle entièrement le tracé d'une paire non terminée
  function getHint() {
    if (isCompleted.value) return

    const incompletePairIndices = pairs.value
      .map((_, index) => index)
      .filter((index) => {
        const [a, b] = pairs.value[index]!
        return !DedaleValidator.isPairConnected(grid.value, a, b)
      })

    if (incompletePairIndices.length === 0) return

    const pairIndex =
      incompletePairIndices[Math.floor(Math.random() * incompletePairIndices.length)]!

    resetPairCells(pairIndex)

    const solutionChain = solutionPaths.value[pairIndex]!
    for (let i = 0; i < solutionChain.length - 1; i++) {
      const from = solutionChain[i]!
      const to = solutionChain[i + 1]!
      const dir = directionBetween(from, to)!
      const oppDir = oppositeDirection(dir)
      const fromCell = grid.value[from.row]![from.col]!
      const toCell = grid.value[to.row]![to.col]!
      fromCell.connections = [...fromCell.connections, dir]
      toCell.connections = [...toCell.connections, oppDir]
      toCell.pairIndex = pairIndex
    }

    if (activePairIndex.value === pairIndex) {
      activePairIndex.value = null
      activeFrontier.value = null
    }

    hintsUsed.value++
    triggerRef(grid)
    updateAfterChange()
  }

  // Sauvegarder le jeu
  function saveGame() {
    const state = {
      grid: grid.value,
      rows: rows.value,
      cols: cols.value,
      pairs: pairs.value,
      solutionPaths: solutionPaths.value,
      difficulty: difficulty.value,
      startTime: startTime.value,
      elapsedTime: elapsedTime.value,
      isCompleted: isCompleted.value,
      hintsUsed: hintsUsed.value,
      retractionsCount: retractionsCount.value,
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
      rows.value = state.rows
      cols.value = state.cols
      pairs.value = state.pairs
      solutionPaths.value = state.solutionPaths
      difficulty.value = state.difficulty
      startTime.value = Date.now() - state.elapsedTime
      elapsedTime.value = state.elapsedTime
      isCompleted.value = state.isCompleted
      hintsUsed.value = state.hintsUsed
      retractionsCount.value = state.retractionsCount || 0
      totalPauseTime.value = state.totalPauseTime || 0
      isPaused.value = false
      activePairIndex.value = null
      activeFrontier.value = null

      if (!isCompleted.value) {
        startTimer()
      }

      return true
    } catch (error) {
      console.error('Erreur lors du chargement de la partie Dédale:', error)
      return false
    }
  }

  // Réinitialiser le jeu
  function resetGame() {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
    }
    grid.value = []
    rows.value = 0
    cols.value = 0
    pairs.value = []
    solutionPaths.value = []
    startTime.value = 0
    elapsedTime.value = 0
    isCompleted.value = false
    isPaused.value = false
    hintsUsed.value = 0
    retractionsCount.value = 0
    activePairIndex.value = null
    activeFrontier.value = null
    totalPauseTime.value = 0
    lastPauseStart.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    // État
    grid,
    rows,
    cols,
    pairs,
    difficulty,
    startTime,
    elapsedTime,
    isCompleted,
    isPaused,
    hintsUsed,
    retractionsCount,
    activePairIndex,
    activeFrontier,
    totalPauseTime,

    // Computed
    formattedTime,
    progress,

    // Actions
    newGame,
    pauseGame,
    resumeGame,
    interactCell,
    clearActivePath,
    deselectActivePair,
    moveActiveFrontier,
    getHint,
    saveGame,
    loadGame,
    resetGame
  }
})
