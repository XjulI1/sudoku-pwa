import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  Direction,
  Game2048GridSize,
  Game2048Status,
  type Game2048Grid,
  type Tile,
} from '@/contexts/game2048/types/game2048'
import { Game2048StatsManager } from '@/contexts/game2048/utils/game2048StatsManager'

const STORAGE_KEY = 'game2048-state'
const BEST_SCORE_KEY = 'game2048-best-score'

let nextTileId = 1

function getTargetTile(gridSize: Game2048GridSize): number {
  switch (gridSize) {
    case Game2048GridSize.THREE:
      return 512
    case Game2048GridSize.FOUR:
      return 2048
    case Game2048GridSize.FIVE:
      return 4096
  }
}

export const useGame2048Store = defineStore('game2048', () => {
  // État
  const grid = ref<Game2048Grid>([])
  const gridSize = ref<Game2048GridSize>(Game2048GridSize.FOUR)
  const score = ref(0)
  const bestScore = ref(0)
  const gameStatus = ref<Game2048Status>(Game2048Status.PLAYING)
  const startTime = ref(0)
  const elapsedTime = ref(0)
  const isPaused = ref(false)
  const highestTile = ref(0)
  const totalPauseTime = ref(0)
  const lastPauseStart = ref<number | null>(null)
  const lastMoveScore = ref(0)
  const hasSavedGameStats = ref(false)

  // Timer
  let timerInterval: number | null = null

  // Computed
  const formattedTime = computed(() => {
    const totalSeconds = Math.floor(elapsedTime.value / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  const isCompleted = computed(() => gameStatus.value === Game2048Status.WON)
  const isGameOver = computed(() => gameStatus.value === Game2048Status.LOST)
  const isPlaying = computed(
    () =>
      gameStatus.value === Game2048Status.PLAYING ||
      gameStatus.value === Game2048Status.CONTINUE,
  )

  const targetTile = computed(() => getTargetTile(gridSize.value))

  const progress = computed(() => {
    if (highestTile.value <= 2) return 0
    const target = targetTile.value
    const log2Target = Math.log2(target)
    const log2Current = Math.log2(highestTile.value)
    return Math.min(100, (log2Current / log2Target) * 100)
  })

  // Créer une grille vide
  function createEmptyGrid(size: number): Game2048Grid {
    const newGrid: Game2048Grid = []
    for (let r = 0; r < size; r++) {
      const row: (Tile | null)[] = []
      for (let c = 0; c < size; c++) {
        row.push(null)
      }
      newGrid.push(row)
    }
    return newGrid
  }

  // Trouver les cellules vides
  function getEmptyCells(): { row: number; col: number }[] {
    const empty: { row: number; col: number }[] = []
    const size = gridSize.value as number
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid.value[r]![c]) {
          empty.push({ row: r, col: c })
        }
      }
    }
    return empty
  }

  // Ajouter une tuile aléatoire
  function addRandomTile(): void {
    const emptyCells = getEmptyCells()
    if (emptyCells.length === 0) return

    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)]!
    const value = Math.random() < 0.9 ? 2 : 4
    const tile: Tile = {
      id: nextTileId++,
      value,
      row: cell.row,
      col: cell.col,
      isNew: true,
    }
    grid.value[cell.row]![cell.col] = tile
  }

  // Nettoyer les flags d'animation
  function clearAnimationFlags(): void {
    const size = gridSize.value as number
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const tile = grid.value[r]![c]
        if (tile) {
          tile.isNew = false
          tile.mergedFrom = false
        }
      }
    }
  }

  // Extraire une ligne/colonne
  function getLine(direction: Direction, index: number): (Tile | null)[] {
    const size = gridSize.value as number
    const line: (Tile | null)[] = []

    for (let i = 0; i < size; i++) {
      switch (direction) {
        case Direction.LEFT:
          line.push(grid.value[index]![i]!)
          break
        case Direction.RIGHT:
          line.push(grid.value[index]![size - 1 - i]!)
          break
        case Direction.UP:
          line.push(grid.value[i]![index]!)
          break
        case Direction.DOWN:
          line.push(grid.value[size - 1 - i]![index]!)
          break
      }
    }

    return line
  }

  // Replacer une ligne/colonne dans la grille
  function setLine(direction: Direction, index: number, line: (Tile | null)[]): void {
    const size = gridSize.value as number

    for (let i = 0; i < size; i++) {
      let r: number, c: number
      switch (direction) {
        case Direction.LEFT:
          r = index
          c = i
          break
        case Direction.RIGHT:
          r = index
          c = size - 1 - i
          break
        case Direction.UP:
          r = i
          c = index
          break
        case Direction.DOWN:
          r = size - 1 - i
          c = index
          break
      }

      const tile = line[i] ?? null
      if (tile) {
        tile.row = r
        tile.col = c
      }
      grid.value[r]![c] = tile
    }
  }

  // Compresser et fusionner une ligne
  function slideLine(line: (Tile | null)[]): { newLine: (Tile | null)[]; points: number; moved: boolean } {
    const size = gridSize.value as number
    // Retirer les vides
    const tiles = line.filter((t): t is Tile => t !== null)
    const newLine: (Tile | null)[] = []
    let points = 0
    let moved = false

    let i = 0
    while (i < tiles.length) {
      if (i + 1 < tiles.length && tiles[i]!.value === tiles[i + 1]!.value) {
        // Fusion
        const mergedValue = tiles[i]!.value * 2
        const mergedTile: Tile = {
          id: nextTileId++,
          value: mergedValue,
          row: 0,
          col: 0,
          mergedFrom: true,
        }
        newLine.push(mergedTile)
        points += mergedValue
        i += 2
      } else {
        newLine.push(tiles[i]!)
        i++
      }
    }

    // Remplir le reste avec des null
    while (newLine.length < size) {
      newLine.push(null)
    }

    // Vérifier si quelque chose a bougé
    for (let j = 0; j < size; j++) {
      const oldTile = line[j]
      const newTile = newLine[j]
      if (oldTile?.value !== newTile?.value) {
        moved = true
        break
      }
    }

    return { newLine, points, moved }
  }

  // Mouvement dans une direction
  function move(direction: Direction): boolean {
    if (!isPlaying.value || isPaused.value) return false

    clearAnimationFlags()

    const size = gridSize.value as number
    let totalPoints = 0
    let anyMoved = false

    for (let i = 0; i < size; i++) {
      const line = getLine(direction, i)
      const { newLine, points, moved } = slideLine(line)
      if (moved) {
        anyMoved = true
        setLine(direction, i, newLine)
      }
      totalPoints += points
    }

    if (anyMoved) {
      score.value += totalPoints
      lastMoveScore.value = totalPoints

      // Mettre à jour best score
      if (score.value > bestScore.value) {
        bestScore.value = score.value
        saveBestScore()
      }

      // Mettre à jour highest tile
      updateHighestTile()

      // Ajouter une nouvelle tuile
      addRandomTile()

      // Vérifier victoire
      if (
        gameStatus.value === Game2048Status.PLAYING &&
        highestTile.value >= targetTile.value
      ) {
        gameStatus.value = Game2048Status.WON
        stopTimer()

        if (!hasSavedGameStats.value) {
          hasSavedGameStats.value = true
          Game2048StatsManager.saveGameStats(
            gridSize.value,
            score.value,
            highestTile.value,
            elapsedTime.value,
            true,
            totalPauseTime.value,
          )
        }
      }

      // Vérifier game over
      if (!canMove()) {
        if (gameStatus.value !== Game2048Status.WON) {
          gameStatus.value = Game2048Status.LOST
          stopTimer()

          // hasSavedGameStats est déjà vrai si la partie a été gagnée avant d'être
          // poursuivie via continueGame() — on ne veut pas la recompter comme perdue.
          if (!hasSavedGameStats.value) {
            hasSavedGameStats.value = true
            Game2048StatsManager.saveGameStats(
              gridSize.value,
              score.value,
              highestTile.value,
              elapsedTime.value,
              false,
              totalPauseTime.value,
            )
          }
        }
      }

      saveGame()
    }

    return anyMoved
  }

  // Mettre à jour la tuile la plus haute
  function updateHighestTile(): void {
    const size = gridSize.value as number
    let max = 0
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const tile = grid.value[r]![c]
        if (tile && tile.value > max) {
          max = tile.value
        }
      }
    }
    highestTile.value = max
  }

  // Vérifier s'il reste des mouvements possibles
  function canMove(): boolean {
    const size = gridSize.value as number

    // S'il y a des cellules vides
    if (getEmptyCells().length > 0) return true

    // Vérifier les fusions possibles
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const tile = grid.value[r]![c]
        if (!tile) continue

        // Vérifier à droite
        if (c + 1 < size) {
          const right = grid.value[r]![c + 1]
          if (right && right.value === tile.value) return true
        }

        // Vérifier en bas
        if (r + 1 < size) {
          const below = grid.value[r + 1]![c]
          if (below && below.value === tile.value) return true
        }
      }
    }

    return false
  }

  // Continuer après avoir gagné
  function continueGame(): void {
    gameStatus.value = Game2048Status.CONTINUE
    startTimer()
  }

  // Nouveau jeu
  function newGame(newGridSize: Game2048GridSize): void {
    stopTimer()
    gridSize.value = newGridSize
    grid.value = createEmptyGrid(newGridSize as number)
    score.value = 0
    gameStatus.value = Game2048Status.PLAYING
    startTime.value = Date.now()
    elapsedTime.value = 0
    isPaused.value = false
    highestTile.value = 0
    totalPauseTime.value = 0
    lastPauseStart.value = null
    lastMoveScore.value = 0
    hasSavedGameStats.value = false
    nextTileId = 1

    // Charger le meilleur score
    loadBestScore()

    // Ajouter 2 tuiles initiales
    addRandomTile()
    addRandomTile()

    // Nettoyer les flags isNew pour les tuiles initiales (pas d'animation au démarrage)
    clearAnimationFlags()

    updateHighestTile()
    startTimer()
    saveGame()
  }

  // Timer
  function startTimer(): void {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
    }
    timerInterval = window.setInterval(() => {
      if (!isPaused.value && isPlaying.value) {
        elapsedTime.value = Date.now() - startTime.value
      }
    }, 100)
  }

  function stopTimer(): void {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function pauseGame(): void {
    isPaused.value = true
    lastPauseStart.value = Date.now()
  }

  function resumeGame(): void {
    isPaused.value = false
    if (lastPauseStart.value !== null) {
      totalPauseTime.value += Date.now() - lastPauseStart.value
      lastPauseStart.value = null
    }
    startTime.value = Date.now() - elapsedTime.value
  }

  // Sauvegarde du meilleur score
  function saveBestScore(): void {
    const key = `${BEST_SCORE_KEY}-${gridSize.value}`
    localStorage.setItem(key, String(bestScore.value))
  }

  function loadBestScore(): void {
    const key = `${BEST_SCORE_KEY}-${gridSize.value}`
    const saved = localStorage.getItem(key)
    bestScore.value = saved ? parseInt(saved, 10) : 0
  }

  // Sauvegarder la partie
  function saveGame(): void {
    const size = gridSize.value as number
    const serializedGrid: ({ id: number; value: number; row: number; col: number } | null)[][] = []
    for (let r = 0; r < size; r++) {
      const row: ({ id: number; value: number; row: number; col: number } | null)[] = []
      for (let c = 0; c < size; c++) {
        const tile = grid.value[r]![c]
        if (tile) {
          row.push({ id: tile.id, value: tile.value, row: tile.row, col: tile.col })
        } else {
          row.push(null)
        }
      }
      serializedGrid.push(row)
    }

    const state = {
      grid: serializedGrid,
      gridSize: gridSize.value,
      score: score.value,
      bestScore: bestScore.value,
      gameStatus: gameStatus.value,
      startTime: startTime.value,
      elapsedTime: elapsedTime.value,
      highestTile: highestTile.value,
      totalPauseTime: totalPauseTime.value,
      hasSavedGameStats: hasSavedGameStats.value,
      nextTileId,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  // Charger la partie
  function loadGame(): boolean {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return false

    try {
      const state = JSON.parse(saved)
      gridSize.value = state.gridSize
      score.value = state.score
      bestScore.value = state.bestScore
      gameStatus.value = state.gameStatus
      startTime.value = Date.now() - state.elapsedTime
      elapsedTime.value = state.elapsedTime
      highestTile.value = state.highestTile
      totalPauseTime.value = state.totalPauseTime || 0
      hasSavedGameStats.value = state.hasSavedGameStats ?? false
      nextTileId = state.nextTileId || 1
      isPaused.value = false
      lastPauseStart.value = null
      lastMoveScore.value = 0

      // Restaurer la grille
      const size = state.gridSize as number
      grid.value = createEmptyGrid(size)
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const saved = state.grid[r]?.[c]
          if (saved) {
            grid.value[r]![c] = {
              id: saved.id,
              value: saved.value,
              row: saved.row,
              col: saved.col,
              isNew: false,
              mergedFrom: false,
            }
          }
        }
      }

      if (isPlaying.value) {
        startTimer()
      }

      return true
    } catch (error) {
      console.error('Erreur lors du chargement de la partie 2048:', error)
      return false
    }
  }

  // Réinitialiser
  function resetGame(): void {
    stopTimer()
    grid.value = []
    score.value = 0
    gameStatus.value = Game2048Status.PLAYING
    startTime.value = 0
    elapsedTime.value = 0
    isPaused.value = false
    highestTile.value = 0
    totalPauseTime.value = 0
    lastPauseStart.value = null
    lastMoveScore.value = 0
    hasSavedGameStats.value = false
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    // État
    grid,
    gridSize,
    score,
    bestScore,
    gameStatus,
    startTime,
    elapsedTime,
    isPaused,
    highestTile,
    totalPauseTime,
    lastMoveScore,

    // Computed
    formattedTime,
    isCompleted,
    isGameOver,
    isPlaying,
    targetTile,
    progress,

    // Actions
    newGame,
    move,
    continueGame,
    pauseGame,
    resumeGame,
    saveGame,
    loadGame,
    resetGame,
  }
})
