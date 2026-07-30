# Rikudo context

Hexagonal-grid path puzzle: place 1..N (N = number of playable cells) one per non-hole cell, such that consecutive values always sit on hexagonally-adjacent cells. A `DiamondLink` ("◆") is a visual clue marking two adjacent cells whose values are given as consecutive.

## Coordinate system (`rikudoGeometry.ts`)

- Axial coordinates `RikudoCoord { q, r }`; the hole is always at `(0, 0)`.
- `RikudoGrid = RikudoCell[]` is a **flat list, not a 2D array** — hex-axial geometry has no natural row/col mapping (see the comment in `types/rikudo.ts`). Cell lookup goes through `find()` on `coord` (e.g. the store's `findCell`), not indexing — O(n), not O(1).
- `hexCoordsInRadius(radius)`: sweeps `r` from `-radius` to `+radius`, bounding `q` per row via the implicit cubic coordinate `s = -q-r` (`|s| <= radius`).
- `isHexAdjacent`/`coordsEqual`: adjacency test against the 6 `HEX_DIRECTIONS` axial vectors.

## Difficulty (`DIFFICULTY_CONFIG` in `rikudoGenerator.ts`)

| Difficulty | Radius | Playable cells | Solver node limit |
|---|---|---|---|
| FACILE | 2 | 18 | 20k |
| MOYEN | 3 | 36 | 80k |
| DIFFICILE | 4 | 60 | 200k |
| EXPERT | 5 | 90 | 150k |

## Generation (`RikudoGenerator`)

1. `buildSpiralPath()`: trivial Hamiltonian path built ring-by-ring (never row-by-row — a zigzag would break on the hole's row).
2. `buildRandomHamiltonianPath()`: randomizes it via `BACKBITE_ITERATIONS_PER_CELL = 25` backbite moves per cell (same technique as Dédale).
3. `selectDiamondClues()`: tries removing **every** path edge in random order, keeping it removed only if `hasUniqueSolution` (a deduction-driven DFS, `countPaths`) still proves uniqueness without it — no early stopping, so no "easy" leftover clues.
4. Uniqueness solver: DFS with forced-move deduction (an unvisited ◆ partner of the current head is a forced next step) and dead-end pruning (a neighbor with no remaining unvisited degree).

`rikudoGenerator.spec.ts` checks path length/uniqueness/adjacency, ◆-to-edge correspondence, `verifyUniqueSolution === true`, **and strict minimality** (removing any one more kept ◆ clue would make the puzzle ambiguous).

## Validation (`rikudoValidator.ts`)

`isValidMove`/`getConflicts` flag: duplicate values anywhere on the grid; a value differing by 1 from another cell's value **without** being hex-adjacent to it; and any filled ◆ partner whose value doesn't differ by exactly 1. `isComplete` compares the grid to `solution` cell-by-cell (`solution[i]` must hold value `i+1`).

## Store (`store/rikudo.ts`)

- Timer: same 100ms-interval pattern as the other games.
- `getHint()`: reveals a random empty cell.
- `RikudoStatsManager.saveGameStats` fires from `checkCompletion()` when `isComplete` becomes true.
- localStorage: `rikudo-game-state` (in-progress game), `rikudo-statistics` (stats).

## Known quirks

- Flat-list storage means every cell lookup (`findCell`, `getConflicts`) is a linear `Array.find`, not indexed access.
- The hole `(0,0)` must be explicitly excluded everywhere adjacency/counting happens (`forEachHexNeighbor`, `buildAdjacency`, `isFilled`) — forgetting it skews `totalCells`/adjacency checks.
- The path's two endpoints (`path[0]`, `path[last]`) are always pre-filled as `isInitial` — a DiamondLink is never forced onto an arbitrary endpoint.
- The uniqueness solver treats a node-budget overrun as "ambiguous" (a conservative false negative) rather than crashing — this can affect reproducibility/latency at EXPERT.
