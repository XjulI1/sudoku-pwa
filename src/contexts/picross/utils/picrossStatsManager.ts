import type { PicrossGameStats, PicrossDifficultyStats } from '@/contexts/picross/types/picross'
import { PicrossDifficulty } from '@/contexts/picross/types/picross'
import { PicrossScoreCalculator } from './picrossScoreCalculator'

const STATS_STORAGE_KEY = 'picross-statistics'

/**
 * Gestionnaire des statistiques de jeu Picross
 */
export class PicrossStatsManager {
  static saveGameStats(
    difficulty: PicrossDifficulty,
    completionTime: number,
    errorsCount: number,
    hintsUsed: number,
    pauseTime: number
  ): void {
    const score = PicrossScoreCalculator.calculateScore(
      difficulty,
      errorsCount,
      hintsUsed,
      completionTime,
      pauseTime
    )

    const gameStat: PicrossGameStats = {
      difficulty,
      completionTime,
      errorsCount,
      hintsUsed,
      pauseTime,
      score,
      completedAt: Date.now()
    }

    const allStats = this.loadAllStats()
    const diffStats = allStats[difficulty]

    if (diffStats) {
      diffStats.history.push(gameStat)
      diffStats.gamesPlayed++
      diffStats.totalErrors += errorsCount
      diffStats.totalHints += hintsUsed

      diffStats.averageTime =
        diffStats.history.reduce((sum, s) => sum + s.completionTime, 0) / diffStats.gamesPlayed
      diffStats.averageScore =
        diffStats.history.reduce((sum, s) => sum + s.score, 0) / diffStats.gamesPlayed

      if (score > diffStats.bestScore) {
        diffStats.bestScore = score
      }
      if (completionTime < diffStats.bestTime || diffStats.bestTime === 0) {
        diffStats.bestTime = completionTime
      }
    } else {
      allStats[difficulty] = {
        difficulty,
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

  static loadAllStats(): Record<PicrossDifficulty, PicrossDifficultyStats | undefined> {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY)
      if (!saved) {
        return this.createEmptyStats()
      }
      return JSON.parse(saved)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques Picross:', error)
      return this.createEmptyStats()
    }
  }

  static loadDifficultyStats(difficulty: PicrossDifficulty): PicrossDifficultyStats | null {
    const allStats = this.loadAllStats()
    return allStats[difficulty] || null
  }

  private static saveAllStats(
    stats: Record<PicrossDifficulty, PicrossDifficultyStats | undefined>
  ): void {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des statistiques Picross:', error)
    }
  }

  private static createEmptyStats(): Record<PicrossDifficulty, PicrossDifficultyStats | undefined> {
    return {
      [PicrossDifficulty.EASY]: undefined,
      [PicrossDifficulty.MEDIUM_SMALL]: undefined,
      [PicrossDifficulty.MEDIUM]: undefined,
      [PicrossDifficulty.MEDIUM_LARGE]: undefined,
      [PicrossDifficulty.HARD]: undefined
    }
  }

  static resetAllStats(): void {
    localStorage.removeItem(STATS_STORAGE_KEY)
  }

  static getTotalGamesPlayed(): number {
    const allStats = this.loadAllStats()
    return Object.values(allStats).reduce((total, stats) => {
      return total + (stats?.gamesPlayed || 0)
    }, 0)
  }

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

  static formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}
