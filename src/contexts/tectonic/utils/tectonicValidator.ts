import type { Position, RegionGrid, TectonicGrid } from '@/contexts/tectonic/types/tectonic'
import { computeRegionCells, forEachKingNeighbor } from './tectonicRegions'

export class TectonicValidator {
  /**
   * Vérifie si une valeur est valide à une position donnée (taille de zone,
   * unicité dans la zone, unicité parmi les 8 cases adjacentes)
   */
  static isValidMove(grid: TectonicGrid, regionGrid: RegionGrid, row: number, col: number, value: number): boolean {
    const regionId = regionGrid[row]![col]!
    const regionCells = computeRegionCells(regionGrid)[regionId]!

    if (value < 1 || value > regionCells.length) return false

    for (const cell of regionCells) {
      if ((cell.row !== row || cell.col !== col) && grid[cell.row]![cell.col]!.value === value) {
        return false
      }
    }

    let conflict = false
    forEachKingNeighbor(row, col, grid.length, grid[0]!.length, (r, c) => {
      if (grid[r]![c]!.value === value) conflict = true
    })

    return !conflict
  }

  /**
   * Retourne les positions en conflit avec la cellule donnée
   * (doublon dans la zone et/ou parmi les cases adjacentes, dédupliqués)
   */
  static getConflicts(grid: TectonicGrid, regionGrid: RegionGrid, row: number, col: number): Position[] {
    const conflicts: Position[] = []
    const value = grid[row]![col]!.value
    if (value === null) return conflicts

    const regionId = regionGrid[row]![col]!
    for (const cell of computeRegionCells(regionGrid)[regionId]!) {
      if ((cell.row !== row || cell.col !== col) && grid[cell.row]![cell.col]!.value === value) {
        conflicts.push(cell)
      }
    }

    forEachKingNeighbor(row, col, grid.length, grid[0]!.length, (r, c) => {
      if (grid[r]![c]!.value === value && !conflicts.some((p) => p.row === r && p.col === c)) {
        conflicts.push({ row: r, col: c })
      }
    })

    return conflicts
  }

  /**
   * Vérifie si la grille est entièrement remplie
   */
  static isFilled(grid: TectonicGrid): boolean {
    for (const row of grid) {
      for (const cell of row) {
        if (cell.value === null) return false
      }
    }
    return true
  }

  /**
   * Vérifie si la grille est complète et correspond à la solution
   */
  static isComplete(grid: TectonicGrid, solution: number[][]): boolean {
    if (!this.isFilled(grid)) return false

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row]!.length; col++) {
        if (grid[row]![col]!.value !== solution[row]![col]) return false
      }
    }

    return true
  }
}
