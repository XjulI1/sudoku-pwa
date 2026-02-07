import { TangoDifficulty } from '@/types/tango'

/**
 * Calcule la note d'une partie de Tango sur 10
 * Pondération: erreur > indice > temps > pause
 */
export class TangoScoreCalculator {
  // Temps de référence par difficulté (en millisecondes)
  private static readonly REFERENCE_TIMES: Record<TangoDifficulty, number> = {
    [TangoDifficulty.EASY]: 3 * 60 * 1000, // 3 minutes
    [TangoDifficulty.MEDIUM]: 6 * 60 * 1000, // 6 minutes
    [TangoDifficulty.HARD]: 10 * 60 * 1000 // 10 minutes
  }

  // Poids des critères (total = 100)
  private static readonly WEIGHTS = {
    errors: 40, // Poids le plus important
    hints: 30,
    time: 20,
    pause: 10 // Poids le moins important
  }

  /**
   * Calcule la note finale sur 10
   */
  static calculateScore(
    difficulty: TangoDifficulty,
    errorsCount: number,
    hintsUsed: number,
    completionTime: number,
    pauseTime: number
  ): number {
    const errorScore = this.calculateErrorScore(errorsCount)
    const hintScore = this.calculateHintScore(hintsUsed)
    const timeScore = this.calculateTimeScore(completionTime, difficulty)
    const pauseScore = this.calculatePauseScore(pauseTime)

    // Calcul de la note pondérée
    const weightedScore =
      (errorScore * this.WEIGHTS.errors +
        hintScore * this.WEIGHTS.hints +
        timeScore * this.WEIGHTS.time +
        pauseScore * this.WEIGHTS.pause) /
      100

    // Arrondir à 1 décimale
    return Math.round(weightedScore * 10) / 10
  }

  /**
   * Calcule le score basé sur les erreurs (0-10)
   * 0 erreur = 10, puis pénalité progressive
   */
  private static calculateErrorScore(errorsCount: number): number {
    if (errorsCount === 0) return 10
    if (errorsCount === 1) return 9
    if (errorsCount === 2) return 8
    if (errorsCount === 3) return 7
    if (errorsCount <= 5) return 6
    if (errorsCount <= 7) return 5
    if (errorsCount <= 10) return 4
    if (errorsCount <= 15) return 3
    if (errorsCount <= 20) return 2
    if (errorsCount <= 30) return 1
    return 0
  }

  /**
   * Calcule le score basé sur les indices (0-10)
   * 0 indice = 10, puis pénalité progressive
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
   * Temps de référence = 10, puis pénalité progressive
   */
  private static calculateTimeScore(completionTime: number, difficulty: TangoDifficulty): number {
    const referenceTime = this.REFERENCE_TIMES[difficulty]
    const ratio = completionTime / referenceTime

    if (ratio <= 0.5) return 10 // 50% ou moins du temps de référence
    if (ratio <= 0.75) return 9
    if (ratio <= 1.0) return 8 // Temps de référence
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
   * Peu de pause = 10, puis pénalité progressive
   */
  private static calculatePauseScore(pauseTime: number): number {
    const pauseMinutes = pauseTime / (60 * 1000)

    if (pauseMinutes <= 0.5) return 10 // 30 secondes ou moins
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
