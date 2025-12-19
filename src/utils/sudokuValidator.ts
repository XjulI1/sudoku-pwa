import type { Grid, Position } from '@/types/sudoku'
import { GridSize } from '@/types/sudoku'

export class SudokuValidator {
  /**
   * Calcule les dimensions de la région en fonction de la taille de la grille
   */
  private static getRegionDimensions(size: number): { rows: number; cols: number } {
    if (size === GridSize.SIX) {
      return { rows: 2, cols: 3 }
    }
    return { rows: 3, cols: 3 }
  }

  /**
   * Vérifie si un nombre est valide à une position donnée
   */
  static isValidMove(grid: Grid, row: number, col: number, num: number): boolean {
    const size = grid.length
    const { rows: regionRows, cols: regionCols } = this.getRegionDimensions(size)

    // Vérifier la ligne
    for (let x = 0; x < size; x++) {
      if (x !== col && grid[row]![x]!.value === num) {
        return false
      }
    }

    // Vérifier la colonne
    for (let x = 0; x < size; x++) {
      if (x !== row && grid[x]![col]!.value === num) {
        return false
      }
    }

    // Vérifier la région
    const startRow = row - (row % regionRows)
    const startCol = col - (col % regionCols)
    for (let i = 0; i < regionRows; i++) {
      for (let j = 0; j < regionCols; j++) {
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
    const size = grid.length
    const { rows: regionRows, cols: regionCols } = this.getRegionDimensions(size)

    if (cellValue === null) return conflicts

    // Vérifier la ligne
    for (let x = 0; x < size; x++) {
      if (x !== col && grid[row]![x]!.value === cellValue) {
        conflicts.push({ row, col: x })
      }
    }

    // Vérifier la colonne
    for (let x = 0; x < size; x++) {
      if (x !== row && grid[x]![col]!.value === cellValue) {
        conflicts.push({ row: x, col })
      }
    }

    // Vérifier la région
    const startRow = row - (row % regionRows)
    const startCol = col - (col % regionCols)
    for (let i = 0; i < regionRows; i++) {
      for (let j = 0; j < regionCols; j++) {
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
    const size = grid.length
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
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
    const size = grid.length
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
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
    const size = grid.length
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row]![col]!.isError) {
          errors++
        }
      }
    }
    return errors
  }
}
