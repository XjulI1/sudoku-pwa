import { MinesweeperDifficulty } from '@/types/minesweeper'

/**
 * Calcule la note d'une partie de Démineur sur 10
 * Basé sur : victoire, temps, et efficacité des drapeaux
 */
export class MinesweeperScoreCalculator {
  // Temps de référence par difficulté (en millisecondes)
  private static readonly REFERENCE_TIMES: Record<MinesweeperDifficulty, number> = {
    [MinesweeperDifficulty.BEGINNER]: 2 * 60 * 1000, // 2 minutes
    [MinesweeperDifficulty.INTERMEDIATE]: 8 * 60 * 1000, // 8 minutes
    [MinesweeperDifficulty.EXPERT]: 20 * 60 * 1000 // 20 minutes
  }

  private static readonly WEIGHTS = {
    time: 60,
    pause: 20,
    flags: 20
  }

  /**
   * Calcule la note finale sur 10 (uniquement pour les parties gagnées)
   */
  static calculateScore(
    difficulty: MinesweeperDifficulty,
    completionTime: number,
    pauseTime: number,
    flagsUsed: number,
    totalMines: number
  ): number {
    const timeScore = this.calculateTimeScore(completionTime, difficulty)
    const pauseScore = this.calculatePauseScore(pauseTime)
    const flagScore = this.calculateFlagScore(flagsUsed, totalMines)

    const weightedScore =
      (timeScore * this.WEIGHTS.time +
        pauseScore * this.WEIGHTS.pause +
        flagScore * this.WEIGHTS.flags) /
      100

    return Math.round(weightedScore * 10) / 10
  }

  private static calculateTimeScore(completionTime: number, difficulty: MinesweeperDifficulty): number {
    const referenceTime = this.REFERENCE_TIMES[difficulty]
    const ratio = completionTime / referenceTime

    if (ratio <= 0.3) return 10
    if (ratio <= 0.5) return 9
    if (ratio <= 0.75) return 8
    if (ratio <= 1.0) return 7
    if (ratio <= 1.25) return 6
    if (ratio <= 1.5) return 5
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

  private static calculateFlagScore(flagsUsed: number, totalMines: number): number {
    // Score parfait si exactement le bon nombre de drapeaux
    const ratio = flagsUsed / totalMines
    if (ratio <= 1.0) return 10
    if (ratio <= 1.1) return 9
    if (ratio <= 1.2) return 8
    if (ratio <= 1.3) return 7
    if (ratio <= 1.5) return 6
    if (ratio <= 1.75) return 5
    if (ratio <= 2.0) return 4
    return 3
  }
}
