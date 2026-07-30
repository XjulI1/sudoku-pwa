import { DedaleDirection, type DedaleGrid, type DedalePosition } from '@/contexts/dedale/types/dedale'

const DIRECTION_DELTA: Record<DedaleDirection, { row: number; col: number }> = {
  [DedaleDirection.UP]: { row: -1, col: 0 },
  [DedaleDirection.DOWN]: { row: 1, col: 0 },
  [DedaleDirection.LEFT]: { row: 0, col: -1 },
  [DedaleDirection.RIGHT]: { row: 0, col: 1 }
}

export function neighborInDirection(pos: DedalePosition, dir: DedaleDirection): DedalePosition {
  const delta = DIRECTION_DELTA[dir]
  return { row: pos.row + delta.row, col: pos.col + delta.col }
}

export class DedaleValidator {
  /**
   * Vérifie que toutes les cases de la grille sont traversées par un tracé
   */
  static isFullyCovered(grid: DedaleGrid): boolean {
    for (const row of grid) {
      for (const cell of row) {
        if (cell.connections.length === 0) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Vérifie qu'un tracé simple relie bien les deux points d'ancrage d'une paire,
   * en suivant la chaîne de connexions depuis le premier point.
   */
  static isPairConnected(
    grid: DedaleGrid,
    endpointA: DedalePosition,
    endpointB: DedalePosition
  ): boolean {
    const startCell = grid[endpointA.row]![endpointA.col]!
    if (startCell.connections.length !== 1) return false

    let current = endpointA
    let previous: DedalePosition | null = null
    const visited = new Set<string>()

    while (true) {
      const key = `${current.row},${current.col}`
      if (visited.has(key)) return false
      visited.add(key)

      if (current.row === endpointB.row && current.col === endpointB.col) {
        return true
      }

      const cell = grid[current.row]![current.col]!
      const next = cell.connections
        .map((dir) => neighborInDirection(current, dir))
        .find((pos) => !previous || pos.row !== previous.row || pos.col !== previous.col)

      if (!next) return false

      previous = current
      current = next
    }
  }

  /**
   * Vérifie que la grille est complète : toutes les cases sont traversées et
   * chaque paire de lettres est reliée par un tracé simple. N'importe quel
   * tracé valide compte comme une victoire, pas seulement celui du générateur.
   */
  static isComplete(grid: DedaleGrid, pairs: [DedalePosition, DedalePosition][]): boolean {
    if (!this.isFullyCovered(grid)) return false
    return pairs.every(([a, b]) => this.isPairConnected(grid, a, b))
  }
}

export function oppositeDirection(dir: DedaleDirection): DedaleDirection {
  switch (dir) {
    case DedaleDirection.UP:
      return DedaleDirection.DOWN
    case DedaleDirection.DOWN:
      return DedaleDirection.UP
    case DedaleDirection.LEFT:
      return DedaleDirection.RIGHT
    case DedaleDirection.RIGHT:
      return DedaleDirection.LEFT
  }
}

export function directionBetween(from: DedalePosition, to: DedalePosition): DedaleDirection | null {
  if (to.row === from.row - 1 && to.col === from.col) return DedaleDirection.UP
  if (to.row === from.row + 1 && to.col === from.col) return DedaleDirection.DOWN
  if (to.col === from.col - 1 && to.row === from.row) return DedaleDirection.LEFT
  if (to.col === from.col + 1 && to.row === from.row) return DedaleDirection.RIGHT
  return null
}
