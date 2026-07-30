// Grille d'identifiants de zone (une valeur par case, partagée par plusieurs cases d'une même zone)
export type RegionGrid = number[][]

// Représente une cellule du jeu Tectonic
export interface TectonicCell {
  value: number | null
  regionId: number
  isInitial: boolean
  isError: boolean
  isHighlighted: boolean
}

// Grille de jeu Tectonic
export type TectonicGrid = TectonicCell[][]

// Position d'une cellule
export interface Position {
  row: number
  col: number
}

// Difficulté du jeu Tectonic
export const enum TectonicDifficulty {
  FACILE = 'facile',
  MOYEN = 'moyen',
  DIFFICILE = 'difficile',
  EXPERT = 'expert'
}

// Configuration d'une difficulté : dimensions de la grille, taille maximale des zones
// et proportion de cases données au départ
export interface TectonicDifficultyConfig {
  rows: number
  cols: number
  maxRegionSize: number
  clueRatio: number
}

// État du jeu Tectonic
export interface TectonicGameState {
  grid: TectonicGrid
  solution: number[][]
  regionGrid: RegionGrid
  maxRegionSize: number
  difficulty: TectonicDifficulty
  rows: number
  cols: number
  startTime: number
  elapsedTime: number
  isCompleted: boolean
  isPaused: boolean
  hintsUsed: number
}

// Statistiques d'une partie de Tectonic
export interface TectonicGameStats {
  difficulty: TectonicDifficulty
  completionTime: number
  errorsCount: number
  hintsUsed: number
  pauseTime: number
  score: number
  completedAt: number
}

// Statistiques par difficulté
export interface TectonicDifficultyStats {
  difficulty: TectonicDifficulty
  gamesPlayed: number
  averageTime: number
  averageScore: number
  bestScore: number
  bestTime: number
  totalErrors: number
  totalHints: number
  history: TectonicGameStats[]
}
