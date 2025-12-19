# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sudoku PWA is a Progressive Web Application built with Vue 3 and TypeScript. It's a complete Sudoku game with multiple difficulty levels, notes system, validation, hints, timer, and automatic save.

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

## Architecture

### State Management (Pinia Store)

The entire game state is centralized in `src/stores/sudoku.ts` using Pinia's Composition API pattern. This is the **single source of truth** for:

- **Game grid**: 9x9 array of `Cell` objects (value, notes, flags)
- **Solution**: Complete solved grid used for validation and hints
- **Timer state**: startTime, elapsedTime, isPaused with interval management
- **Game metadata**: difficulty, completion status, hints used
- **UI state**: selectedCell, noteMode, showErrors

Key methods:
- `newGame(difficulty)`: Generates puzzle via SudokuGenerator, initializes state
- `selectCell(row, col)`: Updates selection and triggers cell highlighting
- `handleNumberInput(num)`: Routes to either value or note based on noteMode
- `updateErrors()`: Validates entire grid, sets isError flags on cells
- `getHint()`: Reveals random empty cell from solution
- `saveGame()`/`loadGame()`: localStorage persistence

### Sudoku Algorithms

**Generation** (`src/utils/sudokuGenerator.ts`):
1. `generateComplete()`: Fills 9x9 grid using backtracking algorithm
2. `removeNumbers()`: Removes cells based on difficulty while ensuring unique solution
3. `hasUniqueSolution()`: Counts solutions (stops at 2) to verify puzzle validity

Difficulty levels remove different amounts of cells:
- SIMPLE: 35 cells (~43% filled)
- NORMAL: 45 cells
- EXPERT: 52 cells
- MAITRE: 58 cells (~28% filled)

**Validation** (`src/utils/sudokuValidator.ts`):
- `isValidMove()`: Checks if number placement violates row/column/3x3 region rules
- `getConflicts()`: Returns positions conflicting with a given cell
- `isComplete()`: Compares grid against solution
- `isFilled()`: Checks if all cells have values

### Component Structure

**Data flow**: User interaction → GameControls → Store actions → Grid updates → SudokuCell re-renders

- `App.vue`: Routes between DifficultySelector (menu) and game view
- `DifficultySelector.vue`: Initial screen, calls `store.newGame(difficulty)`
- `GameHeader.vue`: Displays timer, progress bar, pause/resume controls
- `SudokuGrid.vue`: 9x9 grid container, maps store.grid to SudokuCell components
- `SudokuCell.vue`: Individual cell, displays value OR notes grid, handles visual states
- `GameControls.vue`: Number pad (1-9), note mode toggle, erase, hint buttons

### Type System

`src/types/sudoku.ts` defines core types:

- `Cell`: Object with value, notes (Set), isInitial/isError/isHighlighted flags
- `Grid`: 2D array of Cells (Cell[][])
- `Difficulty`: const enum (enables inlining, used as runtime values)
- `Position`: {row, col} coordinates

**Important**: `Difficulty` is declared as `const enum` to allow both type and value usage. Import as `import { Difficulty }` not `import type`.

### CSS Architecture

Global CSS variables in `App.vue` with automatic dark mode via `@media (prefers-color-scheme: dark)`:

- Light theme: --primary: #3b82f6 (blue)
- Dark theme: --primary: #60a5fa (lighter blue), dark backgrounds
- Cell states: --cell-bg, --cell-hover, --cell-initial, --cell-highlighted, --cell-selected, --cell-error

Components use scoped CSS with these variables for consistent theming.

### PWA Configuration

`vite.config.ts` configures vite-plugin-pwa:
- Auto-updates service worker on new builds
- Workbox precaches all JS/CSS/HTML/images
- Manifest sets standalone display, portrait orientation, theme colors

**Note**: `pwa-192x192.png` and `pwa-512x512.png` in `/public` are SVG placeholders. For production, replace with actual PNG icons.

## TypeScript Strictness

The codebase uses strict TypeScript with non-null assertions (`!`) for array access where indices are guaranteed valid (e.g., `grid[row]![col]!` in 9x9 loops). This is safe because row/col are always 0-8.

When adding code that accesses grids or arrays:
- Use `!` assertions in controlled loops with known bounds
- Validate bounds before accessing if indices come from user input
- The `Difficulty` enum must be imported as value, not type-only

## Keyboard Support

The app listens for keydown events in `GameControls.vue`:
- Number keys 1-9: Enter value or note
- Backspace/Delete: Clear selected cell
- N key: Toggle note mode

When adding keyboard shortcuts, attach to window in component setup, not in store.
