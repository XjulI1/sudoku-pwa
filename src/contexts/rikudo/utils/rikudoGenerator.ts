import { RikudoDifficulty, type RikudoDifficultyConfig, type RikudoCoord, type DiamondLink } from '@/contexts/rikudo/types/rikudo'
import {
  HEX_DIRECTIONS,
  coordKey,
  coordsEqual,
  isHole,
  hexCoordsInRadius,
  forEachHexNeighbor,
  isHexAdjacent
} from './rikudoGeometry'

// Configuration de chaque palier de difficulté : rayon de l'hexagone.
// Le nombre d'indices ◆ n'est pas paramétré : il découle entièrement de la
// minimisation (voir selectDiamondClues) — la difficulté vient uniquement
// de la taille de la grille, pas d'un ratio d'indices arbitraire.
const DIFFICULTY_CONFIG: Record<RikudoDifficulty, RikudoDifficultyConfig> = {
  [RikudoDifficulty.FACILE]: { radius: 2 },
  [RikudoDifficulty.MOYEN]: { radius: 3 },
  [RikudoDifficulty.DIFFICILE]: { radius: 4 },
  [RikudoDifficulty.EXPERT]: { radius: 5 }
}

// Budget de nœuds explorés par vérification d'unicité, par palier (garde-fou anti-blocage)
const NODE_LIMIT: Record<RikudoDifficulty, number> = {
  [RikudoDifficulty.FACILE]: 20_000,
  [RikudoDifficulty.MOYEN]: 80_000,
  [RikudoDifficulty.DIFFICILE]: 200_000,
  [RikudoDifficulty.EXPERT]: 150_000
}

// Nombre de mouvements "backbite" appliqués par case de la grille pour randomiser le chemin
const BACKBITE_ITERATIONS_PER_CELL = 25

/**
 * Générateur de puzzles Rikudo : construit un chemin hamiltonien sur une grille
 * hexagonale (trou central exclu) via l'algorithme "backbite", puis sélectionne
 * un sous-ensemble minimal d'indices ◆ (arêtes du chemin) garantissant une
 * solution unique, vérifiée par un solveur à déduction forte.
 */
export class RikudoGenerator {
  private readonly radius: number
  private readonly nodeLimit: number

  constructor(difficulty: RikudoDifficulty) {
    const config = RikudoGenerator.getDifficultyConfig(difficulty)
    this.radius = config.radius
    this.nodeLimit = NODE_LIMIT[difficulty]
  }

  static getDifficultyConfig(difficulty: RikudoDifficulty): RikudoDifficultyConfig {
    return DIFFICULTY_CONFIG[difficulty]
  }

  /**
   * Génère un puzzle complet : le chemin solution (path[i] porte la valeur i+1)
   * et les indices ◆ à afficher (sous-ensemble d'arêtes du chemin)
   */
  generate(): { path: RikudoCoord[]; diamondLinks: DiamondLink[]; radius: number } {
    const path = this.buildRandomHamiltonianPath()
    const adjacency = this.buildAdjacency()
    const allEdges = this.pathToEdges(path)
    const startKey = coordKey(path[0]!)
    const endKey = coordKey(path[path.length - 1]!)

    const keptEdges = this.selectDiamondClues(allEdges, adjacency, startKey, endKey, path.length)

    const diamondLinks: DiamondLink[] = keptEdges.map(([aKey, bKey]) => ({
      a: this.coordFromKey(aKey),
      b: this.coordFromKey(bKey)
    }))

    return { path, diamondLinks, radius: this.radius }
  }

  /**
   * Vérifie qu'un ensemble de liens ◆ (combiné aux positions de départ/arrivée
   * du chemin donné) garantit bien une solution unique. Exposé publiquement
   * pour permettre de vérifier la minimalité des indices générés (chaque ◆
   * conservé doit être individuellement nécessaire), notamment dans les tests.
   */
  verifyUniqueSolution(path: RikudoCoord[], diamondLinks: DiamondLink[]): boolean {
    const adjacency = this.buildAdjacency()
    const edges: [string, string][] = diamondLinks.map((link) => [coordKey(link.a), coordKey(link.b)])
    const startKey = coordKey(path[0]!)
    const endKey = coordKey(path[path.length - 1]!)
    return this.hasUniqueSolution(adjacency, edges, startKey, endKey, path.length)
  }

  // ---------------------------------------------------------------------
  // Chemin hamiltonien initial (spirale par anneaux) + randomisation backbite
  // ---------------------------------------------------------------------

  /**
   * Parcourt l'anneau de rayon k (k>=1) sous forme de cycle de 6k cases
   * hexagonalement adjacentes deux à deux
   */
  private ring(k: number): RikudoCoord[] {
    const results: RikudoCoord[] = []
    let hex: RikudoCoord = { q: HEX_DIRECTIONS[4]!.q * k, r: HEX_DIRECTIONS[4]!.r * k }
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < k; j++) {
        results.push(hex)
        hex = { q: hex.q + HEX_DIRECTIONS[i]!.q, r: hex.r + HEX_DIRECTIONS[i]!.r }
      }
    }
    return results
  }

  /**
   * Chemin hamiltonien trivial en spirale : anneau 1, puis anneau 2 raccordé
   * au dernier point de l'anneau 1, etc. Ne traverse jamais le trou central.
   * (Un serpentin ligne par ligne, comme pour une grille rectangulaire, casse
   * sur la rangée du trou : les deux cases encadrantes ne sont plus adjacentes.)
   */
  private buildSpiralPath(): RikudoCoord[] {
    let path = this.ring(1)

    for (let k = 2; k <= this.radius; k++) {
      const end = path[path.length - 1]!
      const ringK = this.ring(k)
      const candidates = [ringK, ringK.slice().reverse()]

      let chosen: RikudoCoord[] | null = null
      for (const cand of candidates) {
        const idx = cand.findIndex((c) => isHexAdjacent(end, c))
        if (idx !== -1) {
          chosen = cand.slice(idx).concat(cand.slice(0, idx))
          break
        }
      }

      // L'anneau k entoure entièrement l'anneau k-1 : un point de raccord existe toujours
      path = path.concat(chosen!)
    }

    return path
  }

  private buildRandomHamiltonianPath(): RikudoCoord[] {
    const path = this.buildSpiralPath()
    const indexOf = this.buildIndexOf(path)

    const iterations = path.length * BACKBITE_ITERATIONS_PER_CELL
    for (let i = 0; i < iterations; i++) {
      this.backbiteStep(path, indexOf)
    }

    return path
  }

  private buildIndexOf(path: RikudoCoord[]): Map<string, number> {
    const indexOf = new Map<string, number>()
    path.forEach((c, i) => indexOf.set(coordKey(c), i))
    return indexOf
  }

  /**
   * Un mouvement "backbite" : on choisit l'extrémité du chemin, on la
   * reconnecte à une voisine hexagonale prise ailleurs dans le chemin,
   * ce qui revient à inverser un segment. Le résultat reste toujours un
   * chemin hamiltonien valide (aucun risque d'échec).
   */
  private backbiteStep(path: RikudoCoord[], indexOf: Map<string, number>): void {
    if (Math.random() < 0.5) {
      path.reverse()
      for (let i = 0; i < path.length; i++) indexOf.set(coordKey(path[i]!), i)
    }

    const head = path[0]!
    const fixedNeighbor = path[1]!
    const candidates: RikudoCoord[] = []
    forEachHexNeighbor(head, this.radius, (n) => {
      if (!coordsEqual(n, fixedNeighbor)) candidates.push(n)
    })

    if (candidates.length === 0) return

    const target = candidates[Math.floor(Math.random() * candidates.length)]!
    const k = indexOf.get(coordKey(target))!

    const prefix = path.slice(0, k).reverse()
    const rest = path.slice(k)
    const newPath = prefix.concat(rest)

    for (let i = 0; i < newPath.length; i++) {
      path[i] = newPath[i]!
      indexOf.set(coordKey(path[i]!), i)
    }
  }

  // ---------------------------------------------------------------------
  // Solveur d'unicité — déduction ◆ + pruning "impasse locale"
  // ---------------------------------------------------------------------

  private buildAdjacency(): Map<string, string[]> {
    const adjacency = new Map<string, string[]>()
    for (const coord of hexCoordsInRadius(this.radius)) {
      if (isHole(coord)) continue
      const neighbors: string[] = []
      forEachHexNeighbor(coord, this.radius, (n) => neighbors.push(coordKey(n)))
      adjacency.set(coordKey(coord), neighbors)
    }
    return adjacency
  }

  private buildDiamondMap(edges: [string, string][]): Map<string, string[]> {
    const map = new Map<string, string[]>()
    for (const [a, b] of edges) {
      if (!map.has(a)) map.set(a, [])
      if (!map.has(b)) map.set(b, [])
      map.get(a)!.push(b)
      map.get(b)!.push(a)
    }
    return map
  }

  /**
   * Compte les chemins hamiltoniens valides (s'arrête à maxSolutions).
   * Comme les valeurs sont assignées dans l'ordre strict du chemin, un indice
   * ◆(A,B) affirme exactement "l'arête (A,B) fait partie du chemin solution" :
   * dès que A devient la tête du chemin, tout partenaire ◆ non visité de A est
   * donc FORCÉ d'être l'unique prochain pas (aucune autre case ne pourra plus
   * jamais satisfaire cette contrainte). Deux partenaires ◆ non visités
   * simultanés = contradiction immédiate.
   */
  private countPaths(
    adjacency: Map<string, string[]>,
    diamonds: Map<string, string[]>,
    startKey: string,
    endKey: string,
    totalCells: number,
    maxSolutions: number,
    budget: { count: number }
  ): number {
    const visited = new Set<string>([startKey])
    const solutions = { count: 0 }

    const unvisitedDegree = (key: string): number => {
      let d = 0
      for (const n of adjacency.get(key)!) if (!visited.has(n)) d++
      return d
    }

    const dfs = (headKey: string, visitedCount: number): void => {
      budget.count++
      if (budget.count > this.nodeLimit) {
        // Échec prudent : on ne peut pas prouver l'unicité dans le budget, on
        // traite la grille comme ambiguë plutôt que de risquer un faux positif
        solutions.count = maxSolutions
        return
      }
      if (solutions.count >= maxSolutions) return

      if (visitedCount === totalCells) {
        if (headKey === endKey) solutions.count++
        return
      }

      let forced: string | null = null
      for (const partner of diamonds.get(headKey) ?? []) {
        if (visited.has(partner)) continue
        if (forced === null) forced = partner
        else if (forced !== partner) return // deux successeurs forcés différents : impasse
      }

      const candidates = forced !== null
        ? [forced]
        : (adjacency.get(headKey) ?? []).filter((n) => !visited.has(n))

      for (const next of candidates) {
        const remainingAfter = totalCells - visitedCount - 1
        if (next === endKey && remainingAfter !== 0) continue // N seulement en dernier
        if (next !== endKey && remainingAfter === 0) continue // le dernier coup DOIT être N

        visited.add(next)

        // Pruning bon marché : une voisine non visitée de `next` qui se retrouve
        // sans aucune voisine non visitée restante est une impasse sûre
        let deadEnd = false
        if (remainingAfter > 0) {
          for (const n of adjacency.get(next)!) {
            if (n === endKey || visited.has(n)) continue
            if (unvisitedDegree(n) === 0) {
              deadEnd = true
              break
            }
          }
        }

        if (!deadEnd) dfs(next, visitedCount + 1)
        visited.delete(next)
        if (solutions.count >= maxSolutions) return
      }
    }

    dfs(startKey, 1)
    return solutions.count
  }

  private hasUniqueSolution(
    adjacency: Map<string, string[]>,
    diamondEdges: [string, string][],
    startKey: string,
    endKey: string,
    totalCells: number
  ): boolean {
    const diamonds = this.buildDiamondMap(diamondEdges)
    const budget = { count: 0 }
    const count = this.countPaths(adjacency, diamonds, startKey, endKey, totalCells, 2, budget)
    return count === 1
  }

  // ---------------------------------------------------------------------
  // Sélection des indices ◆ à conserver
  // ---------------------------------------------------------------------

  private pathToEdges(path: RikudoCoord[]): [string, string][] {
    const edges: [string, string][] = []
    for (let i = 0; i < path.length - 1; i++) {
      edges.push([coordKey(path[i]!), coordKey(path[i + 1]!)])
    }
    return edges
  }

  /**
   * Retire chaque arête candidate, une à une dans un ordre aléatoire, et ne la
   * garde retirée que si l'unicité de la solution est toujours prouvée sans
   * elle. Contrairement à `removeNumbers` côté Sudoku/Tectonic (qui vise un
   * ratio de cases retirées et s'arrête dès la cible atteinte), on tente le
   * retrait de TOUTES les arêtes sans s'arrêter tôt : un indice ◆ n'est donc
   * jamais conservé "pour faire joli", seulement quand son retrait rendrait
   * effectivement le puzzle ambigu.
   */
  private selectDiamondClues(
    allEdges: [string, string][],
    adjacency: Map<string, string[]>,
    startKey: string,
    endKey: string,
    totalCells: number
  ): [string, string][] {
    let currentEdges = allEdges.slice()
    const order = this.shuffleArray(allEdges)

    for (const edge of order) {
      const withoutEdge = currentEdges.filter((e) => e !== edge)
      if (withoutEdge.length === currentEdges.length) continue // déjà retirée

      if (this.hasUniqueSolution(adjacency, withoutEdge, startKey, endKey, totalCells)) {
        currentEdges = withoutEdge
      }
    }

    return currentEdges
  }

  private coordFromKey(key: string): RikudoCoord {
    const [q, r] = key.split(',').map(Number) as [number, number]
    return { q, r }
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
