# Sudoku context

Classic Sudoku: fill a grid so each row, column and sub-region contains every value exactly once.

## Data model (`types/sudoku.ts`)

- `Grid = Cell[][]`. `GridSize` const enum: `SIX = 6`, `NINE = 9`.
- `Cell`: `{ value: number | null, notes: Set<number>, isInitial, isError, isHighlighted }`.
- `Position = { row, col }`.
- Sub-region size is derived, not fixed: 9×9 uses 3×3 blocks, **6×6 uses 2 rows × 3 columns** blocks (`regionRows=2, regionCols=3`). Computed in `SudokuGenerator`'s constructor and `SudokuValidator.getRegionDimensions()` (dynamically from `grid.length`, 6 → 2×3, otherwise 3×3).

## Difficulty (`Difficulty` const enum + `getCellsToRemove()` in `sudokuGenerator.ts`)

`SIMPLE | NORMAL | EXPERT | MAITRE | DIEUX_SUDOKU`, cells removed out of the total:

| Difficulty | 6×6 (36 cells) | 9×9 (81 cells) |
|---|---|---|
| SIMPLE | 15 | 35 |
| NORMAL | 20 | 45 |
| EXPERT | 23 | 52 |
| MAITRE | 26 | 58 |
| DIEUX_SUDOKU | 28 | 64 |

## Generation (`sudokuGenerator.ts`)

- `generateComplete()` → `fillGrid()`: row-by-row backtracking, values 1..size tried in **shuffled** order (Fisher-Yates) per cell, validated by `isValid()` (row/col/region).
- `removeNumbers()`: shuffles all positions once, removes them one by one while `hasUniqueSolution()` still holds, restoring the value otherwise. **Single pass, no retry/backoff** — if uniqueness blocks removal too early, the puzzle can end up with fewer empty cells than the target, silently.
- `hasUniqueSolution()` = `countSolutions(..., maxSolutions=2)`, backtracking that stops as soon as 2 solutions are found.

## Validation (`sudokuValidator.ts`)

`isValidMove`, `getConflicts`, `isComplete` (vs `solution`), `isFilled`, `countErrors`. Region dimensions resolved dynamically the same way as the generator — no other 6×6-specific logic.

## Store (`store/sudoku.ts`)

- Timer: 100ms interval, paused while `isPaused`/`isCompleted`. `resumeGame` recomputes `startTime = Date.now() - elapsedTime`, so pause time is excluded from `elapsedTime`.
- `getHint()`: only targets empty, non-initial cells; reveals `solution[row][col]`, increments `hintsUsed`.
- Notes: `notesUsed` increments both when a note is added **and** when a value overwrites a cell that had notes (implicit clear) — the counter mixes "added" and "cleared" events.
- `SudokuStatsManager.saveGameStats` is called only from `checkCompletion()` when `isFilled && isComplete`.
- localStorage keys: `sudoku-game-state` (in-progress game) and `sudoku-statistics` (stats, composite key `` `${difficulty}-${gridSize}` ``).

## Known quirks

- `saveGame()` does not persist `isPaused`/`lastPauseStart`/`selectedCell`/`noteMode` — a saved game reloads with `isPaused` forced to `false`.
- `errorsCount` is a cumulative high-water mark, never decremented even after fixing mistakes — this directly weighs the final score (40/100 in `SudokuScoreCalculator`).
- Heavy use of non-null assertions (`grid[row]![col]!`) — always assumes valid indices, no runtime bounds guard.
- `StatsManager` casts `` `${difficulty}-${gridSize}` `` to `Difficulty` to index the stats record (type hack), with a fallback to the legacy single-`difficulty` key in `loadDifficultyStats`.
- The generator can silently produce a puzzle with fewer empty cells than the difficulty targets — no error, no log.
