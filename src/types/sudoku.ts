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
