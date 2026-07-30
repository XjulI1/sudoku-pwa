// Coordonnées axiales d'une case hexagonale (q, r), le trou est toujours en (0, 0)
export interface RikudoCoord {
  q: number
  r: number
}

// Représente une cellule du jeu Rikudo
export interface RikudoCell {
  value: number | null
  coord: RikudoCoord
  isInitial: boolean
  isHole: boolean
  isError: boolean
  isHighlighted: boolean
}

// Grille de jeu Rikudo (liste plate, la géométrie hexagonale n'est pas indexable en row/col)
export type RikudoGrid = RikudoCell[]

// Indice visuel : deux cases adjacentes dont les valeurs sont données comme consécutives
export interface DiamondLink {
  a: RikudoCoord
  b: RikudoCoord
}

// Difficulté du jeu Rikudo (rayon de la grille hexagonale)
export const enum RikudoDifficulty {
  FACILE = 'facile',
  MOYEN = 'moyen',
  DIFFICILE = 'difficile',
  EXPERT = 'expert'
}

// Configuration d'une difficulté : rayon de l'hexagone (le nombre d'indices ◆
// n'est pas paramétré, il découle de la minimisation faite par le générateur)
export interface RikudoDifficultyConfig {
  radius: number
}

// État du jeu Rikudo
export interface RikudoGameState {
  grid: RikudoGrid
  solution: RikudoCoord[]
  diamondLinks: DiamondLink[]
  radius: number
  difficulty: RikudoDifficulty
  startTime: number
  elapsedTime: number
  isCompleted: boolean
  isPaused: boolean
  hintsUsed: number
}

// Statistiques d'une partie de Rikudo
export interface RikudoGameStats {
  difficulty: RikudoDifficulty
  completionTime: number
  errorsCount: number
  hintsUsed: number
  pauseTime: number
  score: number
  completedAt: number
}

// Statistiques par difficulté
export interface RikudoDifficultyStats {
  difficulty: RikudoDifficulty
  gamesPlayed: number
  averageTime: number
  averageScore: number
  bestScore: number
  bestTime: number
  totalErrors: number
  totalHints: number
  history: RikudoGameStats[]
}
