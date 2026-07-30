// Difficulté du jeu Dédale (taille de grille et nombre de paires de lettres)
export const enum DedaleDifficulty {
  FACILE = 'facile',
  MOYEN = 'moyen',
  DIFFICILE = 'difficile'
}

// Direction d'une connexion de tracé dans une cellule
export const enum DedaleDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right'
}

// Position d'une cellule
export interface DedalePosition {
  row: number
  col: number
}

// Représente une cellule du jeu Dédale
export interface DedaleCell {
  letter: string | null // Lettre affichée si cette cellule est un point d'ancrage (A, B, C...)
  pairIndex: number | null // Index de la paire qui occupe actuellement cette cellule
  isEndpoint: boolean // Cellule fixe de départ/arrivée d'une paire
  connections: DedaleDirection[] // Directions du tracé dans cette cellule (0 à 2 valeurs)
}

// Grille de jeu Dédale (dimensions variables selon la difficulté)
export type DedaleGrid = DedaleCell[][]

// État du jeu Dédale
export interface DedaleGameState {
  grid: DedaleGrid
  rows: number
  cols: number
  pairs: [DedalePosition, DedalePosition][] // Positions des 2 points d'ancrage par paire
  solutionPaths: DedalePosition[][] // Chemin complet ordonné par paire (utilisé pour les indices)
  difficulty: DedaleDifficulty
  startTime: number
  elapsedTime: number
  isCompleted: boolean
  isPaused: boolean
  hintsUsed: number
  retractionsCount: number
}

// Statistiques d'une partie de Dédale
export interface DedaleGameStats {
  difficulty: DedaleDifficulty
  completionTime: number // en millisecondes
  retractionsCount: number
  hintsUsed: number
  pauseTime: number // en millisecondes
  score: number // note sur 10
  completedAt: number // timestamp
}

// Statistiques par difficulté
export interface DedaleDifficultyStats {
  difficulty: DedaleDifficulty
  gamesPlayed: number
  averageTime: number
  averageScore: number
  bestScore: number
  bestTime: number
  totalRetractions: number
  totalHints: number
  history: DedaleGameStats[]
}
