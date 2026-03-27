# 🔗 Bitbucket Connector

Connecteur Node.js pour Bitbucket Server (Data Center) — monorepo avec module core partagé, extension VS Code et agent Copilot.

## 📦 Structure du projet

```
bitbucket-connector/
├── packages/
│   ├── core/                    # 🔧 Module partagé (API client TypeScript)
│   ├── vscode-extension/        # 🧩 Extension VS Code avec TreeView
│   └── copilot-extension/       # 🤖 Agent GitHub Copilot
├── connect_bitbucket.js         # Script CLI original
├── .env.example
└── package.json                 # Monorepo root (workspaces)
```

## ⚡ Installation rapide

```bash
# 1. Cloner le repo
git clone https://github.com/sarra1510/bitbucket-connector.git
cd bitbucket-connector

# 2. Installer les dépendances
npm install

# 3. Configurer les identifiants
cp .env.example .env
# Éditez .env avec vos identifiants
```

## 🔧 Configuration

Créez un fichier `.env` :

```env
BB_USER=votre_username
BB_TOKEN=votre_token
BB_BASE_URL=https://votre-bitbucket-server.com
BB_PROJECT=PROJET
BB_REPO=nom-du-repo
```

## 🚀 Utilisation — Script CLI

```bash
# Mode normal (connexion + exploration)
node connect_bitbucket.js

# Lire un fichier spécifique
node connect_bitbucket.js read chemin/vers/fichier.js

# Lire un fichier sur une branche spécifique
node connect_bitbucket.js read chemin/vers/fichier.js develop
```

## 🧩 Extension VS Code

### Installation

```bash
# Compiler le module core d'abord
npm run build:core

# Compiler l'extension
npm run build:vscode

# Packager (nécessite vsce)
cd packages/vscode-extension
npx vsce package
```

### Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 🌳 **TreeView Bitbucket** | Panneau latéral pour explorer les dossiers/fichiers |
| 📄 **Ouvrir un fichier** | Clic sur un fichier → s'ouvre dans VS Code (lecture seule) |
| 🌿 **Switcher de branche** | Changer de branche dans l'explorateur |
| 🔍 **Rechercher** | Chercher un fichier par nom dans le repo |
| ⚙️ **Settings** | Configurer URL/user/projet/repo dans les settings VS Code |

### Commandes VS Code

| Commande | Description |
|---|---|
| `Bitbucket: Connect to Bitbucket` | Se connecter au serveur |
| `Bitbucket: Refresh` | Rafraîchir l'explorateur |
| `Bitbucket: Switch Branch` | Changer de branche |
| `Bitbucket: Search Files` | Rechercher des fichiers |

### Settings VS Code

```json
{
  "bitbucketConnector.baseUrl": "https://bitbucket.my-nx.com",
  "bitbucketConnector.user": "votre_username",
  "bitbucketConnector.project": "PROJET",
  "bitbucketConnector.repo": "nom-du-repo"
}
```

## 🤖 Copilot Extension (Agent)

### Démarrer le serveur

```bash
# Compiler le module core d'abord
npm run build:core

# Compiler et démarrer l'agent Copilot
npm run build:copilot
npm run start:copilot
```

Le serveur démarre sur `http://localhost:3000`.

### Endpoints

| Méthode | URL | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/agent` | Endpoint Copilot (SSE streaming) |

### Commandes supportées

Vous pouvez chatter naturellement en français ou anglais :

```
connecte-toi / status
liste les branches / list branches
explore packages/ / browse src/
lis le fichier package.json / read src/index.ts
derniers commits / 20 commits sur develop
liste les PR ouvertes / PR merged
cherche package.json / search TODO
aide / help
```

## 🏗️ Build complet

```bash
npm run build
```

## 📋 Documentation

Voir [SPEC.md](SPEC.md) pour la spécification technique complète.
