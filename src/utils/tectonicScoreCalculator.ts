import { TectonicDifficulty } from '@/types/tectonic'

/**
 * Calcule la note d'une partie de Tectonic sur 10
 * Pondération: erreur > indice > temps > pause
 */
export class TectonicScoreCalculator {
  // Temps de référence par difficulté (en millisecondes)
  private static readonly REFERENCE_TIMES: Record<TectonicDifficulty, number> = {
    [TectonicDifficulty.FACILE]: 4 * 60 * 1000, // 4 minutes (6x6)
    [TectonicDifficulty.MOYEN]: 8 * 60 * 1000, // 8 minutes (8x8)
    [TectonicDifficulty.DIFFICILE]: 14 * 60 * 1000, // 14 minutes (10x8)
    [TectonicDifficulty.EXPERT]: 20 * 60 * 1000 // 20 minutes (10x10)
  }

  // Poids des critères (total = 100)
  private static readonly WEIGHTS = {
    errors: 40,
    hints: 30,
    time: 20,
    pause: 10
  }

  static calculateScore(
    difficulty: TectonicDifficulty,
    errorsCount: number,
    hintsUsed: number,
    completionTime: number,
    pauseTime: number
  ): number {
    const errorScore = this.calculateErrorScore(errorsCount)
    const hintScore = this.calculateHintScore(hintsUsed)
    const timeScore = this.calculateTimeScore(completionTime, difficulty)
    const pauseScore = this.calculatePauseScore(pauseTime)

    const weightedScore =
      (errorScore * this.WEIGHTS.errors +
        hintScore * this.WEIGHTS.hints +
        timeScore * this.WEIGHTS.time +
        pauseScore * this.WEIGHTS.pause) /
      100

    return Math.round(weightedScore * 10) / 10
  }

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

  private static calculateTimeScore(completionTime: number, difficulty: TectonicDifficulty): number {
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
