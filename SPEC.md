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

## 9. Évolutions prévues (v2.0)

- [ ] Lire le contenu d'un fichier
- [ ] Lister les Pull Requests
- [ ] Lister les commits
- [ ] Rechercher dans le code
- [ ] Créer des branches
- [ ] Explorer plusieurs repos du projet IM
- [ ] Interface CLI interactive

---

## 10. Références

- [Bitbucket Server REST API](https://developer.atlassian.com/server/bitbucket/rest/v811/)
- [axios - npm](https://www.npmjs.com/package/axios)
- [dotenv - npm](https://www.npmjs.com/package/dotenv)
