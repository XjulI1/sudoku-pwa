import {
  MinesweeperCellState,
  MinesweeperDifficulty,
  type MinesweeperConfig,
  type MinesweeperGrid
} from '@/types/minesweeper'

// Configurations par difficulté
const DIFFICULTY_CONFIGS: Record<MinesweeperDifficulty, MinesweeperConfig> = {
  [MinesweeperDifficulty.BEGINNER]: { rows: 9, cols: 9, mines: 10 },
  [MinesweeperDifficulty.INTERMEDIATE]: { rows: 16, cols: 16, mines: 40 },
  [MinesweeperDifficulty.EXPERT]: { rows: 16, cols: 30, mines: 99 }
}

export class MinesweeperGenerator {
  /**
   * Retourne la configuration pour une difficulté donnée
   */
  static getConfig(difficulty: MinesweeperDifficulty): MinesweeperConfig {
    return { ...DIFFICULTY_CONFIGS[difficulty] }
  }

  /**
   * Crée une grille vide (sans mines)
   */
  static createEmptyGrid(config: MinesweeperConfig): MinesweeperGrid {
    return Array.from({ length: config.rows }, () =>
      Array.from({ length: config.cols }, () => ({
        isMine: false,
        state: MinesweeperCellState.HIDDEN,
        adjacentMines: 0,
        isHighlighted: false
      }))
    )
  }

  /**
   * Place les mines sur la grille en garantissant que la première cellule cliquée
   * et ses voisines sont sûres
   */
  static placeMines(
    grid: MinesweeperGrid,
    config: MinesweeperConfig,
    safeRow: number,
    safeCol: number
  ): void {
    const { rows, cols, mines } = config

    // Collecter les positions interdites (cellule cliquée + voisines)
    const forbidden = new Set<string>()
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = safeRow + dr
        const c = safeCol + dc
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          forbidden.add(`${r},${c}`)
        }
      }
    }

    let placed = 0
    while (placed < mines) {
      const r = Math.floor(Math.random() * rows)
      const c = Math.floor(Math.random() * cols)
      const key = `${r},${c}`

      if (!forbidden.has(key) && !grid[r]![c]!.isMine) {
        grid[r]![c]!.isMine = true
        placed++
      }
    }

    // Calculer les nombres adjacents
    MinesweeperGenerator.calculateAdjacentMines(grid, config)
  }

  /**
   * Calcule le nombre de mines adjacentes pour chaque cellule
   */
  private static calculateAdjacentMines(
    grid: MinesweeperGrid,
    config: MinesweeperConfig
  ): void {
    const { rows, cols } = config

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r]![c]!.isMine) continue

        let count = 0
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue
            const nr = r + dr
            const nc = c + dc
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr]![nc]!.isMine) {
              count++
            }
          }
        }
        grid[r]![c]!.adjacentMines = count
      }
    }
  }
}
