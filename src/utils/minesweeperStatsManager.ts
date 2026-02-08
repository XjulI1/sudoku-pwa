import type { MinesweeperGameStats, MinesweeperDifficultyStats } from '@/types/minesweeper'
import { MinesweeperDifficulty } from '@/types/minesweeper'
import { MinesweeperScoreCalculator } from './minesweeperScoreCalculator'

const STATS_STORAGE_KEY = 'minesweeper-statistics'

/**
 * Gestionnaire des statistiques du Démineur
 */
export class MinesweeperStatsManager {
  static saveGameStats(
    difficulty: MinesweeperDifficulty,
    completionTime: number,
    won: boolean,
    flagsUsed: number,
    cellsRevealed: number,
    totalCells: number,
    totalMines: number,
    pauseTime: number
  ): void {
    const score = won
      ? MinesweeperScoreCalculator.calculateScore(
          difficulty,
          completionTime,
          pauseTime,
          flagsUsed,
          totalMines
        )
      : 0

    const gameStat: MinesweeperGameStats = {
      difficulty,
      completionTime,
      won,
      flagsUsed,
      cellsRevealed,
      totalCells,
      pauseTime,
      score,
      completedAt: Date.now()
    }

    const allStats = this.loadAllStats()
    const diffStats = allStats[difficulty]

    if (diffStats) {
      diffStats.history.push(gameStat)
      diffStats.gamesPlayed++
      if (won) {
        diffStats.gamesWon++
      }
      diffStats.winRate = diffStats.gamesWon / diffStats.gamesPlayed

      // Moyennes uniquement sur les parties gagnées
      const wonGames = diffStats.history.filter((s) => s.won)
      if (wonGames.length > 0) {
        diffStats.averageTime =
          wonGames.reduce((sum, s) => sum + s.completionTime, 0) / wonGames.length
        diffStats.averageScore =
          wonGames.reduce((sum, s) => sum + s.score, 0) / wonGames.length
      }

      if (won) {
        if (score > diffStats.bestScore) {
          diffStats.bestScore = score
        }
        if (completionTime < diffStats.bestTime || diffStats.bestTime === 0) {
          diffStats.bestTime = completionTime
        }
      }
    } else {
      allStats[difficulty] = {
        difficulty,
        gamesPlayed: 1,
        gamesWon: won ? 1 : 0,
        averageTime: won ? completionTime : 0,
        averageScore: score,
        bestScore: score,
        bestTime: won ? completionTime : 0,
        winRate: won ? 1 : 0,
        history: [gameStat]
      }
    }

    this.saveAllStats(allStats)
  }

  static loadAllStats(): Record<MinesweeperDifficulty, MinesweeperDifficultyStats | undefined> {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY)
      if (!saved) {
        return this.createEmptyStats()
      }
      return JSON.parse(saved)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques Démineur:', error)
      return this.createEmptyStats()
    }
  }

  static loadDifficultyStats(
    difficulty: MinesweeperDifficulty
  ): MinesweeperDifficultyStats | null {
    const allStats = this.loadAllStats()
    return allStats[difficulty] || null
  }

  private static saveAllStats(
    stats: Record<MinesweeperDifficulty, MinesweeperDifficultyStats | undefined>
  ): void {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des statistiques Démineur:', error)
    }
  }

  private static createEmptyStats(): Record<
    MinesweeperDifficulty,
    MinesweeperDifficultyStats | undefined
  > {
    return {
      [MinesweeperDifficulty.BEGINNER]: undefined,
      [MinesweeperDifficulty.INTERMEDIATE]: undefined,
      [MinesweeperDifficulty.EXPERT]: undefined
    }
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
