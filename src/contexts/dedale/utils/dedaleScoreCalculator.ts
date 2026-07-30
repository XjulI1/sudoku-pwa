import { DedaleDifficulty } from '@/contexts/dedale/types/dedale'

/**
 * Calcule la note d'une partie de Dédale sur 10
 * Pondération: temps ≈ indice > rétractation > pause
 */
export class DedaleScoreCalculator {
  // Temps de référence par difficulté (en millisecondes)
  private static readonly REFERENCE_TIMES: Record<DedaleDifficulty, number> = {
    [DedaleDifficulty.FACILE]: 3 * 60 * 1000, // 3 minutes
    [DedaleDifficulty.MOYEN]: 7 * 60 * 1000, // 7 minutes
    [DedaleDifficulty.DIFFICILE]: 15 * 60 * 1000 // 15 minutes
  }

  // Poids des critères (total = 100)
  private static readonly WEIGHTS = {
    time: 35,
    hints: 35,
    retractions: 20,
    pause: 10
  }

  /**
   * Calcule la note finale sur 10
   */
  static calculateScore(
    difficulty: DedaleDifficulty,
    retractionsCount: number,
    hintsUsed: number,
    completionTime: number,
    pauseTime: number
  ): number {
    const retractionScore = this.calculateRetractionScore(retractionsCount)
    const hintScore = this.calculateHintScore(hintsUsed)
    const timeScore = this.calculateTimeScore(completionTime, difficulty)
    const pauseScore = this.calculatePauseScore(pauseTime)

    const weightedScore =
      (retractionScore * this.WEIGHTS.retractions +
        hintScore * this.WEIGHTS.hints +
        timeScore * this.WEIGHTS.time +
        pauseScore * this.WEIGHTS.pause) /
      100

    return Math.round(weightedScore * 10) / 10
  }

  /**
   * Calcule le score basé sur le nombre de rétractations de tracé (0-10)
   */
  private static calculateRetractionScore(retractionsCount: number): number {
    if (retractionsCount === 0) return 10
    if (retractionsCount <= 2) return 9
    if (retractionsCount <= 4) return 8
    if (retractionsCount <= 6) return 7
    if (retractionsCount <= 9) return 6
    if (retractionsCount <= 12) return 5
    if (retractionsCount <= 16) return 4
    if (retractionsCount <= 20) return 3
    if (retractionsCount <= 30) return 2
    if (retractionsCount <= 40) return 1
    return 0
  }

  /**
   * Calcule le score basé sur les indices (0-10)
   */
  private static calculateHintScore(hintsUsed: number): number {
    if (hintsUsed === 0) return 10
    if (hintsUsed === 1) return 8
    if (hintsUsed === 2) return 6
    if (hintsUsed === 3) return 5
    if (hintsUsed <= 5) return 4
    if (hintsUsed <= 7) return 3
    if (hintsUsed <= 10) return 2
    if (hintsUsed <= 15) return 1
    return 0
  }

  /**
   * Calcule le score basé sur le temps de complétion (0-10)
   */
  private static calculateTimeScore(completionTime: number, difficulty: DedaleDifficulty): number {
    const referenceTime = this.REFERENCE_TIMES[difficulty]
    const ratio = completionTime / referenceTime

    if (ratio <= 0.5) return 10
    if (ratio <= 0.75) return 9
    if (ratio <= 1.0) return 8
    if (ratio <= 1.25) return 7
    if (ratio <= 1.5) return 6
    if (ratio <= 1.75) return 5
    if (ratio <= 2.0) return 4
    if (ratio <= 2.5) return 3
    if (ratio <= 3.0) return 2
    if (ratio <= 4.0) return 1
    return 0
  }

  /**
   * Calcule le score basé sur le temps de pause (0-10)
   */
  private static calculatePauseScore(pauseTime: number): number {
    const pauseMinutes = pauseTime / (60 * 1000)

    if (pauseMinutes <= 0.5) return 10
    if (pauseMinutes <= 1) return 9
    if (pauseMinutes <= 2) return 8
    if (pauseMinutes <= 3) return 7
    if (pauseMinutes <= 5) return 6
    if (pauseMinutes <= 7) return 5
    if (pauseMinutes <= 10) return 4
    if (pauseMinutes <= 15) return 3
    if (pauseMinutes <= 20) return 2
    if (pauseMinutes <= 30) return 1
    return 0
  }
}
