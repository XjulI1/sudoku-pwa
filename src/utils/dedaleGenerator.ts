import { DedaleDifficulty, type DedalePosition } from '@/types/dedale'

interface DedaleDimensions {
  rows: number
  cols: number
  pairCount: number
}

const DIMENSIONS: Record<DedaleDifficulty, DedaleDimensions> = {
  [DedaleDifficulty.FACILE]: { rows: 6, cols: 6, pairCount: 5 },
  [DedaleDifficulty.MOYEN]: { rows: 8, cols: 8, pairCount: 8 },
  [DedaleDifficulty.DIFFICILE]: { rows: 10, cols: 10, pairCount: 12 }
}

const MIN_SEGMENT_LENGTH = 3
const BACKBITE_ITERATIONS_PER_CELL = 25

export interface DedalePuzzle {
  rows: number
  cols: number
  pairs: [DedalePosition, DedalePosition][]
  solutionPaths: DedalePosition[][]
}

/**
 * Génère un puzzle Dédale (Numberlink) : construit un chemin hamiltonien
 * couvrant toute la grille, le mélange par l'algorithme "backbite", puis
 * le découpe en segments qui deviennent les paires de lettres à relier.
 * Le puzzle est garanti résoluble par construction (pas d'unicité prouvée :
 * un solveur d'unicité pour cette variante à couverture complète nécessite
 * un algorithme d'exact-cover bien plus lourd, hors de portée ici).
 */
export class DedaleGenerator {
  generate(difficulty: DedaleDifficulty): DedalePuzzle {
    const { rows, cols, pairCount } = DIMENSIONS[difficulty]
    const path = this.buildRandomHamiltonianPath(rows, cols)
    const lengths = this.splitSegmentLengths(rows * cols, pairCount, MIN_SEGMENT_LENGTH)
    const segments = this.cutIntoSegments(path, lengths)
    const shuffledSegments = this.shuffle(segments)

    const pairs: [DedalePosition, DedalePosition][] = shuffledSegments.map((segment) => [
      segment[0]!,
      segment[segment.length - 1]!
    ])

    return { rows, cols, pairs, solutionPaths: shuffledSegments }
  }

  /**
   * Construit un chemin hamiltonien de départ en zigzag, puis le randomise
   * avec des mouvements "backbite" qui préservent toujours la propriété
   * hamiltonienne (aucun risque d'échec, contrairement à un backtracking).
   */
  private buildRandomHamiltonianPath(rows: number, cols: number): DedalePosition[] {
    const path = this.buildZigzagPath(rows, cols)
    const indexOf = this.buildIndexOf(path, rows, cols)

    const iterations = rows * cols * BACKBITE_ITERATIONS_PER_CELL
    for (let i = 0; i < iterations; i++) {
      this.backbiteStep(path, indexOf, rows, cols)
    }

    return path
  }

  /**
   * Chemin hamiltonien trivial en boustrophédon (aller-retour ligne par ligne).
   */
  private buildZigzagPath(rows: number, cols: number): DedalePosition[] {
    const path: DedalePosition[] = []
    for (let row = 0; row < rows; row++) {
      if (row % 2 === 0) {
        for (let col = 0; col < cols; col++) path.push({ row, col })
      } else {
        for (let col = cols - 1; col >= 0; col--) path.push({ row, col })
      }
    }
    return path
  }

  private buildIndexOf(path: DedalePosition[], rows: number, cols: number): number[][] {
    const indexOf: number[][] = Array.from({ length: rows }, () => Array(cols).fill(-1))
    path.forEach((pos, i) => {
      indexOf[pos.row]![pos.col] = i
    })
    return indexOf
  }

  /**
   * Un mouvement "backbite" : on choisit une extrémité du chemin, on la
   * reconnecte à un voisin de grille pris ailleurs dans le chemin (à
   * l'indice k), ce qui revient à inverser le segment [0..k-1]. Le résultat
   * reste toujours un chemin hamiltonien valide.
   */
  private backbiteStep(path: DedalePosition[], indexOf: number[][], rows: number, cols: number): void {
    // Choisir aléatoirement l'extrémité mordante en inversant tout le chemin une fois sur deux
    if (Math.random() < 0.5) {
      path.reverse()
      for (let i = 0; i < path.length; i++) {
        indexOf[path[i]!.row]![path[i]!.col] = i
      }
    }

    const head = path[0]!
    const fixedNeighbor = path[1]!
    const candidates = this.orthogonalNeighbors(head, rows, cols).filter(
      (pos) => !(pos.row === fixedNeighbor.row && pos.col === fixedNeighbor.col)
    )

    if (candidates.length === 0) return

    const target = candidates[Math.floor(Math.random() * candidates.length)]!
    const k = indexOf[target.row]![target.col]!

    const prefix = path.slice(0, k).reverse()
    const rest = path.slice(k)
    const newPath = prefix.concat(rest)

    for (let i = 0; i < newPath.length; i++) {
      path[i] = newPath[i]!
      indexOf[path[i]!.row]![path[i]!.col] = i
    }
  }

  private orthogonalNeighbors(pos: DedalePosition, rows: number, cols: number): DedalePosition[] {
    const neighbors: DedalePosition[] = []
    if (pos.row > 0) neighbors.push({ row: pos.row - 1, col: pos.col })
    if (pos.row < rows - 1) neighbors.push({ row: pos.row + 1, col: pos.col })
    if (pos.col > 0) neighbors.push({ row: pos.row, col: pos.col - 1 })
    if (pos.col < cols - 1) neighbors.push({ row: pos.row, col: pos.col + 1 })
    return neighbors
  }

  /**
   * Répartit `total` cases en `count` segments de longueur >= minLen.
   */
  private splitSegmentLengths(total: number, count: number, minLen: number): number[] {
    const lengths: number[] = Array.from({ length: count }, () => minLen)
    let remaining = total - minLen * count

    while (remaining > 0) {
      const idx = Math.floor(Math.random() * count)
      const current = lengths[idx]!
      lengths[idx] = current + 1
      remaining--
    }

    return lengths
  }

  private cutIntoSegments(path: DedalePosition[], lengths: number[]): DedalePosition[][] {
    const segments: DedalePosition[][] = []
    let offset = 0
    for (const len of lengths) {
      segments.push(path.slice(offset, offset + len))
      offset += len
    }
    return segments
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j]!, result[i]!]
    }
    return result
  }
}
