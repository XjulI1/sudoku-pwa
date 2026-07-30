---
name: add-game
description: Scaffold a new puzzle/arcade game as an isolated bounded context (components/store/types/utils) in this Sudoku PWA app, and wire it into the 3 shared files (App.vue, DifficultySelector.vue, Statistics.vue). Use whenever the user asks to add a new game to the app.
---

# Add a new game

This app is a suite of puzzle games, each isolated under `src/contexts/<game>/`. **No context ever imports from another context** — every store/type/util only references its own game's files. Follow that invariant.

If the user hasn't already specified them, ask before scaffolding:

1. **Game id** (lowercase, used for folder/file names, e.g. `wordle`) and **PascalCase name** (e.g. `Wordle`) used for component/class names.
2. **The rules** in enough detail to model the grid/state and win condition.
3. **Difficulty axis**: a `Difficulty` enum (like Sudoku/Tango/Tectonic — varying rules/density) or a `GridSize` enum (like 2048 — same rules, different board size)?
4. **Does placing/revealing a cell need live validation** (a `<game>Validator.ts`, like Sudoku/Tango/Tectonic/Rikudo/Dédale), or is the win/lose condition simple enough to check directly in the store (like Minesweeper/2048 — no validator file)?
5. **Does the puzzle need procedural generation** (a `<game>Generator.ts` with backtracking/uniqueness checks — true for every current game except 2048, which just starts from an empty grid and spawns tiles)?

Pick the closest existing game as your template and read it fully before writing new code — don't invent a new shape:

- Grid-based logic puzzle with regions/constraints → **Tectonic** or **Dédale** (`src/contexts/tectonic`, `src/contexts/dedale`)
- Row/column symbol-placement puzzle → **Tango** (`src/contexts/tango`)
- Non-rectangular/graph-like board → **Rikudo** (`src/contexts/rikudo`, hex coordinates, flat cell list instead of 2D grid)
- No generator/validator, rules checked live in the store → **Minesweeper** or **2048** (`src/contexts/minesweeper`, `src/contexts/game2048`)

## 1. Scaffold the folder structure

```bash
mkdir -p src/contexts/<game>/{components,store,types,utils}
```

Add `utils/__tests__/` too if you'll write a generator spec (recommended whenever the generator has non-trivial backtracking/uniqueness logic — see `dedaleGenerator.spec.ts`, `rikudoGenerator.spec.ts`, `tectonicGenerator.spec.ts` as templates).

## 2. `types/<game>.ts`

Required exports (model on `src/contexts/sudoku/types/sudoku.ts` or whichever sibling is closest):

- A `const enum <Game>Difficulty` (or `<Game>GridSize`) — **must be `const enum`**, imported as a value (`import { XDifficulty }`, never `import type`).
- The cell/grid types for this game's board shape.
- `<Game>GameStats`: `{ difficulty, completionTime, errorsCount, hintsUsed, notesUsed, pauseTime, score, completedAt }` (drop fields that don't apply, e.g. no `notesUsed` if there's no notes concept).
- `<Game>DifficultyStats`: aggregated history — `{ difficulty, gamesPlayed, averageTime, averageScore, bestScore, bestTime, totalErrors, totalHints, history: <Game>GameStats[] }`.

## 3. `utils/<game>Generator.ts` (if applicable)

Backtracking generation + uniqueness check, same shape as `sudokuGenerator.ts`/`dedaleGenerator.ts`: `generateComplete()` → `removeNumbers()`/carve puzzle → `hasUniqueSolution()` (stop counting at 2 solutions).

## 4. `utils/<game>Validator.ts` (if applicable)

Static class: `isValidMove(...)`, `getConflicts(...)`, `isComplete(...)`, `isFilled(...)` — mirror `sudokuValidator.ts`/`tectonicValidator.ts`.

## 5. `utils/<game>ScoreCalculator.ts`

Copy `src/contexts/sudoku/utils/sudokuScoreCalculator.ts` and rename the class to `<Game>ScoreCalculator`. Keep the weighting (errors 40, hints 30, time 20, pause 10) and the 0-10 rounding; only adjust `REFERENCE_TIMES` per difficulty for this game's expected pace.

## 6. `utils/<game>StatsManager.ts`

Copy `src/contexts/sudoku/utils/sudokuStatsManager.ts` and rename the class to `<Game>StatsManager`. Change `STATS_STORAGE_KEY` to `'<game>-statistics'` and the type imports to this game's `GameStats`/`DifficultyStats`. Keep the method set: `saveGameStats`, `loadAllStats`, `loadDifficultyStats`, `resetAllStats`, `resetDifficultyStats`, `getTotalGamesPlayed`, `getBestScore`, `formatTime`.

## 7. `store/<game>.ts`

Pinia Composition API store, `use<Game>Store`. Must expose, at minimum (App.vue and DifficultySelector.vue call these on every game uniformly):

- `grid` (state, used by `hasActiveGame` in App.vue)
- `difficulty` (or `gridSize`)
- `newGame(difficulty)` — generates/resets the puzzle
- `resetGame()` — clears state back to the menu
- `loadGame()` / `saveGame()` — localStorage persistence, `loadGame()` returns a boolean (used in App.vue's `onMounted` load-chain)
- On completion, call `<Game>StatsManager.saveGameStats(...)`

## 8. `components/`

- `<Game>Header.vue` — timer, progress, pause/resume, emits `new-game`/`go-home`
- `<Game>Grid.vue` — maps `store.grid` to cell components (import cell component **relatively**, e.g. `import <Game>Cell from './<Game>Cell.vue'` — don't reach across contexts)
- `<Game>Cell.vue` — only if the board is cell-by-cell interactive (skip for 2048/Picross-style boards without a dedicated cell component)
- `<Game>Controls.vue` — input pad / actions; attach the keyboard listener here in `setup` (`window.addEventListener('keydown', ...)`), never in the store

## 9. Write `src/contexts/<game>/CLAUDE.md`

Every context has its own `CLAUDE.md` documenting that game precisely (for both future AI sessions and humans) — see the existing ones (e.g. `src/contexts/tectonic/CLAUDE.md`, `src/contexts/rikudo/CLAUDE.md`) as templates. Cover: rules recap, data model (grid/coordinate shape, special fields), difficulty table with exact constants, generation algorithm (function names, key steps), validation rules, store lifecycle notes (timer, hints, when stats are saved, localStorage keys), and any non-obvious gotcha or invariant you had to work out while building it.

## 10. Wire it into the 3 shared files

These are the only files outside `src/contexts/` that should change:

**`src/App.vue`**
- Import `use<Game>Store` and the 3 components
- Add `'<game>'` to the `GameType` union
- Add a branch in `hasActiveGame`
- Add `<game>Store.loadGame()` to the `onMounted` load-chain (and the corresponding `currentGameType.value = '<game>'` branch)
- Add branches in `restartCurrentGame()` and `goHome()`
- Add a `<template v-else-if="currentGameType === '<game>'">` block rendering Header/Grid/Controls

**`src/components/DifficultySelector.vue`**
- Import the difficulty/grid-size type and the store
- Add a game entry to the menu UI and the difficulty options for it
- Call `store.newGame(...)` when the user starts this game
- If other games show a live puzzle preview (see Tectonic/Rikudo using their `Generator` directly), decide whether this game needs one

**`src/components/Statistics.vue`**
- Import the difficulty type and `<Game>StatsManager`
- Add this game's difficulty list constant
- Add a branch in each of: `totalGamesPlayed`, `bestScore`, `currentStats`, `difficulties`
- Add a template tab/section for this game's stats

## 11. Verify

```bash
pnpm run type-check
pnpm run lint
pnpm run test:unit
```

Claude should not launch a browser to self-verify the UI — run the checks above, then ask the user to try the new game visually.
