import { Game2048GridSize } from '@/types/game2048'

/**
 * Calcule la note d'une partie de 2048 sur 10
 * Basé sur : score atteint, tuile max, et temps
 */
export class Game2048ScoreCalculator {
  // Score de référence par taille de grille
  private static readonly REFERENCE_SCORES: Record<Game2048GridSize, number> = {
    [Game2048GridSize.THREE]: 2048,
    [Game2048GridSize.FOUR]: 20000,
    [Game2048GridSize.FIVE]: 50000,
  }

  // Tuile cible par taille de grille
  private static readonly TARGET_TILES: Record<Game2048GridSize, number> = {
    [Game2048GridSize.THREE]: 512,
    [Game2048GridSize.FOUR]: 2048,
    [Game2048GridSize.FIVE]: 4096,
  }

  // Temps de référence par taille (en ms)
  private static readonly REFERENCE_TIMES: Record<Game2048GridSize, number> = {
    [Game2048GridSize.THREE]: 5 * 60 * 1000,
    [Game2048GridSize.FOUR]: 15 * 60 * 1000,
    [Game2048GridSize.FIVE]: 30 * 60 * 1000,
  }

  private static readonly WEIGHTS = {
    score: 40,
    tile: 35,
    time: 25,
  }

  /**
   * Calcule la note finale sur 10
   */
  static calculateScore(
    gridSize: Game2048GridSize,
    gameScore: number,
    highestTile: number,
    completionTime: number,
    pauseTime: number,
  ): number {
    const scoreRating = this.calculateScoreRating(gameScore, gridSize)
    const tileRating = this.calculateTileRating(highestTile, gridSize)
    const timeRating = this.calculateTimeRating(completionTime - pauseTime, gridSize)

    const weightedScore =
      (scoreRating * this.WEIGHTS.score +
        tileRating * this.WEIGHTS.tile +
        timeRating * this.WEIGHTS.time) /
      100

    return Math.round(weightedScore * 10) / 10
  }

  private static calculateScoreRating(gameScore: number, gridSize: Game2048GridSize): number {
    const reference = this.REFERENCE_SCORES[gridSize]
    const ratio = gameScore / reference

    if (ratio >= 3.0) return 10
    if (ratio >= 2.0) return 9
    if (ratio >= 1.5) return 8
    if (ratio >= 1.0) return 7
    if (ratio >= 0.75) return 6
    if (ratio >= 0.5) return 5
    if (ratio >= 0.3) return 4
    if (ratio >= 0.2) return 3
    if (ratio >= 0.1) return 2
    if (ratio >= 0.05) return 1
    return 0
  }

  private static calculateTileRating(highestTile: number, gridSize: Game2048GridSize): number {
    const target = this.TARGET_TILES[gridSize]
    const ratio = highestTile / target

    if (ratio >= 4.0) return 10
    if (ratio >= 2.0) return 9
    if (ratio >= 1.0) return 8
    if (ratio >= 0.5) return 7
    if (ratio >= 0.25) return 6
    if (ratio >= 0.125) return 5
    if (ratio >= 0.0625) return 4
    return 3
  }

  private static calculateTimeRating(activeTime: number, gridSize: Game2048GridSize): number {
    const reference = this.REFERENCE_TIMES[gridSize]
    const ratio = activeTime / reference

    if (ratio <= 0.3) return 10
    if (ratio <= 0.5) return 9
    if (ratio <= 0.75) return 8
    if (ratio <= 1.0) return 7
    if (ratio <= 1.5) return 6
    if (ratio <= 2.0) return 5
    if (ratio <= 3.0) return 4
    if (ratio <= 4.0) return 3
    if (ratio <= 5.0) return 2
    if (ratio <= 7.0) return 1
    return 0
  }
}
