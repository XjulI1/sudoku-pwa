# Minesweeper context

Classic Minesweeper. No `Validator` and no `Generator`-driven puzzle logic beyond board setup — move logic (reveal, flood fill, flags, win/loss) lives directly in the store.

## Data model (`types/minesweeper.ts`)

- `MinesweeperCellState`: `HIDDEN | REVEALED | FLAGGED`.
- `MinesweeperCell = { isMine, state, adjacentMines (0-8), isHighlighted }`.
- `MinesweeperGameStatus`: `PLAYING | WON | LOST`.
- **Dead field**: `isHighlighted` is only ever initialized/saved as `false`, never set to `true` anywhere and never read by components.

## Difficulty (`DIFFICULTY_CONFIGS` in `minesweeperGenerator.ts`)

| Difficulty | Grid | Mines |
|---|---|---|
| BEGINNER | 9×9 | 10 |
| INTERMEDIATE | 16×16 | 40 |
| EXPERT | 16×30 | 99 |

`MinesweeperGenerator.getConfig(difficulty, isPortrait)`: in portrait mode, only EXPERT is flipped to 30×16 (screen-orientation adaptation).

## Board setup

- `createEmptyGrid()` builds an all-`HIDDEN`, mine-free grid on `newGame` — **before** any click.
- Mines are placed lazily on the **first click** (`revealCell`, when `isFirstClick`): `placeMines(grid, config, safeRow, safeCol)` excludes the clicked cell plus its 8 neighbors from placement, guaranteeing the first click (and its immediate neighborhood) is never a mine. No guarantee of a large opening beyond that.
- `adjacentMines` is computed once, right after mine placement.

## Move logic (in the store, no validator file)

- `revealCell(row, col)`: no-op if game isn't `PLAYING`/is paused, or cell isn't `HIDDEN`. Placing mines happens here on first click. Hitting a mine → `LOST`, reveals all remaining mines, stops the timer, saves stats (`won: false`). Otherwise → `floodReveal`.
- `floodReveal`: recursive cascade — reveals the cell, and if `adjacentMines === 0`, recurses into all 8 neighbors.
- `toggleFlag(row, col)`: no-op on `REVEALED` cells; toggles `HIDDEN ↔ FLAGGED`.
- `checkWin`: victory when `revealedCount === totalSafeCells` (total minus mines) → `WON`, stops timer, auto-flags remaining mines, saves stats (`won: true`).
- `handleCellClick` routes to `toggleFlag` if `flagMode` is on, else `revealCell`. `handleCellRightClick` (context menu, `preventDefault`) always toggles the flag regardless of `flagMode`.

## Store (`store/minesweeper.ts`)

- Timer starts at `newGame()` (not on first click), 100ms interval, gated by `!isPaused && gameStatus === PLAYING`.
- `MinesweeperStatsManager.saveGameStats` is called from both terminal paths (`revealCell` on loss, `checkWin` on win) — never on manual pause/quit.
- localStorage: `minesweeper-game-state` (in-progress game), `minesweeper-statistics` (stats).

## Known quirks

- No hint system, no notes/pencil mode — `MinesweeperCellState` only has 3 values.
- Score is 0 on a loss; on a win it's weighted 60% time / 20% pause / 20% flag efficiency, with per-difficulty reference times (2/8/20 min).
