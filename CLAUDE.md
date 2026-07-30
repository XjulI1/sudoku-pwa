# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sudoku PWA is a Progressive Web App built with Vue 3 and TypeScript. It has grown from a single Sudoku game into a **suite of 8 puzzle/arcade games**, each with multiple difficulty levels, a timer, statistics, and automatic save:

- **Sudoku** (`src/contexts/sudoku`)
- **Tango** (`src/contexts/tango`)
- **Minesweeper** (`src/contexts/minesweeper`)
- **2048** (`src/contexts/game2048`)
- **Picross** (`src/contexts/picross`)
- **Dédale** (`src/contexts/dedale`)
- **Tectonic** (`src/contexts/tectonic`)
- **Rikudo** (`src/contexts/rikudo`)

## Development Commands

```bash
# Development
pnpm run dev              # Start dev server with hot reload

# Building
pnpm run build            # Run type-check and build for production
pnpm run build-only       # Build without type checking
pnpm run preview          # Preview production build locally

# Code Quality
pnpm run type-check       # Run Vue TypeScript compiler
pnpm run lint             # Run both oxlint and eslint with auto-fix
pnpm run lint:oxlint      # Fast linter (correctness checks)
pnpm run lint:eslint      # Full ESLint with auto-fix
pnpm run format           # Format code with Prettier

# Testing
pnpm run test:unit        # Run Vitest unit tests
```

## Architecture

### Bounded contexts per game

Each game is fully isolated under `src/contexts/<game>/`, and **no context imports from another context** — keep it that way when adding code:

```
src/contexts/<game>/
  components/   <Game>Header.vue, <Game>Grid.vue, <Game>Controls.vue, <Game>Cell.vue (if grid is cell-based)
  store/        <game>.ts               — Pinia store, single source of truth for that game's state
  types/        <game>.ts               — enums, Grid/Cell types, GameStats/DifficultyStats
  utils/        <game>Generator.ts      — puzzle generation (backtracking, etc.) — most games have one
                <game>Validator.ts      — move/rule validation — only where rules need runtime checking
                                           (minesweeper and 2048 have no validator, logic lives in the store)
                <game>ScoreCalculator.ts — weighted 0-10 score (errors 40% > hints 30% > time 20% > pause 10%)
                <game>StatsManager.ts   — localStorage persistence of per-difficulty history
                (+ game-specific helpers, e.g. dedaleColors.ts, tectonicRegions.ts, rikudoGeometry.ts)
  utils/__tests__/ — generator specs where generation logic is non-trivial (dedale, tectonic, rikudo)
```

Each context also has its own `src/contexts/<game>/CLAUDE.md` with that game's exact rules, data model, generation/validation algorithms, store lifecycle and known quirks — read it before making non-trivial changes to a given game, it's more precise than this file for anything game-specific.

To add a new game, use the **`add-game` skill** (`.claude/skills/add-game/SKILL.md`) — it scaffolds this structure and lists every integration point (including creating that context's own `CLAUDE.md`).

### Shared/common layer (outside contexts, used by all games)

- `src/App.vue`: top-level game switcher. Holds `currentGameType`, imports every store + every game's Header/Grid/Controls, and routes `v-if`/`v-else-if` blocks per game. Also owns the global CSS variables (theme) and the new-game/go-home confirmation flow.
- `src/main.ts`: Vue + Pinia bootstrap.
- `src/components/DifficultySelector.vue`: start menu, lets the user pick a game + difficulty, calls `store.newGame(...)`.
- `src/components/Statistics.vue`: aggregates and displays stats across all 8 games (per-game `*StatsManager`).
- `src/components/ConfirmModal.vue`: generic confirm dialog, game-agnostic.

Because these three files touch every game, adding/changing a game means editing them too — see the `add-game` skill for the exact edits.

### Common pattern inside a context (illustrated with Sudoku)

**State management** (`src/contexts/sudoku/store/sudoku.ts`) — Pinia Composition API store, single source of truth for:

- **Game grid**: 2D array of `Cell` objects (value, notes, flags)
- **Solution**: complete solved grid used for validation and hints
- **Timer state**: startTime, elapsedTime, isPaused
- **Game metadata**: difficulty, completion status, hints used
- **UI state**: selectedCell, noteMode, showErrors

Key methods (same shape across every game's store): `newGame(difficulty)`, `resetGame()`, `loadGame()`/`saveGame()` (localStorage), plus game-specific interaction handlers (e.g. `handleNumberInput`, `updateErrors`, `getHint`).

**Generation** (`src/contexts/sudoku/utils/sudokuGenerator.ts`):

1. `generateComplete()`: fills the grid using backtracking
2. `removeNumbers()`: removes cells based on difficulty while ensuring a unique solution
3. `hasUniqueSolution()`: counts solutions (stops at 2) to verify puzzle validity

**Validation** (`src/contexts/sudoku/utils/sudokuValidator.ts`): `isValidMove()`, `getConflicts()`, `isComplete()`, `isFilled()`.

**Component structure**: `SudokuHeader.vue` (timer/progress/pause), `SudokuGrid.vue` (maps `store.grid` to cells), `SudokuCell.vue` (value or notes display, visual states), `SudokuControls.vue` (number pad, note toggle, keyboard listener).

Every other context follows the same shapes, adapted to that game's rules — read the sibling context most similar to what you're building before inventing a new pattern.

### Type System

Each `src/contexts/<game>/types/<game>.ts` defines that game's core types, always including:

- A `Difficulty` (or `GridSize`) **`const enum`** (enables inlining, used as runtime values). Import as `import { Difficulty }`, not `import type` — this applies to every game's difficulty/grid-size enum.
- Grid/Cell types specific to that game's board shape.
- `GameStats` (one completed game: completionTime, errorsCount, hintsUsed, notesUsed, pauseTime, score, completedAt) and `DifficultyStats` (aggregated history per difficulty) — consumed by `Statistics.vue`.

### CSS Architecture

Global CSS variables in `App.vue` with automatic dark mode via `@media (prefers-color-scheme: dark)`:

- Light theme: --primary: #3b82f6 (blue)
- Dark theme: --primary: #60a5fa (lighter blue), dark backgrounds
- Cell states: --cell-bg, --cell-hover, --cell-initial, --cell-highlighted, --cell-selected, --cell-error

Components use scoped CSS with these variables for consistent theming across all games.

### PWA Configuration

`vite.config.ts` configures vite-plugin-pwa:

- Auto-updates service worker on new builds
- Workbox precaches all JS/CSS/HTML/images
- Manifest sets standalone display, portrait orientation, theme colors

**Note**: `pwa-192x192.png` and `pwa-512x512.png` in `/public` are SVG placeholders. For production, replace with actual PNG icons. The manifest `name`/`description` in `vite.config.ts` still reference "Sudoku" only — update them if/when the multi-game branding should be reflected in the installed app.

## TypeScript Strictness

The codebase uses strict TypeScript with non-null assertions (`!`) for array access where indices are guaranteed valid (e.g., `grid[row]![col]!` in bounded loops). This is safe because indices stay within the known board dimensions.

When adding code that accesses grids or arrays:

- Use `!` assertions in controlled loops with known bounds
- Validate bounds before accessing if indices come from user input
- Every game's `Difficulty`/`GridSize` enum must be imported as a value, not type-only

## Keyboard Support

Each game attaches its own keydown listener inside its `<Game>Controls.vue` component (e.g. `src/contexts/sudoku/components/SudokuControls.vue` handles number keys 1-9, Backspace/Delete, and `N` to toggle note mode).

When adding keyboard shortcuts, attach to `window` in the component's `setup`, not in the store.

## No cross-game dependencies

Verified invariant: no store/type/util in one context imports from another context. Preserve this — shared logic belongs in the common layer described above, not by reaching into a sibling context.
