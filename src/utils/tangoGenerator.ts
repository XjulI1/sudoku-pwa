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
   * Vérifie que la solution reste unique après chaque retrait
   */
  private createPuzzle(
    solution: TangoSymbol[][],
    constraints: TangoConstraint[],
    difficulty: TangoDifficulty
  ): TangoSymbol[][] {
    const puzzle: TangoSymbol[][] = solution.map((row) => [...row])

    // Nombre de cellules à retirer
    const cellsToRemove = {
      [TangoDifficulty.EASY]: 18, // 50%
      [TangoDifficulty.MEDIUM]: 24, // 67%
      [TangoDifficulty.HARD]: 30 // 83%
    }

    const targetRemove = cellsToRemove[difficulty]

    // Créer une liste de toutes les positions et la mélanger
    const positions: { row: number; col: number }[] = []
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        positions.push({ row, col })
      }
    }

    const shuffled = this.shuffle(positions)
    let removed = 0

    // Retirer les cellules une par une en vérifiant l'unicité
    for (const { row, col } of shuffled) {
      if (removed >= targetRemove) break

      const backup = puzzle[row]![col]!
      puzzle[row]![col] = TangoSymbol.EMPTY

      // Vérifier que la grille a toujours une solution unique
      if (this.hasUniqueSolution(puzzle, constraints)) {
        removed++
      } else {
        // Remettre la valeur si la solution n'est plus unique
        puzzle[row]![col] = backup
      }
    }

    return puzzle
  }

  /**
   * Vérifie si la grille a une solution unique
   */
  private hasUniqueSolution(
    grid: TangoSymbol[][],
    constraints: TangoConstraint[]
  ): boolean {
    const solutions: TangoSymbol[][][] = []
    const tempGrid = grid.map((row) => [...row])
    this.countSolutions(tempGrid, constraints, solutions, 2)
    return solutions.length === 1
  }

  /**
   * Compte le nombre de solutions (s'arrête à maxSolutions pour optimisation)
   */
  private countSolutions(
    grid: TangoSymbol[][],
    constraints: TangoConstraint[],
    solutions: TangoSymbol[][][],
    maxSolutions: number
  ): void {
    if (solutions.length >= maxSolutions) return

    // Trouver la première cellule vide
    let emptyRow = -1
    let emptyCol = -1

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row]![col] === TangoSymbol.EMPTY) {
          emptyRow = row
          emptyCol = col
          break
        }
      }
      if (emptyRow !== -1) break
    }

    // Si aucune cellule vide, on a trouvé une solution
    if (emptyRow === -1) {
      solutions.push(grid.map((row) => [...row]))
      return
    }

    // Essayer SUN et MOON
    for (const symbol of [TangoSymbol.SUN, TangoSymbol.MOON]) {
      grid[emptyRow]![emptyCol] = symbol

      if (this.isValidPlacementWithConstraints(grid, emptyRow, emptyCol, constraints)) {
        this.countSolutions(grid, constraints, solutions, maxSolutions)
      }

      grid[emptyRow]![emptyCol] = TangoSymbol.EMPTY
    }
  }

  /**
   * Vérifie si le placement est valide en tenant compte des contraintes
   */
  private isValidPlacementWithConstraints(
    grid: TangoSymbol[][],
    row: number,
    col: number,
    constraints: TangoConstraint[]
  ): boolean {
    const symbol = grid[row]![col]!

    // Règle 1 : Pas de 3 symboles identiques consécutifs horizontalement
    // Vérifier à gauche (cette cellule est la 3ème)
    if (col >= 2) {
      if (grid[row]![col - 1] === symbol && grid[row]![col - 2] === symbol) {
        return false
      }
    }
    // Vérifier au milieu (cette cellule est la 2ème)
    if (col >= 1 && col < GRID_SIZE - 1) {
      const leftCell: TangoSymbol | undefined = grid[row]![col - 1]
      const rightCell: TangoSymbol | undefined = grid[row]![col + 1]
      if (
        leftCell === symbol &&
        rightCell === symbol &&
        rightCell !== TangoSymbol.EMPTY
      ) {
        return false
      }
    }
    // Vérifier à droite (cette cellule est la 1ère)
    if (col < GRID_SIZE - 2) {
      const cell1: TangoSymbol | undefined = grid[row]![col + 1]
      const cell2: TangoSymbol | undefined = grid[row]![col + 2]
      if (
        cell1 === symbol &&
        cell2 === symbol &&
        cell1 !== TangoSymbol.EMPTY &&
        cell2 !== TangoSymbol.EMPTY
      ) {
        return false
      }
    }

    // Règle 2 : Pas de 3 symboles identiques consécutifs verticalement
    // Vérifier en haut (cette cellule est la 3ème)
    if (row >= 2) {
      if (grid[row - 1]![col] === symbol && grid[row - 2]![col] === symbol) {
        return false
      }
    }
    // Vérifier au milieu (cette cellule est la 2ème)
    if (row >= 1 && row < GRID_SIZE - 1) {
      const topCell: TangoSymbol | undefined = grid[row - 1]![col]
      const bottomCell: TangoSymbol | undefined = grid[row + 1]![col]
      if (
        topCell === symbol &&
        bottomCell === symbol &&
        bottomCell !== TangoSymbol.EMPTY
      ) {
        return false
      }
    }
    // Vérifier en bas (cette cellule est la 1ère)
    if (row < GRID_SIZE - 2) {
      const cell1: TangoSymbol | undefined = grid[row + 1]![col]
      const cell2: TangoSymbol | undefined = grid[row + 2]![col]
      if (
        cell1 === symbol &&
        cell2 === symbol &&
        cell1 !== TangoSymbol.EMPTY &&
        cell2 !== TangoSymbol.EMPTY
      ) {
        return false
      }
    }

    // Règle 3 : Maximum 3 symboles identiques par ligne
    const rowSymbols = grid[row]!.filter((s) => s === symbol)
    if (rowSymbols.length > 3) {
      return false
    }

    // Règle 4 : Maximum 3 symboles identiques par colonne
    const colSymbols = grid.filter((r) => r[col] === symbol)
    if (colSymbols.length > 3) {
      return false
    }

    // Règle 5 : Vérifier les contraintes
    for (const constraint of constraints) {
      // Contrainte horizontale partant de cette cellule
      if (
        constraint.row === row &&
        constraint.col === col &&
        constraint.direction === ConstraintDirection.HORIZONTAL
      ) {
        const rightCell: TangoSymbol | undefined = grid[row]![col + 1]
        if (rightCell !== undefined && rightCell !== TangoSymbol.EMPTY) {
          if (constraint.type === ConstraintType.EQUALS) {
            if (symbol !== rightCell) return false
          } else {
            if (symbol === rightCell) return false
          }
        }
      }

      // Contrainte horizontale arrivant à cette cellule
      if (
        constraint.row === row &&
        constraint.col === col - 1 &&
        constraint.direction === ConstraintDirection.HORIZONTAL
      ) {
        const leftCell: TangoSymbol | undefined = grid[row]![col - 1]
        if (leftCell !== undefined && leftCell !== TangoSymbol.EMPTY) {
          if (constraint.type === ConstraintType.EQUALS) {
            if (symbol !== leftCell) return false
          } else {
            if (symbol === leftCell) return false
          }
        }
      }

      // Contrainte verticale partant de cette cellule
      if (
        constraint.row === row &&
        constraint.col === col &&
        constraint.direction === ConstraintDirection.VERTICAL
      ) {
        const bottomCell: TangoSymbol | undefined = grid[row + 1]?.[col]
        if (bottomCell !== undefined && bottomCell !== TangoSymbol.EMPTY) {
          if (constraint.type === ConstraintType.EQUALS) {
            if (symbol !== bottomCell) return false
          } else {
            if (symbol === bottomCell) return false
          }
        }
      }

      // Contrainte verticale arrivant à cette cellule
      if (
        constraint.row === row - 1 &&
        constraint.col === col &&
        constraint.direction === ConstraintDirection.VERTICAL
      ) {
        const topCell: TangoSymbol | undefined = grid[row - 1]?.[col]
        if (topCell !== undefined && topCell !== TangoSymbol.EMPTY) {
          if (constraint.type === ConstraintType.EQUALS) {
            if (symbol !== topCell) return false
          } else {
            if (symbol === topCell) return false
          }
        }
      }
    }

    return true
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
