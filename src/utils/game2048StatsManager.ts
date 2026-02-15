import type { Game2048GameStats, Game2048GridSizeStats } from '@/types/game2048'
import { Game2048GridSize } from '@/types/game2048'
import { Game2048ScoreCalculator } from './game2048ScoreCalculator'

const STATS_STORAGE_KEY = 'game2048-statistics'

/**
 * Gestionnaire des statistiques du 2048
 */
export class Game2048StatsManager {
  static saveGameStats(
    gridSize: Game2048GridSize,
    score: number,
    highestTile: number,
    completionTime: number,
    won: boolean,
    pauseTime: number,
  ): void {
    const noteScore = Game2048ScoreCalculator.calculateScore(
      gridSize,
      score,
      highestTile,
      completionTime,
      pauseTime,
    )

    const gameStat: Game2048GameStats = {
      gridSize,
      score,
      highestTile,
      completionTime,
      won,
      pauseTime,
      noteScore,
      completedAt: Date.now(),
    }

    const allStats = this.loadAllStats()
    const sizeStats = allStats[gridSize]

    if (sizeStats) {
      sizeStats.history.push(gameStat)
      sizeStats.gamesPlayed++
      if (won) {
        sizeStats.gamesWon++
      }
      sizeStats.winRate = sizeStats.gamesWon / sizeStats.gamesPlayed

      sizeStats.averageTime =
        sizeStats.history.reduce((sum, s) => sum + s.completionTime, 0) / sizeStats.history.length
      sizeStats.averageScore =
        sizeStats.history.reduce((sum, s) => sum + s.noteScore, 0) / sizeStats.history.length

      if (noteScore > sizeStats.bestScore) {
        sizeStats.bestScore = noteScore
      }
      if (completionTime < sizeStats.bestTime || sizeStats.bestTime === 0) {
        sizeStats.bestTime = completionTime
      }
      if (highestTile > sizeStats.highestTile) {
        sizeStats.highestTile = highestTile
      }
    } else {
      allStats[gridSize] = {
        gridSize,
        gamesPlayed: 1,
        gamesWon: won ? 1 : 0,
        averageTime: completionTime,
        averageScore: noteScore,
        bestScore: noteScore,
        bestTime: completionTime,
        winRate: won ? 1 : 0,
        highestTile: highestTile,
        history: [gameStat],
      }
    }

    this.saveAllStats(allStats)
  }

  static loadAllStats(): Record<Game2048GridSize, Game2048GridSizeStats | undefined> {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY)
      if (!saved) {
        return this.createEmptyStats()
      }
      return JSON.parse(saved)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques 2048:', error)
      return this.createEmptyStats()
    }
  }

  static loadDifficultyStats(gridSize: Game2048GridSize): Game2048GridSizeStats | null {
    const allStats = this.loadAllStats()
    return allStats[gridSize] || null
  }

  private static saveAllStats(
    stats: Record<Game2048GridSize, Game2048GridSizeStats | undefined>,
  ): void {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des statistiques 2048:', error)
    }
  }

  private static createEmptyStats(): Record<
    Game2048GridSize,
    Game2048GridSizeStats | undefined
  > {
    return {
      [Game2048GridSize.THREE]: undefined,
      [Game2048GridSize.FOUR]: undefined,
      [Game2048GridSize.FIVE]: undefined,
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
