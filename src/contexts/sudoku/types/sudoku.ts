export type CellValue = number | null
export type Notes = Set<number>

export interface Cell {
  value: CellValue
  notes: Notes
  isInitial: boolean
  isError: boolean
  isHighlighted: boolean
}

export type Grid = Cell[][]

export const enum GridSize {
  SIX = 6,
  NINE = 9
}

export const enum Difficulty {
  SIMPLE = 'simple',
  NORMAL = 'normal',
  EXPERT = 'expert',
  MAITRE = 'maitre',
  DIEUX_SUDOKU = 'dieux_sudoku'
}

export interface GameState {
  grid: Grid
  solution: number[][]
  difficulty: Difficulty
  gridSize: GridSize
  startTime: number
  elapsedTime: number
  isCompleted: boolean
  isPaused: boolean
  hintsUsed: number
}

export interface Position {
  row: number
  col: number
}

export interface GameStats {
  difficulty: Difficulty
  gridSize: GridSize
  completionTime: number // en millisecondes
  errorsCount: number
  hintsUsed: number
  notesUsed: number
  pauseTime: number // en millisecondes
  score: number // note sur 10
  completedAt: number // timestamp
}

export interface DifficultyStats {
  difficulty: Difficulty
  gridSize: GridSize
  gamesPlayed: number
  averageTime: number
  averageScore: number
  bestScore: number
  bestTime: number
  totalErrors: number
  totalHints: number
  history: GameStats[]
}
