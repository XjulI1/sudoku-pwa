# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Puzzle Games PWA** — a Progressive Web Application built with Vue 3 and TypeScript that bundles **five different puzzle games** behind a single menu, with shared chrome (timer, dark mode, statistics, autosave, install/offline support).

The repository is named `sudoku-pwa` for historical reasons; the project now contains:

| Game | Type identifier | Notes |
| --- | --- | --- |
| Sudoku | `sudoku` | 6×6 and 9×9 grids, 5 difficulties |
| Tango | `tango` | 6×6 grid, sun/moon symbols with `=` / `X` constraints |
| Démineur (Minesweeper) | `minesweeper` | 3 difficulties (9×9, 16×16, adaptive) |
| 2048 | `game2048` | 3×3 / 4×4 / 5×5 grids |
| Picross (Nonogram) | `picross` | 5 grid sizes from 5×5 to 15×15 |

## Development Commands

```bash
# Development
yarn dev              # Start dev server with hot reload

# Building
yarn build            # Run type-check and build for production
yarn build-only       # Build without type checking
yarn preview          # Preview production build locally

# Code Quality
yarn type-check       # Run Vue TypeScript compiler
yarn lint             # Run both oxlint and eslint with auto-fix
yarn lint:oxlint      # Fast linter (correctness checks)
yarn lint:eslint      # Full ESLint with auto-fix
yarn format           # Format code with Prettier

# Testing
yarn test:unit        # Run Vitest unit tests
```

## High-level Architecture

### Multi-game routing (App.vue)

`src/App.vue` is the entry. It instantiates **all five Pinia stores** and uses a `currentGameType` ref (`'sudoku' | 'tango' | 'minesweeper' | 'game2048' | 'picross'`) plus a `showMenu` flag to swap between the menu (`DifficultySelector`) and the active game's `Header` / `Grid` / `Controls` trio.

On mount, App.vue calls `loadGame()` on each store and resumes the **first** game with a saved state, otherwise it shows the menu.

### Store pattern (one per game)

Every game has a Pinia store under `src/stores/<game>.ts` using the Composition API pattern. Stores are the **single source of truth** for that game and follow a common shape:

- `grid`, `solution` / `config`, `difficulty` (or `gridSize`), `startTime`, `elapsedTime`, `isPaused`, `isCompleted` / `gameStatus`
- A `newGame()` / `resetGame()` pair that re-initializes via the game's generator
- `loadGame()` / `saveGame()` for `localStorage` persistence (each game has its own `STORAGE_KEY`)
- A timer interval managed inside the store (start on `newGame`, pause/resume, stop on completion)
- Game-specific actions (e.g. Sudoku's `selectCell`, `handleNumberInput`, `getHint`; Minesweeper's `revealCell`, `toggleFlag`; 2048's `move(direction)`)

When adding a new feature to a game, **modify its store first**, then have components react to the new state — never push game logic into components.

### Component layout

Per-game UI is consistently named `<Game>Header.vue`, `<Game>Grid.vue`, `<Game>Controls.vue` (plus `<Game>Cell.vue` where relevant). Shared components:

- `DifficultySelector.vue` — menu: pick game, then pick difficulty / grid size
- `Statistics.vue` — single modal showing stats for any game (switches by `selectedGameType`)
- `ConfirmModal.vue` — generic confirmation dialog (used for "new game" overrides)

### Generators / validators / utils

`src/utils/` is organized by game:

- `<game>Generator.ts` — puzzle generation (backtracking for Sudoku, constraint satisfaction for Tango, mine placement for Minesweeper, motif + clue derivation for Picross)
- `sudokuValidator.ts`, `tangoValidator.ts` — rule checking
- `<game>ScoreCalculator.ts` — per-game score (always on a 0–10 scale, weighted by errors > hints > time > pause)
- `<game>StatsManager.ts` — `localStorage` history per difficulty, aggregates (best time, best score, average, win rate, etc.)

When adding a new game: mirror this layout (`types/<game>.ts`, `stores/<game>.ts`, `utils/<game>{Generator,ScoreCalculator,StatsManager}.ts`, components, then wire it into `App.vue`, `DifficultySelector.vue`, and `Statistics.vue`).

### Sudoku specifics

**Generation** (`src/utils/sudokuGenerator.ts`):
1. `generateComplete()`: fills the grid using backtracking
2. `removeNumbers()`: removes cells based on difficulty while ensuring uniqueness
3. `hasUniqueSolution()`: counts solutions (stops at 2) to verify puzzle validity

The generator is parametrized by `GridSize` (6 = 2×3 regions, 9 = 3×3 regions).

Difficulty levels (`Difficulty` enum) and approximate cells removed for 9×9:
- `SIMPLE` ≈ 35 cells (~57% filled)
- `NORMAL` ≈ 45 cells
- `EXPERT` ≈ 52 cells
- `MAITRE` ≈ 58 cells
- `DIEUX_SUDOKU` ≈ 64 cells (~21% filled)

**Validation** (`src/utils/sudokuValidator.ts`): row/column/region rule checks, conflict listing, completion + filled checks.

### Tango specifics

Symbols are an enum (`TangoSymbol`: `MOON` / `SUN`), constraints between adjacent cells are an enum (`ConstraintType`: `EQUALS` / `NOT_EQUALS`) with a direction. Always 6×6.

### Minesweeper specifics

Mines are placed **after the first click** (so the first cell is always safe). Cells have a `MinesweeperCellState` enum (`HIDDEN`, `REVEALED`, `FLAGGED`). Game ends with a `MinesweeperGameStatus` (`PLAYING`, `WON`, `LOST`).

### 2048 specifics

Tiles are objects with stable `id` (animations rely on it), plus `mergedFrom` / `isNew` flags. The store's `move(direction)` performs all merges in the chosen direction and spawns a new tile. The grid size enum (`Game2048GridSize`: 3, 4, 5) doubles as the difficulty selector.

### Picross specifics

Each cell stores its target (`solution: boolean`) alongside its current state (`PicrossCellState`). Row/column clues are derived from the generated motif and stored on the game state.

## Type System

Each game has its own types module under `src/types/<game>.ts` (`Cell`, `Grid`, `Difficulty`, `GameState`, `GameStats`, `DifficultyStats`, etc., prefixed with the game name where they would otherwise collide).

**Important**: difficulty / size enums are declared as `const enum` to allow both type and value usage. Always import them as values (`import { Difficulty }` — **not** `import type`), otherwise the const enum inlining breaks at runtime.

## TypeScript Strictness

The codebase uses strict TypeScript with non-null assertions (`!`) for array access where indices are guaranteed valid (e.g. `grid[row]![col]!` in bounded loops). This is safe because row/col come from controlled iteration over the known grid size.

When adding code that accesses grids or arrays:
- Use `!` assertions in controlled loops with known bounds
- Validate bounds before accessing if indices come from user input
- `const enum` values must be imported as values, not type-only

## CSS Architecture

Global CSS variables live in `App.vue` with automatic dark mode via `@media (prefers-color-scheme: dark)`. Variables cover backgrounds, text, borders, cell states (`--cell-bg`, `--cell-hover`, `--cell-initial`, `--cell-highlighted`, `--cell-selected`, `--cell-error`), buttons, and feedback colors (`--success`, `--warning`).

Components use **scoped CSS** with these variables — never hard-code colors in components.

## PWA Configuration

`vite.config.ts` configures `vite-plugin-pwa`:
- Auto-updates the service worker on new builds
- Workbox precaches all JS / CSS / HTML / images
- Manifest sets standalone display, portrait orientation, theme colors

**Note**: `pwa-192x192.png` and `pwa-512x512.png` in `/public` are SVG placeholders. For production, replace with actual PNG icons.

## Keyboard Support (Sudoku)

Sudoku attaches `keydown` listeners on `window` from `GameControls.vue`:
- Number keys 1-9 — enter value or note (depending on `noteMode`)
- Backspace / Delete — clear selected cell
- N — toggle note mode

When adding keyboard shortcuts, attach them in the relevant component's setup, **not** in the store.

## Persistence Notes

Each store owns its own `localStorage` key — never share keys across games. Stats and active game state are stored separately (`<game>-game-state` for the in-progress game, separate keys for the per-difficulty stats history). When changing the persisted shape, bump or migrate carefully — the loaders are tolerant but assume the legacy fields are still present.
