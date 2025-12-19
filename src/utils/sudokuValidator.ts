import type { Grid, Position } from '@/types/sudoku'

export class SudokuValidator {
  /**
   * Vérifie si un nombre est valide à une position donnée
   */
  static isValidMove(grid: Grid, row: number, col: number, num: number): boolean {
    // Vérifier la ligne
    for (let x = 0; x < 9; x++) {
      if (x !== col && grid[row]![x]!.value === num) {
        return false
      }
    }

    // Vérifier la colonne
    for (let x = 0; x < 9; x++) {
      if (x !== row && grid[x]![col]!.value === num) {
        return false
      }
    }

    // Vérifier le carré 3x3
    const startRow = row - (row % 3)
    const startCol = col - (col % 3)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const r = i + startRow
        const c = j + startCol
        if ((r !== row || c !== col) && grid[r]![c]!.value === num) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Retourne les positions en conflit avec une cellule donnée
   */
  static getConflicts(grid: Grid, row: number, col: number): Position[] {
    const conflicts: Position[] = []
    const cellValue = grid[row]![col]!.value

    if (cellValue === null) return conflicts

    // Vérifier la ligne
    for (let x = 0; x < 9; x++) {
      if (x !== col && grid[row]![x]!.value === cellValue) {
        conflicts.push({ row, col: x })
      }
    }

    // Vérifier la colonne
    for (let x = 0; x < 9; x++) {
      if (x !== row && grid[x]![col]!.value === cellValue) {
        conflicts.push({ row: x, col })
      }
    }

    // Vérifier le carré 3x3
    const startRow = row - (row % 3)
    const startCol = col - (col % 3)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const r = i + startRow
        const c = j + startCol
        if ((r !== row || c !== col) && grid[r]![c]!.value === cellValue) {
          if (!conflicts.some((p) => p.row === r && p.col === c)) {
            conflicts.push({ row: r, col: c })
          }
        }
      }
    }

    return conflicts
  }

  /**
   * Vérifie si la grille est complète et valide
   */
  static isComplete(grid: Grid, solution: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row]![col]!.value !== solution[row]![col]) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Vérifie si la grille est entièrement remplie
   */
  static isFilled(grid: Grid): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row]![col]!.value === null) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Compte le nombre d'erreurs dans la grille
   */
  static countErrors(grid: Grid): number {
    let errors = 0
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row]![col]!.isError) {
          errors++
        }
      }
    }
    return errors
  }
}
