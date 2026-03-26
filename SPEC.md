# 📋 Spécification Technique — Bitbucket Connector

## 1. Présentation

**Nom du projet** : Bitbucket Connector  
**Auteur** : sarra.dhaha (@sarra1510)  
**Date de création** : 2026-03-26  
**Version** : 1.0.0  

### Objectif
Script Node.js permettant de se connecter à un serveur **Bitbucket Server (Data Center)** auto-hébergé via l'API REST, afin de :
- Tester la connexion et l'authentification
- Récupérer les informations d'un repository
- Lister les branches
- Explorer l'arborescence des fichiers

---

## 2. Architecture

### Stack technique
| Composant | Technologie |
|---|---|
| Runtime | Node.js |
| HTTP Client | axios |
| Gestion des secrets | dotenv |
| API cible | Bitbucket Server REST API 1.0 |

### Structure du projet
```
Bitbucket_connector/
├── .env                     # Variables d'environnement (secrets)
├── .gitignore               # Fichiers ignorés par Git
├── connect_bitbucket.js     # Script principal
├── package.json             # Dépendances Node.js
├── SPEC.md                  # Ce document
└── README.md                # Guide d'utilisation
```

---

## 3. Configuration

### 3.1 Variables d'environnement (`.env`)

| Variable | Description | Exemple |
|---|---|---|
| `BB_USER` | Nom d'utilisateur Bitbucket Server | `sarra.dhaha` |
| `BB_TOKEN` | HTTP Access Token (ou mot de passe) | `ATBB...` |
| `BB_BASE_URL` | URL de l'instance Bitbucket Server | `https://bitbucket.my-nx.com` |
| `BB_PROJECT` | Clé du projet Bitbucket | `IM` |
| `BB_REPO` | Slug du repository | `nximpress` |

### 3.2 Authentification

Deux méthodes supportées (par ordre de priorité) :

1. **Bearer Token** (recommandé)  
   - Créé via : `Paramètres de compte` → `Jetons d'accès HTTP`
   - Permissions requises : `Repository Read`
   - Header : `Authorization: Bearer <token>`

2. **Basic Auth** (fallback)  
   - Utilise le mot de passe de connexion Bitbucket
   - Variable : `BB_PASSWORD` dans `.env`

---

## 4. API Endpoints utilisés

Base URL : `{BB_BASE_URL}/rest/api/1.0`

| Endpoint | Méthode | Description |
|---|---|---|
| `/projects/{key}/repos/{slug}` | GET | Informations du repository |
| `/projects/{key}/repos/{slug}/branches` | GET | Liste des branches |
| `/projects/{key}/repos/{slug}/files/{path}` | GET | Liste des fichiers dans un dossier |
| `/projects/{key}/repos/{slug}/browse/{path}` | GET | Parcourir le contenu d'un dossier |
| `/projects/{key}/repos/{slug}/browse/{path}` | GET | Récupérer le contenu d'un fichier (avec pagination des lignes) |

### Paramètres de requête

| Paramètre | Type | Description |
|---|---|---|
| `limit` | integer | Nombre max de résultats (défaut: 25) |
| `start` | integer | Index de départ pour la pagination |

---

## 5. Fonctionnalités implémentées (v1.0)

### 5.1 Test de connexion
- Vérifie que les identifiants sont valides
- Affiche les infos du repository (nom, description, état)
- Affiche les URLs de clone (SSH et HTTP)

### 5.2 Liste des branches
- Récupère toutes les branches du repository
- Identifie la branche par défaut (⭐)

### 5.3 Exploration des fichiers
- Parcourt l'arborescence du repository
- Distingue les dossiers (📁) des fichiers (📄)
- Affiche la taille des fichiers

### 5.4 Lecture du contenu d'un fichier
- Endpoint : `GET /projects/{key}/repos/{slug}/browse/{path}?at=refs/heads/{branch}`
- Gère la pagination : boucle avec les paramètres `start` et `isLastPage` jusqu'à récupérer toutes les lignes
- Affiche le chemin du fichier, la branche utilisée et la taille en bytes
- Affiche le contenu ligne par ligne avec numéros de ligne
- Gère les erreurs (fichier non trouvé HTTP 404, erreur d'accès, etc.)

**Exemples d'utilisation CLI :**

```bash
# Lire un fichier sur la branche par défaut
node connect_bitbucket.js read README.md

# Lire un fichier sur une branche spécifique
node connect_bitbucket.js read packages/some-package/package.json master

# Lire un fichier sur la branche develop
node connect_bitbucket.js read packages/some-package/README.md develop
```

---

## 6. Prérequis

| Outil | Version minimale | Vérification |
|---|---|---|
| Node.js | 16+ | `node --version` |
| npm | 8+ | `npm --version` |
| curl | 7+ | `curl --version` |
| Accès réseau | — | Accès à `bitbucket.my-nx.com` |

### Installation des dépendances
```bash
npm install axios dotenv
```

---

## 7. Sécurité

| Règle | Détail |
|---|---|
| Secrets | Jamais dans le code source, uniquement dans `.env` |
| `.gitignore` | `.env` et `node_modules/` sont ignorés |
| Tokens | Permissions minimales (`Repository Read`) |
| HTTPS | Toutes les communications sont chiffrées |

---

## 8. Problèmes rencontrés et solutions

| Problème | Cause | Solution |
|---|---|---|
| `\r: command not found` | Fins de ligne Windows (CRLF) | Utiliser un fichier `.bat` ou Node.js |
| `./script.sh` non reconnu | CMD Windows | Utiliser `node script.js` ou Git Bash |
| HTTP 401 | Mauvais identifiants | Vérifier `.env`, utiliser user+password |
| HTTP 404 | Mauvaise URL API | Utiliser `/rest/api/1.0` (pas `api.bitbucket.org`) |
| Bitbucket Cloud vs Server | API différentes | Cloud: `api.bitbucket.org/2.0`, Server: `/rest/api/1.0` |

---

## 9. Architecture v2.0 — Monorepo

### Structure

```
bitbucket-connector/
├── packages/
│   ├── core/                    # 🔧 Module partagé
│   │   ├── src/
│   │   │   ├── client.ts        # BitbucketClient class
│   │   │   ├── types.ts         # Interfaces TypeScript
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── vscode-extension/        # 🧩 Extension VS Code
│   │   ├── src/
│   │   │   ├── extension.ts     # Point d'entrée
│   │   │   ├── treeView.ts      # Explorateur Bitbucket (TreeView)
│   │   │   ├── fileViewer.ts    # Ouvrir les fichiers
│   │   │   └── commands.ts      # Commandes VS Code
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── copilot-extension/       # 🤖 Copilot Agent
│       ├── src/
│       │   ├── agent.ts         # Handler Copilot
│       │   ├── skills.ts        # Skills Bitbucket
│       │   └── server.ts        # Serveur HTTP (SSE streaming)
│       ├── package.json
│       └── tsconfig.json
├── connect_bitbucket.js         # Script CLI original (inchangé)
└── package.json                 # Monorepo root (npm workspaces)
```

### Module Core (`@bitbucket-connector/core`)

**BitbucketClient** — classe TypeScript réutilisable :

| Méthode | Description |
|---|---|
| `getRepoInfo()` | Informations du repository |
| `getBranches(limit)` | Liste des branches |
| `browse(path, branch)` | Exploration d'un dossier |
| `readFile(filePath, branch)` | Lecture avec pagination |
| `getCommits(limit, branch)` | Liste des commits |
| `getPullRequests(state, limit)` | Liste des pull requests |
| `searchFiles(query, path)` | Recherche de fichiers par nom |

### Extension VS Code

| Composant | Description |
|---|---|
| `BitbucketTreeProvider` | Implémente `TreeDataProvider` — panneau latéral |
| `FileViewerProvider` | Implémente `TextDocumentContentProvider` — schéma `bitbucket:` |
| Commandes | connect, refresh, openFile, switchBranch, searchFiles |
| Settings | baseUrl, user, project, repo via VS Code settings |
| Token | Stocké dans `context.secrets` (SecretStorage) |

### Copilot Extension (Agent)

**Serveur HTTP** sur le port 3000 (configurable via `PORT`) :
- `GET /` — health check
- `POST /agent` — endpoint Copilot avec SSE streaming

**Agent NLP** — parsing naturel français/anglais :
- connexion/status, branches, browse, read file
- commits (avec limite et branche), pull requests (avec état)
- recherche de fichiers, aide

### Évolutions v2.0

- [x] Lire le contenu d'un fichier
- [x] Lister les Pull Requests
- [x] Lister les commits
- [x] Rechercher dans le code
- [x] Extension VS Code avec TreeView
- [x] Agent GitHub Copilot (chat naturel)

---

## 10. Références

- [Bitbucket Server REST API](https://developer.atlassian.com/server/bitbucket/rest/v811/)
- [axios - npm](https://www.npmjs.com/package/axios)
- [dotenv - npm](https://www.npmjs.com/package/dotenv)
