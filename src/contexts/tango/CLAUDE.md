# Tango context

Fixed 6×6 grid (`GRID_SIZE = 6`, hardcoded independently in `tangoGenerator.ts`, `tangoValidator.ts` and the store — no shared exported constant). Fill every cell with `TangoSymbol.SUN` (☀️) or `TangoSymbol.MOON` (🌑) so that:

- no 3 identical symbols are aligned consecutively (horizontally or vertically),
- each row and column ends up with exactly 3 SUN and 3 MOON,
- every `TangoConstraint` between two adjacent cells is satisfied.

## Data model (`types/tango.ts`)

- `TangoConstraint = { row, col, type: ConstraintType (EQUALS '=' | NOT_EQUALS 'X'), direction: ConstraintDirection (HORIZONTAL | VERTICAL) }`. A constraint is anchored at `(row, col)` and always applies **towards the right** (HORIZONTAL → `(row, col+1)`) or **towards the bottom** (VERTICAL → `(row+1, col)`) — never towards the top/left of its anchor. Code checking a given cell must therefore test both directions: the constraint "starting" at this cell, and the one "arriving" at it (anchored at `col-1`/`row-1`).
- `TangoCell = { value, isInitial, isError, isHighlighted }`.

## Difficulty (`TangoDifficulty`: `EASY | MEDIUM | HARD`)

In `tangoGenerator.ts`:
- Constraint count (`constraintCounts`): EASY 8, MEDIUM 6, HARD 4.
- Cells removed out of 36 (`cellsToRemove`): EASY 18 (50%), MEDIUM 24 (67%), HARD 30 (83%).

Reference times for scoring (`tangoScoreCalculator.ts`): EASY 3min, MEDIUM 6min, HARD 10min.

## Generation (`TangoGenerator.generate`)

1. `generateCompleteGrid()` → `fillGrid()`: backtracking, symbols tried in shuffled order, validated by `isValidPlacement` (3-consecutive rule + row/column count once complete).
2. `generateConstraints()`: derives all possible constraints from the solution (EQUALS if cells match, NOT_EQUALS otherwise), shuffles, keeps `targetCount` per difficulty.
3. `createPuzzle()`: removes cells from shuffled positions, checks `hasUniqueSolution()` → `countSolutions(..., maxSolutions=2)` after each removal, restores the value if uniqueness breaks. **Single pass, no retry/backoff** — same caveat as Sudoku, the final puzzle can end up with fewer removed cells than the difficulty target.

## Validation (`TangoValidator.isValidMove`)

Chains 5 checks: `checkNoThreeConsecutiveHorizontal`, `checkNoThreeConsecutiveVertical`, `checkRowCount`/`checkColumnCount` (`<= 3`, not yet `=== 3` mid-game), `checkConstraints` (ignored against an `EMPTY` neighbor). Plus `isFilled`, `isComplete`, `getConflicts`.

## Store (`store/tango.ts`)

- Timer: same 100ms-interval / `totalPauseTime` / `startTime` recompute pattern as Sudoku.
- Errors: `updateErrors()` clears the display immediately, then re-evaluates after a 1000ms `setTimeout` (`errorCountTimeout`) — `countErrors` only ever increases `errorsCount` (never decremented).
- `getHint()`: picks a random empty non-initial cell and fills it directly from `solution`.
- `TangoStatsManager.saveGameStats` fires only from `checkCompletion()` once both `isFilled` and `isComplete` hold.
- localStorage: `tango-game-state` (in-progress game), `tango-statistics` (stats).

## Known quirks

- `GRID_SIZE = 6` is duplicated in 3 files instead of a shared constant — keep them in sync if the grid size ever changes.
- Constraint rendering (`TangoGrid.vue`) does a `store.constraints.find(...)` per cell per direction (horizontal + vertical) — O(cells × constraints), fine at 6×6 but not free.
- `errorsCount` is a cumulative high-water mark (never decreases), weighing 40/100 in `TangoScoreCalculator`.
- `hasUniqueSolution` stops counting at 2 solutions (perf optimization) — never reports the exact count beyond that.
- All Tango enums are `const enum` — must be imported as values.
