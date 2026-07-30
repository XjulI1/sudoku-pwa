import {
  TectonicDifficulty,
  type TectonicDifficultyConfig,
  type Position,
  type RegionGrid
} from '@/types/tectonic'
import { forEachKingNeighbor, forEachOrthogonalNeighbor } from './tectonicRegions'

// Configuration de chaque palier de difficulté : dimensions et ratio de cases données.
// maxRegionSize reste fixé à 5 (le standard du Tectonic/Suguru classique) à tous les
// paliers : un carré 2x2 quelconque de la grille forme 4 cases mutuellement adjacentes
// (adjacence roi), qui nécessitent donc au moins 4 valeurs distinctes disponibles quelque
// part — avec maxRegionSize < 4 c'est mathématiquement impossible (principe des tiroirs),
// et même à 4 c'est trop contraignant pour rester générable de façon fiable. La difficulté
// progresse via la taille de grille et la densité de cases données, pas via la taille des zones.
const DIFFICULTY_CONFIG: Record<TectonicDifficulty, TectonicDifficultyConfig> = {
  [TectonicDifficulty.FACILE]: { rows: 6, cols: 6, maxRegionSize: 5, clueRatio: 0.55 },
  [TectonicDifficulty.MOYEN]: { rows: 8, cols: 8, maxRegionSize: 5, clueRatio: 0.45 },
  [TectonicDifficulty.DIFFICILE]: { rows: 10, cols: 8, maxRegionSize: 5, clueRatio: 0.35 },
  [TectonicDifficulty.EXPERT]: { rows: 10, cols: 10, maxRegionSize: 5, clueRatio: 0.28 }
}

// Nombre de découpages en zones tentés si un découpage se révèle insoluble
const MAX_PARTITION_ATTEMPTS = 20
// Nombre de tentatives de découpage cherchant une "bonne" forme (peu de zones de taille 1)
const QUALITY_ATTEMPTS = 5
// Garde-fou : nombre de nœuds explorés max lors du remplissage complet de la grille
const FILL_NODE_LIMIT = 50_000
// Garde-fou : nombre de nœuds explorés max lors du comptage de solutions (retrait de cases)
const COUNT_NODE_LIMIT = 5_000

interface Partition {
  regionGrid: RegionGrid
  regionCells: Position[][]
  regionSizes: number[]
}

interface Candidates {
  row: number
  col: number
  candidates: number[]
}

/**
 * Générateur de puzzles Tectonic (Suguru)
 * Découpe la grille en zones irrégulières, remplit une solution complète respectant
 * les règles (unicité par zone + adjacence 8 directions), puis retire des cases
 * en garantissant une solution unique.
 */
export class TectonicGenerator {
  private readonly rows: number
  private readonly cols: number
  private readonly maxRegionSize: number
  private readonly clueRatio: number

  private regionGrid: RegionGrid = []
  private regionCells: Position[][] = []
  private regionSizes: number[] = []

  constructor(difficulty: TectonicDifficulty) {
    const config = TectonicGenerator.getDifficultyConfig(difficulty)
    this.rows = config.rows
    this.cols = config.cols
    this.maxRegionSize = config.maxRegionSize
    this.clueRatio = config.clueRatio
  }

  static getDifficultyConfig(difficulty: TectonicDifficulty): TectonicDifficultyConfig {
    return DIFFICULTY_CONFIG[difficulty]
  }

  /**
   * Génère un puzzle complet : grille à trous, solution et découpage en zones
   */
  generate(): { puzzle: number[][]; solution: number[][]; regionGrid: RegionGrid } {
    for (let attempt = 0; attempt < MAX_PARTITION_ATTEMPTS; attempt++) {
      const partition = this.generateRegionPartition()
      this.regionGrid = partition.regionGrid
      this.regionCells = partition.regionCells
      this.regionSizes = partition.regionSizes

      const solution = this.generateComplete()
      if (solution) {
        const puzzle = this.removeNumbers(solution)
        return { puzzle, solution, regionGrid: this.regionGrid.map((row) => [...row]) }
      }
      // Ce découpage en zones s'est révélé insoluble : on retente avec un nouveau découpage
    }

    throw new Error('Tectonic: impossible de générer un puzzle valide')
  }

  // ---------------------------------------------------------------------
  // Découpage en zones
  // ---------------------------------------------------------------------

  /**
   * Tente plusieurs découpages et garde le premier de bonne qualité (peu de zones de taille 1)
   */
  private generateRegionPartition(): Partition {
    let best: Partition | null = null

    for (let attempt = 0; attempt < QUALITY_ATTEMPTS; attempt++) {
      const partition = this.growPartitionOnce()
      this.mergeTinyOrphans(partition)

      if (best === null) best = partition

      const tinyCount = partition.regionSizes.filter((size) => size === 1).length
      if (tinyCount / partition.regionSizes.length <= 0.2) return partition
    }

    return best!
  }

  /**
   * Croissance aléatoire par "blobs" : couvre toute la grille en une passe
   */
  private growPartitionOnce(): Partition {
    const regionGrid: RegionGrid = Array.from({ length: this.rows }, () => Array(this.cols).fill(-1))
    const unassigned = new Set<string>()
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) unassigned.add(this.key(r, c))
    }

    const regionCells: Position[][] = []

    while (unassigned.size > 0) {
      const seed = this.pickMostConstrainedSeed(unassigned)
      unassigned.delete(this.key(seed.row, seed.col))

      const regionId = regionCells.length
      regionGrid[seed.row]![seed.col] = regionId
      const cells: Position[] = [seed]

      // Toujours viser la taille maximale : la variété de tailles vient naturellement des
      // cases où le front s'épuise avant d'atteindre cette cible (zones "boxées"), pas d'un
      // tirage aléatoire. Une taille cible tirée au hasard (y compris volontairement petite)
      // multiplie les zones sous-dimensionnées, ce qui réduit fortement les valeurs
      // disponibles localement et rend le découpage beaucoup plus souvent insoluble.
      const targetSize = this.maxRegionSize

      const frontier: Position[] = []
      forEachOrthogonalNeighbor(seed.row, seed.col, this.rows, this.cols, (r, c) => {
        if (unassigned.has(this.key(r, c))) frontier.push({ row: r, col: c })
      })

      while (cells.length < targetSize && frontier.length > 0) {
        // Préférer la case du front ayant déjà le plus de voisines dans la zone en
        // cours de croissance : cela produit des formes compactes ("blobs") plutôt
        // que des lignes fines. Les lignes fines sont la pire forme possible pour la
        // contrainte d'adjacence 8-directions : leur voisinage se chevauche énormément
        // avec les zones parallèles voisines, ce qui rend le découpage bien plus
        // souvent insoluble.
        let bestIdx = 0
        let bestScore = -Infinity
        for (let i = 0; i < frontier.length; i++) {
          const candidate = frontier[i]!
          let score = 0
          forEachOrthogonalNeighbor(candidate.row, candidate.col, this.rows, this.cols, (r, c) => {
            if (regionGrid[r]![c] === regionId) score++
          })
          score += Math.random() * 0.5 // léger bruit pour varier les formes obtenues
          if (score > bestScore) {
            bestScore = score
            bestIdx = i
          }
        }

        const next = frontier.splice(bestIdx, 1)[0]!
        const nextKey = this.key(next.row, next.col)
        if (!unassigned.has(nextKey)) continue // case déjà absorbée entre-temps

        unassigned.delete(nextKey)
        regionGrid[next.row]![next.col] = regionId
        cells.push(next)

        forEachOrthogonalNeighbor(next.row, next.col, this.rows, this.cols, (r, c) => {
          if (unassigned.has(this.key(r, c))) frontier.push({ row: r, col: c })
        })
      }

      regionCells.push(cells)
    }

    return { regionGrid, regionCells, regionSizes: regionCells.map((cells) => cells.length) }
  }

  /**
   * Choisit la case libre la plus contrainte (le moins de voisines libres),
   * pour éviter qu'elle reste isolée en zone de taille 1 plus tard
   */
  private pickMostConstrainedSeed(unassigned: Set<string>): Position {
    let best: Position | null = null
    let bestFreeNeighbors = Infinity
    let bestTieBreak = Infinity

    for (const key of unassigned) {
      const [row, col] = key.split(',').map(Number) as [number, number]
      let freeNeighbors = 0
      forEachOrthogonalNeighbor(row, col, this.rows, this.cols, (r, c) => {
        if (unassigned.has(this.key(r, c))) freeNeighbors++
      })

      const tieBreak = Math.random()
      if (freeNeighbors < bestFreeNeighbors || (freeNeighbors === bestFreeNeighbors && tieBreak < bestTieBreak)) {
        best = { row, col }
        bestFreeNeighbors = freeNeighbors
        bestTieBreak = tieBreak
      }
    }

    return best!
  }

  /**
   * Répare les zones de taille 1 : les fusionne dans une zone voisine ayant de la place,
   * ou si toutes les voisines sont déjà pleines, leur "vole" une case adjacente (si cela ne
   * les déconnecte pas). Sans cette seconde option, un singleton entouré uniquement de zones
   * déjà à `maxRegionSize` reste insoluble (aucune de ses voisines ne peut jamais éviter sa
   * valeur forcée), ce qui arrive souvent quand `maxRegionSize` est petit.
   */
  private mergeTinyOrphans(partition: Partition): void {
    const PASSES = 3
    for (let pass = 0; pass < PASSES; pass++) {
      let changed = false

      for (let regionId = 0; regionId < partition.regionCells.length; regionId++) {
        const cells = partition.regionCells[regionId]
        if (!cells || cells.length !== 1) continue

        const cell = cells[0]!

        let roomyNeighborId: number | null = null
        forEachOrthogonalNeighbor(cell.row, cell.col, this.rows, this.cols, (r, c) => {
          if (roomyNeighborId !== null) return
          const otherId = partition.regionGrid[r]![c]!
          if (otherId !== regionId && (partition.regionCells[otherId]?.length ?? 0) < this.maxRegionSize) {
            roomyNeighborId = otherId
          }
        })

        if (roomyNeighborId !== null) {
          partition.regionGrid[cell.row]![cell.col] = roomyNeighborId
          partition.regionCells[roomyNeighborId]!.push(cell)
          partition.regionCells[regionId] = []
          changed = true
          continue
        }

        const thefts: { donorId: number; stolenCell: Position }[] = []
        forEachOrthogonalNeighbor(cell.row, cell.col, this.rows, this.cols, (r, c) => {
          if (thefts.length > 0) return
          const otherId = partition.regionGrid[r]![c]!
          if (otherId === regionId) return
          const otherCells = partition.regionCells[otherId]
          if (!otherCells || otherCells.length <= 1) return
          const candidate = { row: r, col: c }
          if (this.staysConnectedWithout(otherCells, candidate)) {
            thefts.push({ donorId: otherId, stolenCell: candidate })
          }
        })

        if (thefts.length > 0) {
          const { donorId, stolenCell } = thefts[0]!
          const donorCells = partition.regionCells[donorId]!
          const idx = donorCells.findIndex((c) => c.row === stolenCell.row && c.col === stolenCell.col)
          donorCells.splice(idx, 1)
          partition.regionGrid[stolenCell.row]![stolenCell.col] = regionId
          cells.push(stolenCell)
          changed = true
        }
      }

      if (!changed) break
    }

    this.compactRegions(partition)
  }

  /**
   * Vérifie que les cases d'une zone restent orthogonalement connexes une fois `toRemove` retirée
   */
  private staysConnectedWithout(cells: Position[], toRemove: Position): boolean {
    const remaining = cells.filter((c) => !(c.row === toRemove.row && c.col === toRemove.col))
    if (remaining.length <= 1) return true

    const cellSet = new Set(remaining.map((c) => this.key(c.row, c.col)))
    const visited = new Set<string>()
    const stack = [remaining[0]!]
    visited.add(this.key(remaining[0]!.row, remaining[0]!.col))

    while (stack.length > 0) {
      const current = stack.pop()!
      forEachOrthogonalNeighbor(current.row, current.col, this.rows, this.cols, (r, c) => {
        const k = this.key(r, c)
        if (cellSet.has(k) && !visited.has(k)) {
          visited.add(k)
          stack.push({ row: r, col: c })
        }
      })
    }

    return visited.size === remaining.length
  }

  /**
   * Retire les zones vidées par les fusions et renumérote les identifiants de zone
   */
  private compactRegions(partition: Partition): void {
    const idMap = new Map<number, number>()
    let newId = 0
    for (let oldId = 0; oldId < partition.regionCells.length; oldId++) {
      if (partition.regionCells[oldId]!.length > 0) {
        idMap.set(oldId, newId)
        newId++
      }
    }

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const oldId = partition.regionGrid[r]![c]!
        partition.regionGrid[r]![c] = idMap.get(oldId)!
      }
    }

    const nonEmpty = partition.regionCells.filter((cells) => cells.length > 0)
    partition.regionCells.length = 0
    partition.regionCells.push(...nonEmpty)
    partition.regionSizes.length = 0
    partition.regionSizes.push(...nonEmpty.map((cells) => cells.length))
  }

  private key(row: number, col: number): string {
    return `${row},${col}`
  }

  // ---------------------------------------------------------------------
  // Remplissage (résolution) — backtracking avec sélection MRV
  // ---------------------------------------------------------------------

  private getCandidates(grid: number[][], row: number, col: number): number[] {
    const regionId = this.regionGrid[row]![col]!
    const size = this.regionSizes[regionId]!
    const used = new Set<number>()

    for (const cell of this.regionCells[regionId]!) {
      const v = grid[cell.row]![cell.col]!
      if (v !== 0) used.add(v)
    }

    forEachKingNeighbor(row, col, this.rows, this.cols, (r, c) => {
      const v = grid[r]![c]!
      if (v !== 0) used.add(v)
    })

    const candidates: number[] = []
    for (let n = 1; n <= size; n++) {
      if (!used.has(n)) candidates.push(n)
    }
    return candidates
  }

  /**
   * Sélectionne la case vide avec le moins de candidats possibles (minimum remaining values)
   */
  private selectMRVCell(grid: number[][]): Candidates | null {
    let best: Candidates | null = null

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (grid[row]![col] !== 0) continue

        const candidates = this.getCandidates(grid, row, col)
        if (candidates.length === 0) return { row, col, candidates } // impasse : remonter immédiatement
        if (!best || candidates.length < best.candidates.length) {
          best = { row, col, candidates }
        }
      }
    }

    return best
  }

  private fillGrid(grid: number[][], budget: { count: number }): boolean {
    budget.count++
    if (budget.count > FILL_NODE_LIMIT) return false

    const next = this.selectMRVCell(grid)
    if (next === null) return true // grille complète
    if (next.candidates.length === 0) return false

    for (const num of this.shuffleArray(next.candidates)) {
      grid[next.row]![next.col] = num
      if (this.fillGrid(grid, budget)) return true
      grid[next.row]![next.col] = 0
    }

    return false
  }

  /**
   * Tente de remplir entièrement la grille ; retourne null si le découpage en zones est insoluble
   */
  private generateComplete(): number[][] | null {
    const grid: number[][] = Array.from({ length: this.rows }, () => Array(this.cols).fill(0))
    const budget = { count: 0 }
    return this.fillGrid(grid, budget) ? grid : null
  }

  // ---------------------------------------------------------------------
  // Retrait de cases avec garantie de solution unique
  // ---------------------------------------------------------------------

  private removeNumbers(solution: number[][]): number[][] {
    const puzzle = solution.map((row) => [...row])
    const totalCells = this.rows * this.cols
    const targetClues = Math.round(totalCells * this.clueRatio)
    const cellsToRemove = totalCells - targetClues

    // Les zones de taille 1 sont toujours forcées à "1" par la seule règle du jeu :
    // les retirer n'ajouterait aucune difficulté, elles restent donc données d'office.
    const candidates: Position[] = []
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.regionSizes[this.regionGrid[row]![col]!]! > 1) {
          candidates.push({ row, col })
        }
      }
    }

    const positions = this.shuffleArray(candidates)
    let removed = 0

    for (const { row, col } of positions) {
      if (removed >= cellsToRemove) break

      const backup = puzzle[row]![col]!
      puzzle[row]![col] = 0

      if (this.hasUniqueSolution(puzzle)) {
        removed++
      } else {
        puzzle[row]![col] = backup
      }
    }

    return puzzle
  }

  private hasUniqueSolution(grid: number[][]): boolean {
    const tempGrid = grid.map((row) => [...row])
    const solutions = { count: 0 }
    const budget = { count: 0 }
    this.countSolutions(tempGrid, solutions, 2, budget)
    return solutions.count === 1
  }

  /**
   * Compte les solutions (s'arrête à maxSolutions). En cas de dépassement du budget de
   * nœuds explorés, échoue "prudemment" en considérant la grille comme ambiguë plutôt
   * que de risquer de valider un puzzle dont l'unicité n'a pas pu être prouvée.
   */
  private countSolutions(
    grid: number[][],
    solutions: { count: number },
    maxSolutions: number,
    budget: { count: number }
  ): void {
    if (solutions.count >= maxSolutions) return

    budget.count++
    if (budget.count > COUNT_NODE_LIMIT) {
      solutions.count = maxSolutions
      return
    }

    const next = this.selectMRVCell(grid)
    if (next === null) {
      solutions.count++
      return
    }
    if (next.candidates.length === 0) return

    for (const num of next.candidates) {
      grid[next.row]![next.col] = num
      this.countSolutions(grid, solutions, maxSolutions, budget)
      grid[next.row]![next.col] = 0
      if (solutions.count >= maxSolutions) return
    }
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
}
