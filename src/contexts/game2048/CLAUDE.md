# 2048 context

Slide-and-merge 2048. No `Generator`/`Validator` files — everything (spawn, merge, game-over/win detection) lives in the store.

## Data model (`types/game2048.ts`)

- `Direction`: `UP | DOWN | LEFT | RIGHT`.
- `Game2048GridSize` (numeric const enum): `THREE = 3 | FOUR = 4 | FIVE = 5` — this **is** the difficulty axis, there's no `Difficulty` enum.
- `Tile = { id, value, row, col, mergedFrom?, isNew? }`. `id` comes from a module-scope counter `nextTileId` (not part of Pinia state) — used as Vue `:key` for merge/spawn animations.
- `Game2048Grid = (Tile | null)[][]`.
- `Game2048Status`: `PLAYING | WON | LOST | CONTINUE` (`CONTINUE` = won but chose to keep playing).

## GridSize as difficulty

`getTargetTile()` in the store maps grid size to a win target: 3×3 → 512, 4×4 → 2048, 5×5 → 4096 (win doesn't always mean literally "2048"). `Game2048ScoreCalculator`'s reference scores/times also vary by size, purely for scoring. Best score is stored per size (`` game2048-best-score-${gridSize} ``), so it isn't a single global record.

## Game logic (store)

- `move(direction)`: extracts each line via `getLine` (ordered per direction), `slideLine` compacts non-null tiles then merges equal adjacent pairs once each (loop advances `i += 2` after a merge — no triple-chain merge in a single move), assigns the merged tile a **new** `id` with `mergedFrom: true`. `setLine` writes the transformed line back, recomputing `row`/`col`.
- Spawn: exactly one new tile per successful move (`anyMoved === true`), random empty cell, value 2 with 90% probability else 4.
- Game over (`canMove()`): true if any cell is empty, or if two adjacent tiles (checked right/down only — sufficient by symmetry) share a value; false → `LOST`.
- Win check only runs while `gameStatus === PLAYING` (not `CONTINUE`), when `highestTile >= targetTile`.

## Interaction (`Game2048Grid.vue`)

- Keyboard: arrows **and** `w/z` (up), `s` (down), `a/q` (left), `d` (right) — both QWERTY and AZERTY.
- Touch: `touchstart`/`touchend` with `SWIPE_THRESHOLD = 30`px, dominant axis wins.

## Store (`store/game2048.ts`)

- Timer: same 100ms-interval pattern as the other games, gated on `!isPaused && isPlaying` (`isPlaying` = `PLAYING` or `CONTINUE`).
- `Game2048StatsManager.saveGameStats` fires on `WON` (with `stopTimer()`) or on `LOST` guarded by `if (gameStatus.value !== WON)`.
- `nextTileId` (module-scope) is reset to 1 in `newGame()` and restored from `state.nextTileId` in `loadGame()`.
- localStorage: `game2048-state` (in-progress game), `` game2048-best-score-${gridSize} ``, `game2048-statistics` (stats).

## Known quirks

- Stats are saved at most once per game session, tracked by the `hasSavedGameStats` ref (persisted via `saveGame`/`loadGame`, reset in `newGame`/`resetGame`) rather than by gating on `gameStatus !== WON`. This matters because after winning, `continueGame()` moves the status to `CONTINUE` — without the flag, a subsequent loss would re-trigger `saveGameStats(..., won: false, ...)` for a game that already recorded a win.
- `clearAnimationFlags()` runs at the very start of `move()`, so `isNew`/`mergedFrom` only ever reflect the most recent move.
- `canMove()` only checks right/down neighbors — correct today since equality is symmetric, but note this if the function is ever refactored.
