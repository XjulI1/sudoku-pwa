# Sudoku PWA

Un jeu de Sudoku moderne développé avec Vue 3, TypeScript et configuré comme Progressive Web App (PWA).

## Fonctionnalités

### Gameplay

- **5 niveaux de difficulté** :
  - **Simple** : 35 cases vides (~43% de la grille remplie) - Idéal pour débuter
  - **Normal** : 45 cases vides (~44% de la grille remplie) - Difficulté équilibrée
  - **Expert** : 52 cases vides (~36% de la grille remplie) - Challenge élevé
  - **Maître** : 58 cases vides (~28% de la grille remplie) - Pour les experts
  - **Dieux du Sudoku** : 64 cases vides (~21% de la grille remplie) - Difficulté extrême
- **Mode Notes** : Ajoutez des notes dans les cases pour marquer les possibilités
- **Validation en temps réel** : Les erreurs sont mises en surbrillance automatiquement
- **Système d'indices** : Obtenez de l'aide quand vous êtes bloqué
- **Surbrillance intelligente** : Les lignes, colonnes et régions liées sont mises en évidence

### Fonctionnalités supplémentaires

- **Chronomètre** : Suivez votre temps de résolution
- **Sauvegarde automatique** : Votre progression est sauvegardée dans le localStorage
- **Mode sombre automatique** : S'adapte aux préférences système
- **PWA** : Installez l'application sur votre appareil et jouez hors ligne
- **Responsive** : Fonctionne sur desktop, tablette et mobile

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

1. **Sélectionnez une difficulté** au démarrage
2. **Cliquez sur une case** pour la sélectionner
3. **Utilisez les chiffres 1-9** en bas de l'écran ou votre clavier pour remplir les cases
4. **Mode Notes** : Activez le mode notes pour ajouter plusieurs petits chiffres dans une case
5. **Effacer** : Supprimez le contenu d'une case
6. **Indice** : Révèle la solution pour une case aléatoire (avec compteur)

## Raccourcis clavier

- `1-9` : Entrer un chiffre
- `Backspace` ou `Delete` : Effacer la case sélectionnée
- `N` : Basculer le mode notes

## Structure du projet

```
src/
├── components/          # Composants Vue
│   ├── DifficultySelector.vue
│   ├── GameControls.vue
│   ├── GameHeader.vue
│   ├── SudokuCell.vue
│   └── SudokuGrid.vue
├── stores/             # Store Pinia
│   └── sudoku.ts
├── types/              # Types TypeScript
│   └── sudoku.ts
├── utils/              # Utilitaires
│   ├── sudokuGenerator.ts
│   └── sudokuValidator.ts
└── App.vue             # Composant principal
```

## Technologies utilisées

- **Vue 3** avec Composition API
- **TypeScript** pour la sécurité des types
- **Pinia** pour la gestion d'état
- **Vite** comme bundler
- **vite-plugin-pwa** pour les fonctionnalités PWA

## Algorithmes

### Génération de grilles

L'algorithme de génération utilise le backtracking pour créer une grille valide complète, puis retire des cases en fonction de la difficulté tout en s'assurant qu'une solution unique existe.

### Validation

La validation vérifie en temps réel les conflits de lignes, colonnes et régions 3x3 selon les règles du Sudoku.

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
yarn type-check
```

### Lint

```bash
yarn lint
```

## Licence

MIT
