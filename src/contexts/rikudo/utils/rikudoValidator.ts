import type { RikudoGrid, RikudoCoord, DiamondLink } from '@/contexts/rikudo/types/rikudo'
import { coordsEqual, isHexAdjacent } from './rikudoGeometry'

export class RikudoValidator {
  /**
   * Vérifie qu'une valeur déjà posée sur `coord` ne viole aucune règle :
   * unicité, adjacence hexagonale des valeurs consécutives, et liens ◆ donnés
   */
  static isValidMove(grid: RikudoGrid, diamondLinks: DiamondLink[], coord: RikudoCoord, value: number): boolean {
    for (const cell of grid) {
      if (cell.value === null || coordsEqual(cell.coord, coord)) continue

      if (cell.value === value) return false
      if (Math.abs(cell.value - value) === 1 && !isHexAdjacent(cell.coord, coord)) return false
    }

    for (const partner of this.diamondPartners(diamondLinks, coord)) {
      const partnerCell = grid.find((c) => coordsEqual(c.coord, partner))
      if (partnerCell?.value !== null && partnerCell?.value !== undefined) {
        if (Math.abs(partnerCell.value - value) !== 1) return false
      }
    }

    return true
  }

  /**
   * Retourne les positions en conflit avec la cellule donnée
   */
  static getConflicts(grid: RikudoGrid, diamondLinks: DiamondLink[], coord: RikudoCoord): RikudoCoord[] {
    const conflicts: RikudoCoord[] = []
    const cell = grid.find((c) => coordsEqual(c.coord, coord))
    const value = cell?.value ?? null
    if (value === null) return conflicts

    for (const other of grid) {
      if (other.value === null || coordsEqual(other.coord, coord)) continue

      if (other.value === value) {
        conflicts.push(other.coord)
      } else if (Math.abs(other.value - value) === 1 && !isHexAdjacent(other.coord, coord)) {
        conflicts.push(other.coord)
      }
    }

    for (const partner of this.diamondPartners(diamondLinks, coord)) {
      const partnerCell = grid.find((c) => coordsEqual(c.coord, partner))
      if (
        partnerCell?.value !== null &&
        partnerCell?.value !== undefined &&
        Math.abs(partnerCell.value - value) !== 1 &&
        !conflicts.some((p) => coordsEqual(p, partnerCell.coord))
      ) {
        conflicts.push(partnerCell.coord)
      }
    }

    return conflicts
  }

  /**
   * Vérifie si la grille est entièrement remplie (hors trou)
   */
  static isFilled(grid: RikudoGrid): boolean {
    return grid.every((cell) => cell.isHole || cell.value !== null)
  }

  /**
   * Vérifie si la grille est complète et correspond au chemin solution
   */
  static isComplete(grid: RikudoGrid, solution: RikudoCoord[]): boolean {
    if (!this.isFilled(grid)) return false

    for (let i = 0; i < solution.length; i++) {
      const cell = grid.find((c) => coordsEqual(c.coord, solution[i]!))
      if (cell?.value !== i + 1) return false
    }

    return true
  }

  private static diamondPartners(diamondLinks: DiamondLink[], coord: RikudoCoord): RikudoCoord[] {
    const partners: RikudoCoord[] = []
    for (const link of diamondLinks) {
      if (coordsEqual(link.a, coord)) partners.push(link.b)
      else if (coordsEqual(link.b, coord)) partners.push(link.a)
    }
    return partners
  }
}
