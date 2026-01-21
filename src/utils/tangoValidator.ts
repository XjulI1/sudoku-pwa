import {
  TangoSymbol,
  ConstraintType,
  ConstraintDirection,
  type TangoGrid,
  type TangoConstraint
} from '@/types/tango'

const GRID_SIZE = 6

export class TangoValidator {
  /**
   * Vérifie si un placement de symbole est valide dans la grille
   */
  static isValidMove(
    grid: TangoGrid,
    row: number,
    col: number,
    symbol: TangoSymbol,
    constraints: TangoConstraint[]
  ): boolean {
    // Vérifier la règle des 3 consécutifs horizontalement
    if (!this.checkNoThreeConsecutiveHorizontal(grid, row, col, symbol)) {
      return false
    }

    // Vérifier la règle des 3 consécutifs verticalement
    if (!this.checkNoThreeConsecutiveVertical(grid, row, col, symbol)) {
      return false
    }

    // Vérifier le nombre de symboles dans la ligne
    if (!this.checkRowCount(grid, row, col, symbol)) {
      return false
    }

    // Vérifier le nombre de symboles dans la colonne
    if (!this.checkColumnCount(grid, row, col, symbol)) {
      return false
    }

    // Vérifier les contraintes qui impliquent cette cellule
    if (!this.checkConstraints(grid, row, col, symbol, constraints)) {
      return false
    }

    return true
  }

  /**
   * Vérifie qu'il n'y a pas 3 symboles identiques consécutifs horizontalement
   */
  private static checkNoThreeConsecutiveHorizontal(
    grid: TangoGrid,
    row: number,
    col: number,
    symbol: TangoSymbol
  ): boolean {
    // Vérifier à gauche (cette cellule est la 3ème)
    if (col >= 2) {
      if (
        grid[row]![col - 1]?.value === symbol &&
        grid[row]![col - 2]?.value === symbol
      ) {
        return false
      }
    }

    // Vérifier au milieu (cette cellule est la 2ème)
    if (col >= 1 && col < GRID_SIZE - 1) {
      if (
        grid[row]![col - 1]?.value === symbol &&
        grid[row]![col + 1]?.value === symbol
      ) {
        return false
      }
    }

    // Vérifier à droite (cette cellule est la 1ère)
    if (col < GRID_SIZE - 2) {
      if (
        grid[row]![col + 1]?.value === symbol &&
        grid[row]![col + 2]?.value === symbol
      ) {
        return false
      }
    }

    return true
  }

  /**
   * Vérifie qu'il n'y a pas 3 symboles identiques consécutifs verticalement
   */
  private static checkNoThreeConsecutiveVertical(
    grid: TangoGrid,
    row: number,
    col: number,
    symbol: TangoSymbol
  ): boolean {
    // Vérifier en haut (cette cellule est la 3ème)
    if (row >= 2) {
      if (
        grid[row - 1]![col]?.value === symbol &&
        grid[row - 2]![col]?.value === symbol
      ) {
        return false
      }
    }

    // Vérifier au milieu (cette cellule est la 2ème)
    if (row >= 1 && row < GRID_SIZE - 1) {
      if (
        grid[row - 1]![col]?.value === symbol &&
        grid[row + 1]![col]?.value === symbol
      ) {
        return false
      }
    }

    // Vérifier en bas (cette cellule est la 1ère)
    if (row < GRID_SIZE - 2) {
      if (
        grid[row + 1]![col]?.value === symbol &&
        grid[row + 2]![col]?.value === symbol
      ) {
        return false
      }
    }

    return true
  }

  /**
   * Vérifie que la ligne n'a pas plus de 3 symboles identiques
   */
  private static checkRowCount(
    grid: TangoGrid,
    row: number,
    col: number,
    symbol: TangoSymbol
  ): boolean {
    let count = 1 // Compter le symbole qu'on veut placer

    for (let c = 0; c < GRID_SIZE; c++) {
      if (c !== col && grid[row]![c]?.value === symbol) {
        count++
      }
    }

    return count <= 3
  }

  /**
   * Vérifie que la colonne n'a pas plus de 3 symboles identiques
   */
  private static checkColumnCount(
    grid: TangoGrid,
    row: number,
    col: number,
    symbol: TangoSymbol
  ): boolean {
    let count = 1 // Compter le symbole qu'on veut placer

    for (let r = 0; r < GRID_SIZE; r++) {
      if (r !== row && grid[r]![col]?.value === symbol) {
        count++
      }
    }

    return count <= 3
  }

  /**
   * Vérifie que toutes les contraintes impliquant cette cellule sont respectées
   */
  private static checkConstraints(
    grid: TangoGrid,
    row: number,
    col: number,
    symbol: TangoSymbol,
    constraints: TangoConstraint[]
  ): boolean {
    for (const constraint of constraints) {
      // Contrainte horizontale partant de cette cellule
      if (
        constraint.row === row &&
        constraint.col === col &&
        constraint.direction === ConstraintDirection.HORIZONTAL
      ) {
        const rightCell = grid[row]![col + 1]
        if (rightCell && rightCell.value !== TangoSymbol.EMPTY) {
          if (constraint.type === ConstraintType.EQUALS) {
            if (symbol !== rightCell.value) return false
          } else {
            if (symbol === rightCell.value) return false
          }
        }
      }

      // Contrainte horizontale arrivant à cette cellule
      if (
        constraint.row === row &&
        constraint.col === col - 1 &&
        constraint.direction === ConstraintDirection.HORIZONTAL
      ) {
        const leftCell = grid[row]![col - 1]
        if (leftCell && leftCell.value !== TangoSymbol.EMPTY) {
          if (constraint.type === ConstraintType.EQUALS) {
            if (symbol !== leftCell.value) return false
          } else {
            if (symbol === leftCell.value) return false
          }
        }
      }

      // Contrainte verticale partant de cette cellule
      if (
        constraint.row === row &&
        constraint.col === col &&
        constraint.direction === ConstraintDirection.VERTICAL
      ) {
        const bottomCell = grid[row + 1]?.[col]
        if (bottomCell && bottomCell.value !== TangoSymbol.EMPTY) {
          if (constraint.type === ConstraintType.EQUALS) {
            if (symbol !== bottomCell.value) return false
          } else {
            if (symbol === bottomCell.value) return false
          }
        }
      }

      // Contrainte verticale arrivant à cette cellule
      if (
        constraint.row === row - 1 &&
        constraint.col === col &&
        constraint.direction === ConstraintDirection.VERTICAL
      ) {
        const topCell = grid[row - 1]?.[col]
        if (topCell && topCell.value !== TangoSymbol.EMPTY) {
          if (constraint.type === ConstraintType.EQUALS) {
            if (symbol !== topCell.value) return false
          } else {
            if (symbol === topCell.value) return false
          }
        }
      }
    }

    return true
  }

  /**
   * Vérifie si la grille est complète
   */
  static isFilled(grid: TangoGrid): boolean {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row]![col]!.value === TangoSymbol.EMPTY) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Vérifie si la grille est complète et correcte (correspond à la solution)
   */
  static isComplete(grid: TangoGrid, solution: TangoSymbol[][]): boolean {
    if (!this.isFilled(grid)) {
      return false
    }

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row]![col]!.value !== solution[row]![col]) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Retourne les positions des cellules en conflit avec la cellule donnée
   */
  static getConflicts(
    grid: TangoGrid,
    row: number,
    col: number,
    constraints: TangoConstraint[]
  ): { row: number; col: number }[] {
    const conflicts: { row: number; col: number }[] = []
    const symbol = grid[row]![col]!.value

    if (symbol === TangoSymbol.EMPTY) {
      return conflicts
    }

    // Vérifier les conflits de 3 consécutifs horizontalement
    if (col >= 2) {
      if (
        grid[row]![col - 1]?.value === symbol &&
        grid[row]![col - 2]?.value === symbol
      ) {
        conflicts.push({ row, col: col - 1 }, { row, col: col - 2 })
      }
    }

    if (col >= 1 && col < GRID_SIZE - 1) {
      if (
        grid[row]![col - 1]?.value === symbol &&
        grid[row]![col + 1]?.value === symbol
      ) {
        conflicts.push({ row, col: col - 1 }, { row, col: col + 1 })
      }
    }

    if (col < GRID_SIZE - 2) {
      if (
        grid[row]![col + 1]?.value === symbol &&
        grid[row]![col + 2]?.value === symbol
      ) {
        conflicts.push({ row, col: col + 1 }, { row, col: col + 2 })
      }
    }

    // Vérifier les conflits de 3 consécutifs verticalement
    if (row >= 2) {
      if (
        grid[row - 1]![col]?.value === symbol &&
        grid[row - 2]![col]?.value === symbol
      ) {
        conflicts.push({ row: row - 1, col }, { row: row - 2, col })
      }
    }

    if (row >= 1 && row < GRID_SIZE - 1) {
      if (
        grid[row - 1]![col]?.value === symbol &&
        grid[row + 1]![col]?.value === symbol
      ) {
        conflicts.push({ row: row - 1, col }, { row: row + 1, col })
      }
    }

    if (row < GRID_SIZE - 2) {
      if (
        grid[row + 1]![col]?.value === symbol &&
        grid[row + 2]![col]?.value === symbol
      ) {
        conflicts.push({ row: row + 1, col }, { row: row + 2, col })
      }
    }

    // Vérifier les conflits de contraintes
    for (const constraint of constraints) {
      if (
        constraint.row === row &&
        constraint.col === col &&
        constraint.direction === ConstraintDirection.HORIZONTAL
      ) {
        const rightCell = grid[row]![col + 1]
        if (rightCell && rightCell.value !== TangoSymbol.EMPTY) {
          const shouldMatch = constraint.type === ConstraintType.EQUALS
          if ((shouldMatch && symbol !== rightCell.value) ||
              (!shouldMatch && symbol === rightCell.value)) {
            conflicts.push({ row, col: col + 1 })
          }
        }
      }

      if (
        constraint.row === row &&
        constraint.col === col &&
        constraint.direction === ConstraintDirection.VERTICAL
      ) {
        const bottomCell = grid[row + 1]?.[col]
        if (bottomCell && bottomCell.value !== TangoSymbol.EMPTY) {
          const shouldMatch = constraint.type === ConstraintType.EQUALS
          if ((shouldMatch && symbol !== bottomCell.value) ||
              (!shouldMatch && symbol === bottomCell.value)) {
            conflicts.push({ row: row + 1, col })
          }
        }
      }
    }

    return conflicts
  }
}
