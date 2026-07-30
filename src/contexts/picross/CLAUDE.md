# Picross context

Nonogram: fill cells so each row/column matches its numeric clue (consecutive filled-block lengths). No `Validator` file — correctness is checked directly against the per-cell `solution` flag.

## Data model (`types/picross.ts`)

- `PicrossCellState`: `EMPTY | FILLED` — no third "cross/X mark" state.
- `PicrossCell = { state, solution: boolean, isError }` — each cell carries its own solution flag directly (no separate solution grid).
- `PicrossClue = number[]`: consecutive filled-block lengths for a line; an empty line is encoded `[0]`, never `[]`.

## Difficulty (`PicrossDifficulty`, sizes/density via `PicrossGenerator`)

| Difficulty | Grid | Target density |
|---|---|---|
| EASY | 5×5 | 0.6 |
| MEDIUM_SMALL | 8×8 | 0.58 |
| MEDIUM | 10×10 | 0.55 |
| MEDIUM_LARGE | 12×12 | 0.52 |
| HARD | 15×15 | 0.5 |

## Generation (`PicrossGenerator`)

`generateSolution(size, density)` fills cells purely at random (`Math.random() < density`), retried up to 100 times against `isValidSolution` (rejects an all-empty or all-full row/column), with `fixSolution` as a last-resort minimal patch. **This is filtered noise, not a drawn picture** — no guarantee of a unique solution or a recognizable pattern. `computeRowClues`/`computeColClues` derive the displayed clues from the generated solution afterwards.

## Move logic (no validator)

- `selectCell(row, col)` toggles `FILLED ↔ EMPTY` on click. **No "cross" mark** for empty cells like the classic paper version.
- Error: `isError = state === FILLED && !solution` (only while `showErrors` is on).
- Completion (`checkCompletion`): scans the whole grid, bails out on the first mismatch between `state` and `solution`; sets `isCompleted = true` only if none is found.
- `isRowComplete`/`isColComplete` recompute the current clue and compare it to the target clue — used only for a `clue-complete` visual style, independent of `checkCompletion`.

## Store (`store/picross.ts`)

- Timer: same pattern as the other games; error display deliberately delayed 1000ms (`errorCountTimeout`) after each edit.
- `getHint()`: reveals a random `solution=true` cell that isn't `FILLED` yet.
- `PicrossStatsManager.saveGameStats` fires once, in `checkCompletion()`, only on the `isCompleted` transition to `true`.
- localStorage: `picross-game-state` (in-progress game), `picross-statistics` (stats).

## Known quirks

- `showErrors` exists in the store (copied from the Sudoku/Tango/Tectonic/Rikudo pattern) but no UI toggles it — effectively always `true`.
- `errorsCount` is a cumulative high-water mark, never decremented.
- Score weighting: errors 40%, hints 30%, time 20%, pause 10%, reference times 3/6/10/18/25 min per difficulty.
- `loadGame()` has no schema validation — a corrupted/stale localStorage entry fails silently via a generic try/catch.
