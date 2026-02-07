// Symboles possibles dans une cellule Tango
export const enum TangoSymbol {
  EMPTY = '',
  MOON = '🌑', // Nouvelle lune (noir)
  SUN = '☀️'
}

// Types de contraintes entre cellules
export const enum ConstraintType {
  EQUALS = '=', // Les deux cellules doivent avoir le même symbole
  NOT_EQUALS = 'X' // Les deux cellules doivent avoir des symboles différents
}

// Direction de la contrainte
export const enum ConstraintDirection {
  HORIZONTAL = 'horizontal', // Contrainte vers la droite
  VERTICAL = 'vertical' // Contrainte vers le bas
}

// Représente une contrainte entre deux cellules adjacentes
export interface TangoConstraint {
  row: number
  col: number
  type: ConstraintType
  direction: ConstraintDirection
}

// Représente une cellule du jeu Tango
export interface TangoCell {
  value: TangoSymbol
  isInitial: boolean // Cellule pré-remplie
  isError: boolean // La cellule viole une règle
  isHighlighted: boolean // La cellule est mise en surbrillance
}

// Grille de jeu Tango (toujours 6x6)
export type TangoGrid = TangoCell[][]

// Difficulté du jeu Tango (nombre de cellules pré-remplies)
export const enum TangoDifficulty {
  EASY = 'easy', // Plus de cellules pré-remplies
  MEDIUM = 'medium',
  HARD = 'hard' // Moins de cellules pré-remplies
}

// Position d'une cellule
export interface TangoPosition {
  row: number
  col: number
}

// État du jeu Tango
export interface TangoGameState {
  grid: TangoGrid
  solution: TangoSymbol[][] // Solution complète du puzzle
  constraints: TangoConstraint[] // Liste des contraintes
  difficulty: TangoDifficulty
  startTime: number
  elapsedTime: number
  isCompleted: boolean
  isPaused: boolean
  hintsUsed: number
}

// Statistiques d'une partie de Tango
export interface TangoGameStats {
  difficulty: TangoDifficulty
  completionTime: number // en millisecondes
  errorsCount: number
  hintsUsed: number
  pauseTime: number // en millisecondes
  score: number // note sur 10
  completedAt: number // timestamp
}

// Statistiques par difficulté
export interface TangoDifficultyStats {
  difficulty: TangoDifficulty
  gamesPlayed: number
  averageTime: number
  averageScore: number
  bestScore: number
  bestTime: number
  totalErrors: number
  totalHints: number
  history: TangoGameStats[]
}
