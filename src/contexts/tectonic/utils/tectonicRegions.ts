import type { Position, RegionGrid } from '@/contexts/tectonic/types/tectonic'

// Décalages des 8 cases entourant une case (adjacence "roi", diagonales incluses)
const KING_OFFSETS: readonly (readonly [number, number])[] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1]
]

// Décalages des 4 cases orthogonalement adjacentes
const ORTHOGONAL_OFFSETS: readonly (readonly [number, number])[] = [
  [-1, 0], [1, 0], [0, -1], [0, 1]
]

/**
 * Parcourt les voisines en adjacence "roi" (8 directions) d'une case, avec vérification des bornes
 */
export function forEachKingNeighbor(
  row: number,
  col: number,
  rows: number,
  cols: number,
  fn: (row: number, col: number) => void
): void {
  for (const [dr, dc] of KING_OFFSETS) {
    const r = row + dr
    const c = col + dc
    if (r >= 0 && r < rows && c >= 0 && c < cols) fn(r, c)
  }
}

/**
 * Parcourt les voisines orthogonales (4 directions) d'une case, avec vérification des bornes
 */
export function forEachOrthogonalNeighbor(
  row: number,
  col: number,
  rows: number,
  cols: number,
  fn: (row: number, col: number) => void
): void {
  for (const [dr, dc] of ORTHOGONAL_OFFSETS) {
    const r = row + dr
    const c = col + dc
    if (r >= 0 && r < rows && c >= 0 && c < cols) fn(r, c)
  }
}

/**
 * Regroupe les positions de chaque zone à partir de la grille d'identifiants
 */
export function computeRegionCells(regionGrid: RegionGrid): Position[][] {
  const cells: Position[][] = []
  for (let row = 0; row < regionGrid.length; row++) {
    for (let col = 0; col < regionGrid[row]!.length; col++) {
      const id = regionGrid[row]![col]!
      if (!cells[id]) cells[id] = []
      cells[id]!.push({ row, col })
    }
  }
  return cells
}

/**
 * Calcule la taille de chaque zone à partir de la grille d'identifiants
 */
export function computeRegionSizes(regionGrid: RegionGrid): number[] {
  return computeRegionCells(regionGrid).map((cells) => cells.length)
}
