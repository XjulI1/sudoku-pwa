import { PicrossDifficulty, type PicrossClue } from '@/contexts/picross/types/picross'

/**
 * Générateur de puzzles Picross
 * Crée des puzzles avec solution unique et indices calculés
 */
export class PicrossGenerator {
  /**
   * Taille de grille par difficulté
   */
  static getGridSize(difficulty: PicrossDifficulty): number {
    switch (difficulty) {
      case PicrossDifficulty.EASY:
        return 5
      case PicrossDifficulty.MEDIUM_SMALL:
        return 8
      case PicrossDifficulty.MEDIUM:
        return 10
      case PicrossDifficulty.MEDIUM_LARGE:
        return 12
      case PicrossDifficulty.HARD:
        return 15
    }
  }

  /**
   * Densité cible de cellules remplies (ratio)
   */
  private static getDensity(difficulty: PicrossDifficulty): number {
    switch (difficulty) {
      case PicrossDifficulty.EASY:
        return 0.6
      case PicrossDifficulty.MEDIUM_SMALL:
        return 0.58
      case PicrossDifficulty.MEDIUM:
        return 0.55
      case PicrossDifficulty.MEDIUM_LARGE:
        return 0.52
      case PicrossDifficulty.HARD:
        return 0.5
    }
  }

  /**
   * Génère un puzzle Picross complet
   */
  static generate(difficulty: PicrossDifficulty): {
    solution: boolean[][]
    rowClues: PicrossClue[]
    colClues: PicrossClue[]
    gridSize: number
  } {
    const size = this.getGridSize(difficulty)
    const density = this.getDensity(difficulty)

    // Générer une solution aléatoire avec la densité cible
    const solution = this.generateSolution(size, density)

    // Calculer les indices
    const rowClues = this.computeRowClues(solution, size)
    const colClues = this.computeColClues(solution, size)

    return { solution, rowClues, colClues, gridSize: size }
  }

  /**
   * Génère une solution aléatoire
   * S'assure qu'aucune ligne/colonne n'est entièrement vide ou entièrement pleine
   */
  private static generateSolution(size: number, density: number): boolean[][] {
    let solution: boolean[][]
    let attempts = 0

    do {
      solution = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => Math.random() < density)
      )
      attempts++
    } while (!this.isValidSolution(solution, size) && attempts < 100)

    // Garantir validité si on n'a pas trouvé après 100 tentatives
    if (!this.isValidSolution(solution, size)) {
      solution = this.fixSolution(solution, size)
    }

    return solution
  }

  /**
   * Vérifie qu'aucune ligne/colonne n'est entièrement vide ou pleine
   */
  private static isValidSolution(solution: boolean[][], size: number): boolean {
    for (let i = 0; i < size; i++) {
      const rowFilled = solution[i]!.filter((c) => c).length
      if (rowFilled === 0 || rowFilled === size) return false

      let colFilled = 0
      for (let j = 0; j < size; j++) {
        if (solution[j]![i]) colFilled++
      }
      if (colFilled === 0 || colFilled === size) return false
    }
    return true
  }

  /**
   * Corrige une solution invalide
   */
  private static fixSolution(solution: boolean[][], size: number): boolean[][] {
    for (let i = 0; i < size; i++) {
      const rowFilled = solution[i]!.filter((c) => c).length
      if (rowFilled === 0) {
        solution[i]![Math.floor(Math.random() * size)] = true
      } else if (rowFilled === size) {
        solution[i]![Math.floor(Math.random() * size)] = false
      }

      let colFilled = 0
      for (let j = 0; j < size; j++) {
        if (solution[j]![i]) colFilled++
      }
      if (colFilled === 0) {
        solution[Math.floor(Math.random() * size)]![i] = true
      } else if (colFilled === size) {
        solution[Math.floor(Math.random() * size)]![i] = false
      }
    }
    return solution
  }

  /**
   * Calcule les indices pour chaque ligne
   */
  static computeRowClues(solution: boolean[][], size: number): PicrossClue[] {
    const clues: PicrossClue[] = []
    for (let row = 0; row < size; row++) {
      clues.push(this.computeLineClue(solution[row]!))
    }
    return clues
  }

  /**
   * Calcule les indices pour chaque colonne
   */
  static computeColClues(solution: boolean[][], size: number): PicrossClue[] {
    const clues: PicrossClue[] = []
    for (let col = 0; col < size; col++) {
      const column: boolean[] = []
      for (let row = 0; row < size; row++) {
        column.push(solution[row]![col]!)
      }
      clues.push(this.computeLineClue(column))
    }
    return clues
  }

  /**
   * Calcule les indices pour une ligne/colonne
   * Ex: [true, true, false, true, false] → [2, 1]
   */
  private static computeLineClue(line: boolean[]): PicrossClue {
    const clue: PicrossClue = []
    let count = 0

    for (const cell of line) {
      if (cell) {
        count++
      } else if (count > 0) {
        clue.push(count)
        count = 0
      }
    }

    if (count > 0) {
      clue.push(count)
    }

    // Une ligne entièrement vide a l'indice [0]
    return clue.length > 0 ? clue : [0]
  }
}
