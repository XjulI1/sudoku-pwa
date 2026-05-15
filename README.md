# Puzzle Games PWA

Une collection de jeux de puzzle développée avec Vue 3, TypeScript et configurée comme Progressive Web App (PWA).

Bien que le dépôt s'appelle `sudoku-pwa`, l'application regroupe désormais **cinq jeux** : Sudoku, Tango, Démineur, 2048 et Picross.

## Jeux disponibles

| Jeu | Icône | Description |
| --- | --- | --- |
| **Sudoku** | 🔢 | Le classique jeu de logique numérique (grilles 6×6 et 9×9) |
| **Tango** | ☀️🌑 | Puzzle de symboles soleil / lune avec contraintes (grille 6×6) |
| **Démineur** | 💣 | Découvrez les cases sans déclencher les mines |
| **2048** | 🎯 | Fusionnez les tuiles pour atteindre 2048 (et au-delà) |
| **Picross** | 🧩 | Nonogramme : reconstituez l'image à partir des indices numériques |

## Fonctionnalités communes

- **Sélecteur de jeu** unique en page d'accueil
- **Sauvegarde automatique** dans le `localStorage` (une partie en cours par jeu)
- **Statistiques détaillées** par jeu et par difficulté : meilleur temps, temps moyen, meilleure note, taux de victoire, historique des parties
- **Système de notation sur 10** par jeu (pondération erreurs > indices > temps > pause)
- **Chronomètre** avec mise en pause
- **Mode sombre automatique** selon les préférences système
- **PWA installable** avec fonctionnement hors ligne (service worker, précaching Workbox)
- **Responsive** : desktop, tablette et mobile

## Détails par jeu

### Sudoku

- Tailles de grille : **6×6** (régions 2×3) et **9×9** (régions 3×3)
- 5 niveaux de difficulté :
  - **Simple** — idéal pour débuter
  - **Normal** — difficulté équilibrée
  - **Expert** — challenge élevé
  - **Maître** — pour les experts
  - **Dieux du Sudoku** — difficulté extrême
- Mode **Notes** (petits chiffres dans les cases)
- **Validation en temps réel** des erreurs (option activable)
- **Surbrillance** des lignes, colonnes et régions liées
- **Système d'indices** (compté dans la note finale)

### Tango

- Grille **6×6** avec deux symboles : 🌑 et ☀️
- Contraintes `=` (égalité) et `X` (différence) entre cellules adjacentes
- Règles : pas plus de deux symboles identiques consécutifs, autant de soleils que de lunes par ligne / colonne
- 3 niveaux : **Facile**, **Moyen**, **Difficile**
- Validation en temps réel et indices

### Démineur

- 3 niveaux :
  - **Débutant** — 9×9, 10 mines
  - **Intermédiaire** — 16×16, 40 mines
  - **Expert** — grille adaptative, 99 mines
- Pose de drapeaux, expansion automatique des cases vides
- Première case toujours sûre

### 2048

- 3 tailles de grille (qui font office de difficulté) :
  - **3×3** — objectif 512
  - **4×4** — objectif 2048 (classique)
  - **5×5** — objectif 4096
- Conservation du **meilleur score** par taille de grille
- Détection de fin de partie et mode « continuer » après victoire

### Picross (Nonogramme)

- 5 tailles de grille :
  - **Facile** — 5×5
  - **Moyen** — 8×8
  - **Intermédiaire** — 10×10
  - **Avancé** — 12×12
  - **Difficile** — 15×15
- Indices numériques sur les lignes et colonnes
- Validation et indices

## Installation

```bash
# Installer les dépendances
yarn install

# Lancer en mode développement
yarn dev

# Build de production
yarn build

# Prévisualiser le build
yarn preview
```

## Comment jouer

1. Au démarrage, **choisissez un jeu** parmi les cinq disponibles
2. Sélectionnez la **difficulté** (ou la taille de grille pour 2048 / Picross)
3. Démarrez la partie
4. Une **partie en cours** est automatiquement reprise au lancement suivant
5. Le bouton **Statistiques** depuis le menu donne accès aux historiques par jeu

## Raccourcis clavier (Sudoku)

- `1-9` : Entrer un chiffre
- `Backspace` ou `Delete` : Effacer la case sélectionnée
- `N` : Basculer le mode notes

## Structure du projet

```
src/
├── components/                # Composants Vue
│   ├── DifficultySelector.vue # Menu principal multi-jeux
│   ├── Statistics.vue         # Vue statistiques (tous les jeux)
│   ├── ConfirmModal.vue
│   ├── SudokuGrid.vue / SudokuCell.vue / GameControls.vue / GameHeader.vue
│   ├── TangoGrid.vue / TangoCell.vue / TangoControls.vue / TangoHeader.vue
│   ├── MinesweeperGrid.vue / MinesweeperCell.vue / MinesweeperControls.vue / MinesweeperHeader.vue
│   ├── Game2048Grid.vue / Game2048Controls.vue / Game2048Header.vue
│   └── PicrossGrid.vue / PicrossControls.vue / PicrossHeader.vue
├── stores/                    # Stores Pinia (un par jeu)
│   ├── sudoku.ts
│   ├── tango.ts
│   ├── minesweeper.ts
│   ├── game2048.ts
│   └── picross.ts
├── types/                     # Types TypeScript (un fichier par jeu)
│   ├── sudoku.ts
│   ├── tango.ts
│   ├── minesweeper.ts
│   ├── game2048.ts
│   └── picross.ts
├── utils/                     # Générateurs, validateurs, score, stats
│   ├── sudokuGenerator.ts / sudokuValidator.ts
│   ├── tangoGenerator.ts / tangoValidator.ts
│   ├── minesweeperGenerator.ts
│   ├── picrossGenerator.ts
│   ├── scoreCalculator.ts        + *ScoreCalculator.ts par jeu
│   └── statsManager.ts           + *StatsManager.ts par jeu
└── App.vue                    # Routage menu / vue de jeu
```

## Technologies utilisées

- **Vue 3** (Composition API, `<script setup>`)
- **TypeScript** strict
- **Pinia** pour la gestion d'état
- **Vite** comme bundler
- **vite-plugin-pwa** (Workbox) pour les fonctionnalités PWA
- **Vitest** pour les tests unitaires
- **ESLint + oxlint + Prettier** pour la qualité du code

## Algorithmes principaux

### Sudoku
Génération par **backtracking** d'une grille complète, puis retrait de cases en s'assurant qu'une **solution unique** existe.

### Tango
Génération d'une grille valide respectant les règles, puis ajout de **contraintes `=` / `X`** et retrait de cases selon la difficulté.

### Démineur
Placement aléatoire des mines **après** le premier clic (garantit une première case sûre), expansion BFS pour révéler les cases vides.

### 2048
Logique de fusion par direction sur grille N×N, génération de tuiles aléatoires (2 ou 4) après chaque mouvement.

### Picross
Génération aléatoire d'un motif puis dérivation des **indices numériques** par ligne et par colonne.

## Note sur les icônes PWA

Les fichiers `pwa-192x192.png` et `pwa-512x512.png` sont actuellement des placeholders SVG. Pour une application de production, remplacez-les par de vraies images PNG.

Vous pouvez générer des icônes à partir de `public/icon.svg` en utilisant un outil comme :

- [realfavicongenerator.net](https://realfavicongenerator.net/)
- [favicon.io](https://favicon.io/)

## Développement

### Configuration IDE recommandée

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

### Scripts utiles

```bash
yarn type-check       # Vérification des types Vue / TS
yarn lint             # oxlint + eslint avec auto-fix
yarn format           # Prettier
yarn test:unit        # Tests Vitest
```

## Licence

MIT
