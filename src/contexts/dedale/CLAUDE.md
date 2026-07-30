# Dédale context

Numberlink/"Flow"-style puzzle: connect each pair of matching-letter endpoints with a single path such that the paths together **fully cover the grid** with no crossings.

## Data model (`types/dedale.ts`)

- `DedaleCell = { letter, pairIndex, isEndpoint, connections: DedaleDirection[] }` (0-2 entries: `up/down/left/right`).
- Pairs are labeled A, B, C… (`String.fromCharCode(65 + index)`, assigned in the store).
- Win condition (`DedaleValidator.isComplete`) = `isFullyCovered` (no cell with 0 connections) **and** every pair connected (`isPairConnected`).

## Difficulty (`DIMENSIONS` in `dedaleGenerator.ts`)

| Difficulty | Grid | Pairs |
|---|---|---|
| FACILE | 6×6 | 5 |
| MOYEN | 8×8 | 8 |
| DIFFICILE | 10×10 | 12 |

`MIN_SEGMENT_LENGTH = 3` (minimum path length per pair), `BACKBITE_ITERATIONS_PER_CELL = 25`.

## Generation (`DedaleGenerator.generate`)

1. `buildZigzagPath()`: trivial boustrophedon (row-by-row back-and-forth) Hamiltonian path covering every cell.
2. `buildRandomHamiltonianPath()`: randomizes it via `rows*cols*BACKBITE_ITERATIONS_PER_CELL` **backbite moves** (reconnect one end to a grid-neighbor found further along the path, reversing the prefix) — the standard technique for sampling random Hamiltonian paths without ever failing/backtracking.
3. `splitSegmentLengths()` divides the full path into `pairCount` segments of length ≥ `MIN_SEGMENT_LENGTH`; `cutIntoSegments()`/`shuffle()` cut and randomly assign letters.
4. Each segment's two ends become the pair's endpoints; the full segment is kept as `solutionPaths` (used for hints).

Validity is guaranteed by construction (a Hamiltonian path = full coverage + simple connectivity) — **uniqueness of the solution is not guaranteed** (explicitly noted in the code). `dedaleGenerator.spec.ts` checks: exact coverage with no overlap, endpoint/segment consistency, length ≥ 3, and reconstructs the grid via `directionBetween`/`oppositeDirection` to confirm `isFullyCovered` + `isComplete`.

## Validation (`dedaleValidator.ts`)

Geometry helpers reused by the store: `neighborInDirection`, `directionBetween` (deduces the direction between two adjacent cells, `null` otherwise), `oppositeDirection`. `isPairConnected` walks the connection chain from one endpoint (which must have exactly 1 connection) to the other, tracking visited positions to detect loops.

## Store (`store/dedale.ts`)

- Interaction is unified through `interactCell(row, col)`, driven by `pointerdown`/`pointermove` (drag-to-draw, `setPointerCapture` in `DedaleGrid.vue`) and by arrow keys (`moveActiveFrontier`, in `DedaleControls.vue`; `Backspace`/`Delete` clears the active path, `Escape` deselects the pair).
- `selectPair` finds the active frontier via `findChainTip`; `extendPath`/`truncatePath` grow/shrink it (`truncatePath` increments `retractionsCount`, used by the score).
- Timer: same 100ms-interval pattern as the other games.
- `DedaleStatsManager.saveGameStats` fires from `checkCompletion()` only when `DedaleValidator.isComplete` becomes true.
- localStorage: `dedale-game-state` (in-progress game), `dedale-statistics` (stats).

## `dedaleColors.ts`

`getPathColor(pairIndex)` cycles through 12 fixed `PATH_COLORS` (modulo) to give each pair's path a distinct, theme-agnostic color.

## Known quirks

- `isComplete` accepts **any** valid full covering, not just the generator's original solution — alternate solutions are legitimate wins.
- No proof of solution uniqueness (acknowledged in the generator's comments).
- `getHint()` reveals the **entire remaining path** of a random incomplete pair, not a single cell.
- `resetPairCells` keeps `letter`/`pairIndex` on endpoint cells but clears them to `null` on intermediate path cells.
- Score weighting: time 35%, hints 35%, retractions 20%, pause 10%, reference times 3/7/15 min per difficulty.
