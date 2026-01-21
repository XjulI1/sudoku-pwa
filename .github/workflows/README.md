# CI/CD Workflows

Ce dossier contient les workflows GitHub Actions pour automatiser le build et la publication de l'application.

## 📋 Workflow: Build and Release

**Fichier**: `build-and-release.yml`

### 🎯 Objectif

Automatiser le processus de build et de publication des releases de l'application Sudoku & Tango PWA.

### 🚀 Déclencheurs

- **Push sur `main`**: Crée une release stable
- **Pull Request** (opened, synchronize, reopened): Crée une pre-release temporaire

### 📦 Jobs

#### 1. Build Application

Ce job est exécuté pour tous les événements (PR et push sur main).

**Étapes**:
1. Checkout du code
2. Configuration de Node.js 20 avec cache yarn
3. Installation des dépendances (`yarn install --frozen-lockfile`)
4. Vérification des types (`yarn type-check`)
5. Linting (`yarn lint`)
6. Build de production (`yarn build`)
7. Upload des artifacts de build (dossier `dist/`)

**Artifacts**: Le dossier `dist/` est disponible pendant 7 jours pour les autres jobs.

#### 2. Create Pre-Release (PR)

Ce job s'exécute uniquement pour les Pull Requests.

**Étapes**:
1. Téléchargement des artifacts de build
2. Création d'une archive ZIP: `sudoku-pwa-pr-{PR_NUMBER}.zip`
3. Génération du tag: `pr-{PR_NUMBER}-{SHORT_SHA}`
4. Suppression de la pre-release précédente (si elle existe)
5. Création de la nouvelle pre-release

**Caractéristiques**:
- Tag format: `pr-123-a1b2c3d`
- Archive: `sudoku-pwa-pr-123.zip`
- Marquée comme pre-release (non stable)
- Remplacée automatiquement à chaque nouveau commit sur la PR
- Contient les informations de la PR dans les notes

#### 3. Create Stable Release

Ce job s'exécute uniquement pour les push sur la branche `main`.

**Étapes**:
1. Téléchargement des artifacts de build
2. Récupération du dernier tag de version
3. Auto-incrémentation de la version patch (v1.0.0 → v1.0.1)
4. Création d'une archive ZIP: `sudoku-pwa-v{VERSION}.zip`
5. Génération automatique des release notes à partir des commits
6. Création de la release stable

**Caractéristiques**:
- Tag format: `v1.0.0`, `v1.0.1`, etc.
- Archive: `sudoku-pwa-v1.0.0.zip`
- Marquée comme "latest" (release stable)
- Release notes générées automatiquement avec:
  - Liste des commits depuis la dernière version
  - Instructions d'installation
  - Liste des fonctionnalités
  - Lien vers le changelog complet

### 📥 Utilisation des Releases

#### Pour tester une Pull Request:

1. Allez dans l'onglet "Releases" du repository
2. Trouvez la pre-release correspondant à votre PR: `pr-{PR_NUMBER}-{SHORT_SHA}`
3. Téléchargez l'archive `sudoku-pwa-pr-{PR_NUMBER}.zip`
4. Extrayez et déployez sur votre serveur de test

#### Pour déployer en production:

1. Allez dans l'onglet "Releases" du repository
2. Trouvez la dernière release stable (marquée "Latest")
3. Téléchargez l'archive `sudoku-pwa-v{VERSION}.zip`
4. Extrayez et déployez sur votre serveur de production

### 🔧 Versioning

Le workflow utilise le **Semantic Versioning** (SemVer) avec auto-incrémentation:

- **Format**: `v{MAJOR}.{MINOR}.{PATCH}`
- **Auto-incrémentation**: Le `PATCH` est automatiquement incrémenté à chaque merge sur `main`
- **Version initiale**: Si aucun tag n'existe, démarre à `v1.0.0`

Pour faire une release **MINOR** ou **MAJOR** manuelle:
```bash
# Minor version (v1.0.0 → v1.1.0)
git tag v1.1.0
git push origin v1.1.0

# Major version (v1.1.0 → v2.0.0)
git tag v2.0.0
git push origin v2.0.0
```

### 🔐 Permissions Requises

Le workflow nécessite les permissions suivantes:
- `contents: write` - Pour créer des tags et releases
- `pull-requests: read` - Pour lire les informations des PRs

Ces permissions sont configurées dans le workflow et sont accordées automatiquement par GitHub Actions via le token `GITHUB_TOKEN`.

### ⚠️ Notes Importantes

1. **Pre-releases de PR**: Elles sont automatiquement remplacées à chaque nouveau commit sur la PR. Seule la dernière version est conservée.

2. **Releases stables**: Elles ne sont jamais supprimées automatiquement. Elles restent disponibles indéfiniment.

3. **Artifacts de build**: Les artifacts temporaires sont conservés 7 jours dans GitHub Actions, mais les ZIPs dans les releases restent disponibles tant que la release existe.

4. **Échec du build**: Si le build échoue (erreurs TypeScript, linting, etc.), aucune release n'est créée.

### 🛠️ Maintenance

Pour modifier le comportement du workflow:

- **Changer la stratégie de versioning**: Modifiez la section `Get latest version tag` dans le job `release-stable`
- **Ajouter des étapes de build**: Ajoutez-les dans le job `build`
- **Personnaliser les release notes**: Modifiez la section `Generate release notes`

### 📊 Visualisation

Vous pouvez suivre l'exécution des workflows dans l'onglet "Actions" du repository GitHub.

Chaque exécution affiche:
- Le statut de chaque job (✅ succès, ❌ échec)
- Les logs détaillés de chaque étape
- Les artifacts générés
- Le temps d'exécution
