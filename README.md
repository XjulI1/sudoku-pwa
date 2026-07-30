# Sudoku PWA

Une suite de jeux de réflexion et de puzzle développée avec Vue 3, TypeScript et configurée comme Progressive Web App (PWA). Née comme un simple Sudoku, l'application propose aujourd'hui **8 jeux** indépendants.

## Jeux disponibles

- **Sudoku** — grilles 6x6 et 9x9, 5 niveaux de difficulté (Simple à Dieux du Sudoku), mode notes, indices.
- **Tango** — grille 6x6, deux symboles (☀️/🌑) à placer sans 3 symboles identiques consécutifs, autant de soleils que de lunes par ligne/colonne, et contraintes `=`/`x` entre certaines cases.
- **Démineur** — le classique : révéler les cases sans tomber sur une mine, en s'aidant des chiffres indiquant les mines adjacentes.
- **2048** — fusionnez les tuiles de même valeur en glissant la grille (3×3, 4×4 ou 5×5) jusqu'à atteindre 2048.
- **Picross** — remplissez la grille selon les indices numériques de chaque ligne/colonne pour révéler l'image cachée.
- **Dédale** — reliez chaque paire de lettres identiques par un tracé continu qui remplit toute la grille (façon "Flow").
- **Tectonic** — remplissez chaque zone irrégulière avec des chiffres consécutifs (1 à N), sans répétition entre cases adjacentes (même en diagonale).
- **Rikudo** — placez les nombres 1 à N dans l'ordre sur une grille hexagonale, deux nombres consécutifs devant toujours être adjacents.

## Fonctionnalités communes

- **Chronomètre** avec pause/reprise
- **Statistiques complètes par jeu et par difficulté** :
  - Historique des parties
  - Système de notation sur 10 (pondération : erreurs 40% > indices 30% > temps 20% > pause 10%)
  - Temps moyen/meilleur temps, note moyenne/meilleure note
  - Compteurs d'erreurs et d'indices
- **Sauvegarde automatique** de la partie en cours dans le localStorage
- **Mode sombre automatique** : s'adapte aux préférences système
- **PWA** : installable, jouable hors ligne
- **Responsive** : desktop, tablette et mobile

## Installation

```bash
# Installer les dépendances
pnpm install

# Lancer en mode développement
pnpm run dev

# Build de production
pnpm run build

# Prévisualiser le build
pnpm run preview
```

## Comment jouer

1. **Choisissez un jeu et une difficulté** au démarrage
2. Chaque jeu a ses propres contrôles (voir en jeu), en général : sélection d'une case puis saisie via le clavier ou les boutons à l'écran
3. **Nouvelle partie** / **Accueil** sont accessibles depuis l'en-tête de chaque jeu (avec confirmation si une partie est en cours)
4. **Statistiques** : consultez votre historique et vos records depuis le menu principal

## Raccourcis clavier

Selon le jeu :

- **Sudoku / Tango / Tectonic / Rikudo** : `1-9` pour entrer une valeur/un symbole, `Backspace`/`Delete` pour effacer, `N` pour basculer le mode notes (Sudoku)
- **2048 / Dédale** : flèches directionnelles (`↑ ↓ ← →`) pour déplacer les tuiles / tracer un chemin
- **Picross** : `Backspace`/`Delete` pour effacer une case

## Structure du projet

Chaque jeu est isolé dans son propre contexte sous `src/contexts/<jeu>/`, en reprenant le même découpage (components / store / types / utils). Aucun contexte ne dépend d'un autre.

```
src/
├── App.vue                    # Switcher principal entre jeux + thème global
├── main.ts                    # Bootstrap Vue + Pinia
├── components/                # Composants communs à tous les jeux
│   ├── DifficultySelector.vue #   Écran de démarrage (choix jeu + difficulté)
│   ├── Statistics.vue         #   Statistiques agrégées de tous les jeux
│   └── ConfirmModal.vue       #   Modale de confirmation générique
└── contexts/
    ├── sudoku/
    │   ├── components/         # SudokuHeader, SudokuGrid, SudokuCell, SudokuControls
    │   ├── store/sudoku.ts     # État du jeu (Pinia)
    │   ├── types/sudoku.ts     # Enums, Grid/Cell, GameStats
    │   └── utils/              # sudokuGenerator, sudokuValidator, sudokuScoreCalculator, sudokuStatsManager
    ├── tango/         ...      # même découpage
    ├── minesweeper/   ...
    ├── game2048/      ...
    ├── picross/       ...
    ├── dedale/        ...
    ├── tectonic/      ...
    └── rikudo/        ...
```

Pour ajouter un nouveau jeu en suivant ce découpage, voir le skill Claude Code `add-game` (`.claude/skills/add-game/SKILL.md`).

## Technologies utilisées

- **Vue 3** avec Composition API
- **TypeScript** pour la sécurité des types
- **Pinia** pour la gestion d'état
- **Vite** comme bundler
- **vite-plugin-pwa** pour les fonctionnalités PWA

## Algorithmes

### Génération de grilles

La plupart des jeux (Sudoku, Tango, Picross, Dédale, Tectonic, Rikudo, Démineur) génèrent leur grille via un algorithme dédié dans `utils/<jeu>Generator.ts`, avec pour les jeux de logique (Sudoku, Tango, Tectonic, Rikudo, Dédale) une vérification d'unicité de la solution par backtracking.

### Validation

Les jeux dont les règles nécessitent une vérification en temps réel des coups (Sudoku, Tango, Tectonic, Rikudo, Dédale) ont un `utils/<jeu>Validator.ts` dédié. Le Démineur et 2048 gèrent leur logique de coup directement dans leur store.

## Note sur les icônes PWA

Les fichiers `pwa-192x192.png` et `pwa-512x512.png` sont actuellement des placeholders SVG. Pour une application de production, remplacez-les par de vraies images PNG de votre icône.

Vous pouvez générer des icônes à partir de `public/icon.svg` en utilisant un outil comme :

- [realfavicongenerator.net](https://realfavicongenerator.net/)
- [favicon.io](https://favicon.io/)

## Développement

### Configuration IDE recommandée

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

### Type-check

```bash
pnpm run type-check
```

### Lint

```bash
pnpm run lint
```

## Licence

MIT
