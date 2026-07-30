# Tectonic context

Grid split into irregular regions (a "Suguru"-style puzzle). Each region of size N must contain exactly the values 1..N with no repeat, and no two **king-adjacent** cells (8 directions, diagonals included) may share the same value.

## Data model (`types/tectonic.ts`)

- `RegionGrid = number[][]` — one `regionId` per cell.
- `TectonicCell = { value, regionId, isInitial, isError, isHighlighted }`.
- `tectonicRegions.ts`: `forEachKingNeighbor` (8-direction `KING_OFFSETS`, the actual gameplay rule) vs `forEachOrthogonalNeighbor` (4-direction `ORTHOGONAL_OFFSETS`, used only to keep regions orthogonally connected during generation — not a gameplay constraint).

## Difficulty (`DIFFICULTY_CONFIG` in `tectonicGenerator.ts`)

| Difficulty | Grid | Max region size | Clue ratio |
|---|---|---|---|
| FACILE | 6×6 | 5 | 0.55 |
| MOYEN | 8×8 | 5 | 0.45 |
| DIFFICILE | 10×8 | 5 | 0.35 |
| EXPERT | 10×10 | 5 | 0.28 |

`maxRegionSize` stays 5 at every tier by design (comment: the king-move rule on a 2×2 block already requires ≥4 distinct values, so anything below 4 is impossible and exactly 4 is too constraining) — only grid size and clue density scale with difficulty.

## Generation (`TectonicGenerator`)

- Outer loop `MAX_PARTITION_ATTEMPTS = 20`. Region partitioning (`generateRegionPartition`, up to `QUALITY_ATTEMPTS = 5` tries of `growPartitionOnce`): random connected-blob growth from the most-constrained free seed, keeps the first partition with ≤20% singleton regions else the best found. `mergeTinyOrphans` then repairs singleton regions (merge into a neighbor with room, or "steal" a cell if `staysConnectedWithout` proves the donor region stays connected), followed by `compactRegions` renumbering.
- Filling: `generateComplete`/`fillGrid` uses MRV (minimum-remaining-values) backtracking, candidates from `getCandidates` (region range minus king-neighbor values already placed). Node budget `FILL_NODE_LIMIT = 50_000` — exceeding it or failing to solve rejects the partition and retries.
- Removal: `removeNumbers` never touches a size-1 region (forced to "1"); otherwise removes cells in random order while `hasUniqueSolution` (MRV backtracking, `maxSolutions=2`, `COUNT_NODE_LIMIT = 5_000`) holds. A budget overrun is treated conservatively as ambiguous.
- Generation can fully fail and throw `Error('Tectonic: impossible de générer un puzzle valide')` after 20 partition attempts — no silent fallback.

## Validation (`TectonicValidator`)

`isValidMove(grid, regionGrid, row, col, value)`: value bounds (1..region size), uniqueness within the region, uniqueness among king-neighbors. `getConflicts` returns the deduplicated conflicting positions (region + king-neighbors).

## `tectonicColors.ts`

`getRegionColor(regionId)` returns a translucent `hsl(hue 70% 55% / 0.16)` from 8 cycling hues, layered under `--cell-bg` alongside thick borders — theme-agnostic.

## Store (`store/tectonic.ts`, `STORAGE_KEY = 'tectonic-game-state'`)

- Timer: same 100ms-interval pattern; errors deliberately delayed 1000ms after each edit, `errorsCount` is a cumulative high-water mark.
- `getHint()`: reveals a random empty cell (not the "best" one).
- `TectonicStatsManager.saveGameStats` fires from `checkCompletion()` when `isComplete` becomes true. Stats use a separate key, `tectonic-statistics`.

## Known quirks

- Size-1 regions are always pre-filled as initial cells (forced value "1"), never removed — you'll never see an empty singleton region.
- `mergeTinyOrphans` only steals a cell when the donor region provably stays orthogonally connected afterwards (3 passes); a singleton can survive if no safe donor exists.
- Bounds are always checked in `forEachKingNeighbor`/`forEachOrthogonalNeighbor` — no toroidal wraparound, no edge/corner crashes.
- `errorsCount` never decreases — weighs 40/100 in `TectonicScoreCalculator`, the heaviest factor.
