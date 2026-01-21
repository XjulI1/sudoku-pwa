import {
  TangoSymbol,
  ConstraintType,
  ConstraintDirection,
  type TangoConstraint,
  TangoDifficulty
} from '@/types/tango'

const GRID_SIZE = 6

export class TangoGenerator {
  /**
   * Génère un puzzle Tango complet avec contraintes
   */
  generate(difficulty: TangoDifficulty): {
    puzzle: TangoSymbol[][]
    solution: TangoSymbol[][]
    constraints: TangoConstraint[]
  } {
    // 1. Générer une grille complète valide
    const solution = this.generateCompleteGrid()

    // 2. Générer des contraintes basées sur la solution
    const constraints = this.generateConstraints(solution, difficulty)

    // 3. Créer le puzzle en retirant des cellules
    const puzzle = this.createPuzzle(solution, constraints, difficulty)

    return { puzzle, solution, constraints }
  }

  /**
   * Génère une grille 6x6 complète qui respecte toutes les règles Tango
   */
  private generateCompleteGrid(): TangoSymbol[][] {
    const grid: TangoSymbol[][] = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(TangoSymbol.EMPTY)
    )

    // Utiliser un algorithme de backtracking pour remplir la grille
    this.fillGrid(grid, 0, 0)

    return grid
  }

  /**
   * Remplit la grille avec backtracking
   */
  private fillGrid(grid: TangoSymbol[][], row: number, col: number): boolean {
    // Si on a rempli toutes les lignes, on a réussi
    if (row === GRID_SIZE) {
      return true
    }

    // Calculer la prochaine position
    const nextRow = col === GRID_SIZE - 1 ? row + 1 : row
    const nextCol = col === GRID_SIZE - 1 ? 0 : col + 1

    // Essayer SUN et MOON dans un ordre aléatoire
    const symbols = this.shuffle([TangoSymbol.SUN, TangoSymbol.MOON])

    for (const symbol of symbols) {
      grid[row]![col] = symbol

      if (this.isValidPlacement(grid, row, col)) {
        if (this.fillGrid(grid, nextRow, nextCol)) {
          return true
        }
      }
    }

    // Backtrack
    grid[row]![col] = TangoSymbol.EMPTY
    return false
  }

  /**
   * Vérifie si le placement d'un symbole est valide
   */
  private isValidPlacement(grid: TangoSymbol[][], row: number, col: number): boolean {
    const symbol = grid[row]![col]!

    // Règle 1 : Pas de 3 symboles identiques consécutifs horizontalement
    if (col >= 2) {
      if (grid[row]![col - 1] === symbol && grid[row]![col - 2] === symbol) {
        return false
      }
    }

    // Règle 2 : Pas de 3 symboles identiques consécutifs verticalement
    if (row >= 2) {
      if (grid[row - 1]![col] === symbol && grid[row - 2]![col] === symbol) {
        return false
      }
    }

    // Règle 3 : Si la ligne est complète, vérifier qu'il y a exactement 3 de chaque symbole
    if (col === GRID_SIZE - 1) {
      const sunCount = grid[row]!.filter((s) => s === TangoSymbol.SUN).length
      const moonCount = grid[row]!.filter((s) => s === TangoSymbol.MOON).length
      if (sunCount !== 3 || moonCount !== 3) {
        return false
      }
    }

    // Règle 4 : Vérifier le compte dans la colonne (seulement si on peut déjà déterminer qu'on dépasse)
    const sunCountCol = grid.filter((r) => r[col] === TangoSymbol.SUN).length
    const moonCountCol = grid.filter((r) => r[col] === TangoSymbol.MOON).length

    if (sunCountCol > 3 || moonCountCol > 3) {
      return false
    }

    // Si on est à la dernière ligne, vérifier que la colonne a exactement 3 de chaque
    if (row === GRID_SIZE - 1) {
      if (sunCountCol !== 3 || moonCountCol !== 3) {
        return false
      }
    }

    return true
  }

  /**
   * Génère des contraintes basées sur la solution
   */
  private generateConstraints(
    solution: TangoSymbol[][],
    difficulty: TangoDifficulty
  ): TangoConstraint[] {
    const constraints: TangoConstraint[] = []

    // Nombre de contraintes selon la difficulté
    const constraintCounts = {
      [TangoDifficulty.EASY]: 8,
      [TangoDifficulty.MEDIUM]: 6,
      [TangoDifficulty.HARD]: 4
    }

    const targetCount = constraintCounts[difficulty]
    const possibleConstraints: TangoConstraint[] = []

    // Générer toutes les contraintes possibles
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        // Contrainte horizontale (vers la droite)
        if (col < GRID_SIZE - 1) {
          const type =
            solution[row]![col] === solution[row]![col + 1]
              ? ConstraintType.EQUALS
              : ConstraintType.NOT_EQUALS

          possibleConstraints.push({
            row,
            col,
            type,
            direction: ConstraintDirection.HORIZONTAL
          })
        }

        // Contrainte verticale (vers le bas)
        if (row < GRID_SIZE - 1) {
          const type =
            solution[row]![col] === solution[row + 1]![col]
              ? ConstraintType.EQUALS
              : ConstraintType.NOT_EQUALS

          possibleConstraints.push({
            row,
            col,
            type,
            direction: ConstraintDirection.VERTICAL
          })
        }
      }
    }

    // Sélectionner aléatoirement des contraintes
    const shuffled = this.shuffle(possibleConstraints)
    for (let i = 0; i < Math.min(targetCount, shuffled.length); i++) {
      constraints.push(shuffled[i]!)
    }

    return constraints
  }

  /**
   * Crée un puzzle en retirant des cellules de la solution
   */
  private createPuzzle(
    solution: TangoSymbol[][],
    constraints: TangoConstraint[],
    difficulty: TangoDifficulty
  ): TangoSymbol[][] {
    const puzzle: TangoSymbol[][] = solution.map((row) => [...row])

    // Nombre de cellules à laisser visibles
    const visibleCells = {
      [TangoDifficulty.EASY]: 18, // 50%
      [TangoDifficulty.MEDIUM]: 12, // 33%
      [TangoDifficulty.HARD]: 6 // 17%
    }

    const targetVisible = visibleCells[difficulty]

    // Créer une liste de toutes les positions
    const positions: { row: number; col: number }[] = []
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        positions.push({ row, col })
      }
    }

    // Mélanger et garder seulement les premières positions
    const shuffled = this.shuffle(positions)
    const toKeep = new Set(
      shuffled.slice(0, targetVisible).map((p) => `${p.row},${p.col}`)
    )

    // Vider les cellules qui ne sont pas dans toKeep
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!toKeep.has(`${row},${col}`)) {
          puzzle[row]![col] = TangoSymbol.EMPTY
        }
      }
    }

    return puzzle
  }

  /**
   * Mélange un tableau (Fisher-Yates shuffle)
   */
  private shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j]!, result[i]!]
    }
    return result
  }
}
