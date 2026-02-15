// Direction de déplacement
export const enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

// Taille de grille (sert aussi de difficulté)
export const enum Game2048GridSize {
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

// Représente une tuile dans la grille
export interface Tile {
  id: number
  value: number
  row: number
  col: number
  mergedFrom?: boolean
  isNew?: boolean
}

// Grille de jeu (cellules pouvant contenir une tuile ou null)
export type Game2048Grid = (Tile | null)[][]

// État du jeu
export const enum Game2048Status {
  PLAYING = 'playing',
  WON = 'won',
  LOST = 'lost',
  CONTINUE = 'continue', // Le joueur a atteint 2048 mais continue
}

// État complet du jeu
export interface Game2048State {
  grid: Game2048Grid
  gridSize: Game2048GridSize
  score: number
  bestScore: number
  status: Game2048Status
  startTime: number
  elapsedTime: number
  isPaused: boolean
  highestTile: number
}

// Statistiques d'une partie
export interface Game2048GameStats {
  gridSize: Game2048GridSize
  score: number
  highestTile: number
  completionTime: number
  won: boolean
  pauseTime: number
  noteScore: number
  completedAt: number
}

// Statistiques par taille de grille
export interface Game2048GridSizeStats {
  gridSize: Game2048GridSize
  gamesPlayed: number
  gamesWon: number
  averageTime: number
  averageScore: number
  bestScore: number
  bestTime: number
  winRate: number
  highestTile: number
  history: Game2048GameStats[]
}
