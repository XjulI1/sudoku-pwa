import type { GameStats, DifficultyStats } from '@/types/sudoku'
import { Difficulty, GridSize } from '@/types/sudoku'
import { ScoreCalculator } from './scoreCalculator'

const STATS_STORAGE_KEY = 'sudoku-statistics'

/**
 * Gestionnaire des statistiques de jeu
 * Sauvegarde et gère l'historique par niveau de difficulté
 */
export class StatsManager {
  /**
   * Enregistre une partie terminée
   */
  static saveGameStats(
    difficulty: Difficulty,
    gridSize: GridSize,
    completionTime: number,
    errorsCount: number,
    hintsUsed: number,
    notesUsed: number,
    pauseTime: number
  ): void {
    const score = ScoreCalculator.calculateScore(
      difficulty,
      errorsCount,
      hintsUsed,
      completionTime,
      pauseTime
    )

    const gameStat: GameStats = {
      difficulty,
      gridSize,
      completionTime,
      errorsCount,
      hintsUsed,
      notesUsed,
      pauseTime,
      score,
      completedAt: Date.now()
    }

    const allStats = this.loadAllStats()
    const statsKey = `${difficulty}-${gridSize}` as Difficulty
    const diffStats = allStats[statsKey]

    if (diffStats) {
      diffStats.history.push(gameStat)
      diffStats.gamesPlayed++
      diffStats.totalErrors += errorsCount
      diffStats.totalHints += hintsUsed

      // Mettre à jour les moyennes
      diffStats.averageTime =
        diffStats.history.reduce((sum, s) => sum + s.completionTime, 0) / diffStats.gamesPlayed
      diffStats.averageScore =
        diffStats.history.reduce((sum, s) => sum + s.score, 0) / diffStats.gamesPlayed

      // Mettre à jour les records
      if (score > diffStats.bestScore) {
        diffStats.bestScore = score
      }
      if (completionTime < diffStats.bestTime || diffStats.bestTime === 0) {
        diffStats.bestTime = completionTime
      }
    } else {
      // Première partie pour cette difficulté
      allStats[statsKey] = {
        difficulty,
        gridSize,
        gamesPlayed: 1,
        averageTime: completionTime,
        averageScore: score,
        bestScore: score,
        bestTime: completionTime,
        totalErrors: errorsCount,
        totalHints: hintsUsed,
        history: [gameStat]
      }
    }

    this.saveAllStats(allStats)
  }

  /**
   * Charge toutes les statistiques
   */
  static loadAllStats(): Record<Difficulty, DifficultyStats | undefined> {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY)
      if (!saved) {
        return this.createEmptyStats()
      }
      return JSON.parse(saved)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      return this.createEmptyStats()
    }
  }

  /**
   * Charge les statistiques d'une difficulté spécifique
   */
  static loadDifficultyStats(difficulty: Difficulty): DifficultyStats | null {
    const allStats = this.loadAllStats()
    return allStats[difficulty] || null
  }

  /**
   * Sauvegarde toutes les statistiques
   */
  private static saveAllStats(stats: Record<Difficulty, DifficultyStats | undefined>): void {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des statistiques:', error)
    }
  }

  /**
   * Crée une structure vide pour les statistiques
   */
  private static createEmptyStats(): Record<Difficulty, DifficultyStats | undefined> {
    return {
      [Difficulty.SIMPLE]: undefined,
      [Difficulty.NORMAL]: undefined,
      [Difficulty.EXPERT]: undefined,
      [Difficulty.MAITRE]: undefined,
      [Difficulty.DIEUX_SUDOKU]: undefined
    }
  }

  /**
   * Réinitialise toutes les statistiques
   */
  static resetAllStats(): void {
    localStorage.removeItem(STATS_STORAGE_KEY)
  }

  /**
   * Réinitialise les statistiques d'une difficulté
   */
  static resetDifficultyStats(difficulty: Difficulty): void {
    const allStats = this.loadAllStats()
    allStats[difficulty] = undefined
    this.saveAllStats(allStats)
  }

  /**
   * Obtient le nombre total de parties jouées
   */
  static getTotalGamesPlayed(): number {
    const allStats = this.loadAllStats()
    return Object.values(allStats).reduce((total, stats) => {
      return total + (stats?.gamesPlayed || 0)
    }, 0)
  }

  /**
   * Obtient la meilleure note globale
   */
  static getBestScore(): number {
    const allStats = this.loadAllStats()
    let bestScore = 0
    Object.values(allStats).forEach((stats) => {
      if (stats && stats.bestScore > bestScore) {
        bestScore = stats.bestScore
      }
    })
    return bestScore
  }

  /**
   * Formate le temps en minutes:secondes
   */
  static formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}
