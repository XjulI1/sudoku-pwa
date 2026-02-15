// État possible d'une cellule Picross
export const enum PicrossCellState {
  EMPTY = 'empty', // Non remplie
  FILLED = 'filled' // Remplie (noire)
}

// Représente une cellule du jeu Picross
export interface PicrossCell {
  state: PicrossCellState
  solution: boolean // true si la cellule doit être remplie dans la solution
  isError: boolean
}

// Grille de jeu Picross
export type PicrossGrid = PicrossCell[][]

// Indices pour une ligne ou colonne (groupes de cellules consécutives)
export type PicrossClue = number[]

// Difficulté du jeu Picross (taille de grille)
export const enum PicrossDifficulty {
  EASY = 'easy', // 5x5
  MEDIUM_SMALL = 'medium_small', // 8x8
  MEDIUM = 'medium', // 10x10
  MEDIUM_LARGE = 'medium_large', // 12x12
  HARD = 'hard' // 15x15
}

// Position d'une cellule
export interface PicrossPosition {
  row: number
  col: number
}

// État du jeu Picross
export interface PicrossGameState {
  grid: PicrossGrid
  rowClues: PicrossClue[]
  colClues: PicrossClue[]
  difficulty: PicrossDifficulty
  gridSize: number
  startTime: number
  elapsedTime: number
  isCompleted: boolean
  isPaused: boolean
  hintsUsed: number
}

// Statistiques d'une partie de Picross
export interface PicrossGameStats {
  difficulty: PicrossDifficulty
  completionTime: number
  errorsCount: number
  hintsUsed: number
  pauseTime: number
  score: number
  completedAt: number
}

// Statistiques par difficulté
export interface PicrossDifficultyStats {
  difficulty: PicrossDifficulty
  gamesPlayed: number
  averageTime: number
  averageScore: number
  bestScore: number
  bestTime: number
  totalErrors: number
  totalHints: number
  history: PicrossGameStats[]
}
