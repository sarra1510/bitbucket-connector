# 🔗 Bitbucket Connector

Connecteur Node.js pour Bitbucket Server (Data Center).

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

## 🚀 Utilisation

```bash
# Mode normal (connexion + exploration)
node connect_bitbucket.js

# Lire un fichier spécifique
node connect_bitbucket.js read chemin/vers/fichier.js

# Lire un fichier sur une branche spécifique
node connect_bitbucket.js read chemin/vers/fichier.js develop
```

## 📋 Documentation

Voir [SPEC.md](SPEC.md) pour la spécification technique complète.
