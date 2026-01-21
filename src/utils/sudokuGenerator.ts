import { Difficulty, GridSize } from '@/types/sudoku'

export class SudokuGenerator {
  private grid: number[][] = []
  private size: number = 9
  private regionRows: number = 3
  private regionCols: number = 3

  constructor(gridSize: GridSize = GridSize.NINE) {
    this.size = gridSize
    if (gridSize === GridSize.SIX) {
      this.regionRows = 2
      this.regionCols = 3
    } else {
      this.regionRows = 3
      this.regionCols = 3
    }
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0))
  }

  /**
   * Génère une grille de Sudoku complète
   */
  private generateComplete(): number[][] {
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0))
    this.fillGrid()
    return this.grid.map((row) => [...row])
  }

  /**
   * Remplit la grille de manière récursive avec backtracking
   */
  private fillGrid(): boolean {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.grid[row]![col] === 0) {
          const numbers = this.shuffleArray(
            Array.from({ length: this.size }, (_, i) => i + 1)
          )
          for (const num of numbers) {
            if (this.isValid(row, col, num)) {
              this.grid[row]![col] = num
              if (this.fillGrid()) {
                return true
              }
              this.grid[row]![col] = 0
            }
          }
          return false
        }
      }
    }
    return true
  }

  /**
   * Vérifie si un nombre peut être placé à une position donnée
   */
  private isValid(row: number, col: number, num: number): boolean {
    // Vérifier la ligne
    for (let x = 0; x < this.size; x++) {
      if (this.grid[row]![x] === num) return false
    }

    // Vérifier la colonne
    for (let x = 0; x < this.size; x++) {
      if (this.grid[x]![col] === num) return false
    }

    // Vérifier la région
    const startRow = row - (row % this.regionRows)
    const startCol = col - (col % this.regionCols)
    for (let i = 0; i < this.regionRows; i++) {
      for (let j = 0; j < this.regionCols; j++) {
        if (this.grid[i + startRow]![j + startCol] === num) return false
      }
    }

    return true
  }

  /**
   * Mélange un tableau (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
    }
    return shuffled
  }

  /**
   * Retire des cellules de la grille selon la difficulté
   */
  private removeNumbers(grid: number[][], difficulty: Difficulty): number[][] {
    const cellsToRemove = this.getCellsToRemove(difficulty)
    const puzzle = grid.map((row) => [...row])
    const totalCells = this.size * this.size
    const positions = this.shuffleArray(
      Array.from({ length: totalCells }, (_, i) => ({
        row: Math.floor(i / this.size),
        col: i % this.size
      }))
    )

    let removed = 0
    for (const { row, col } of positions) {
      if (removed >= cellsToRemove) break

      const backup = puzzle[row]![col]!
      puzzle[row]![col] = 0

      // Vérifier que la grille a toujours une solution unique
      const tempGrid = puzzle.map((r) => [...r])
      if (this.hasUniqueSolution(tempGrid)) {
        removed++
      } else {
        puzzle[row]![col] = backup
      }
    }

    return puzzle
  }

  /**
   * Retourne le nombre de cellules à retirer selon la difficulté
   */
  private getCellsToRemove(difficulty: Difficulty): number {
    if (this.size === 6) {
      // Pour grille 6x6 (36 cellules)
      switch (difficulty) {
        case Difficulty.SIMPLE:
          return 15 // ~42% rempli
        case Difficulty.NORMAL:
          return 20 // ~44% rempli
        case Difficulty.EXPERT:
          return 23 // ~36% rempli
        case Difficulty.MAITRE:
          return 26 // ~28% rempli
        case Difficulty.DIEUX_SUDOKU:
          return 28 // ~22% rempli
        default:
          return 18
      }
    } else {
      // Pour grille 9x9 (81 cellules)
      switch (difficulty) {
        case Difficulty.SIMPLE:
          return 35 // ~43% rempli
        case Difficulty.NORMAL:
          return 45 // ~44% rempli
        case Difficulty.EXPERT:
          return 52 // ~36% rempli
        case Difficulty.MAITRE:
          return 58 // ~28% rempli
        case Difficulty.DIEUX_SUDOKU:
          return 64 // ~21% rempli
        default:
          return 40
      }
    }
  }

  /**
   * Vérifie si la grille a une solution unique
   */
  private hasUniqueSolution(grid: number[][]): boolean {
    const solutions: number[][][] = []
    const tempGrid = grid.map((row) => [...row])
    this.countSolutions(tempGrid, solutions, 2)
    return solutions.length === 1
  }

  /**
   * Compte le nombre de solutions (s'arrête à maxSolutions)
   */
  private countSolutions(grid: number[][], solutions: number[][][], maxSolutions: number): void {
    if (solutions.length >= maxSolutions) return

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (grid[row]![col] === 0) {
          for (let num = 1; num <= this.size; num++) {
            if (this.isValidInGrid(grid, row, col, num)) {
              grid[row]![col] = num
              this.countSolutions(grid, solutions, maxSolutions)
              grid[row]![col] = 0
            }
          }
          return
        }
      }
    }

    // Grille complète trouvée
    solutions.push(grid.map((row) => [...row]))
  }

  /**
   * Vérifie si un nombre est valide dans une grille donnée
   */
  private isValidInGrid(grid: number[][], row: number, col: number, num: number): boolean {
    // Vérifier la ligne
    for (let x = 0; x < this.size; x++) {
      if (grid[row]![x] === num) return false
    }

    // Vérifier la colonne
    for (let x = 0; x < this.size; x++) {
      if (grid[x]![col] === num) return false
    }

    // Vérifier la région
    const startRow = row - (row % this.regionRows)
    const startCol = col - (col % this.regionCols)
    for (let i = 0; i < this.regionRows; i++) {
      for (let j = 0; j < this.regionCols; j++) {
        if (grid[i + startRow]![j + startCol] === num) return false
      }
    }

    return true
  }

  /**
   * Génère une nouvelle grille de Sudoku avec la difficulté spécifiée
   */
  public generate(difficulty: Difficulty): { puzzle: number[][]; solution: number[][] } {
    const solution = this.generateComplete()
    const puzzle = this.removeNumbers(solution, difficulty)
    return { puzzle, solution }
  }
}
