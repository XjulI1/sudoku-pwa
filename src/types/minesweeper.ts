// État d'une cellule du démineur
export const enum MinesweeperCellState {
  HIDDEN = 'hidden',
  REVEALED = 'revealed',
  FLAGGED = 'flagged'
}

// Représente une cellule du démineur
export interface MinesweeperCell {
  isMine: boolean
  state: MinesweeperCellState
  adjacentMines: number // 0-8
  isHighlighted: boolean
}

// Grille de jeu
export type MinesweeperGrid = MinesweeperCell[][]

// Difficulté du démineur
export const enum MinesweeperDifficulty {
  BEGINNER = 'beginner', // 9x9, 10 mines
  INTERMEDIATE = 'intermediate', // 16x16, 40 mines
  EXPERT = 'expert' // 16x30, 99 mines
}

// Configuration par difficulté
export interface MinesweeperConfig {
  rows: number
  cols: number
  mines: number
}

// Position d'une cellule
export interface MinesweeperPosition {
  row: number
  col: number
}

// État du jeu
export const enum MinesweeperGameStatus {
  PLAYING = 'playing',
  WON = 'won',
  LOST = 'lost'
}

// État complet du jeu
export interface MinesweeperGameState {
  grid: MinesweeperGrid
  difficulty: MinesweeperDifficulty
  config: MinesweeperConfig
  gameStatus: MinesweeperGameStatus
  startTime: number
  elapsedTime: number
  isPaused: boolean
  flagsPlaced: number
  isFirstClick: boolean
}

// Statistiques d'une partie
export interface MinesweeperGameStats {
  difficulty: MinesweeperDifficulty
  completionTime: number
  won: boolean
  flagsUsed: number
  cellsRevealed: number
  totalCells: number
  pauseTime: number
  score: number
  completedAt: number
}

// Statistiques par difficulté
export interface MinesweeperDifficultyStats {
  difficulty: MinesweeperDifficulty
  gamesPlayed: number
  gamesWon: number
  averageTime: number
  averageScore: number
  bestScore: number
  bestTime: number
  winRate: number
  history: MinesweeperGameStats[]
}
