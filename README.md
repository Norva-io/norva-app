# Norva - Customer Success Copilot

**Baseline** : "Your Customer Success Copilot"

Une plateforme IA qui analyse automatiquement les emails clients, détecte les risques et suggère des actions prioritaires pour les Customer Success Managers.

## 🚀 Quick Start

### Prérequis
- Node.js 18+
- Compte Supabase
- Compte Clerk (authentification)
- Compte Nylas (connexion email)

### Installation

```bash
npm install
cp .env.example .env.local
# Configurer les variables d'environnement
npm run dev
```

Accéder à l'application : [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

Voir le dossier [**docs/**](docs/) pour la documentation complète :

- **Utilisation** : [WORKFLOW_GUIDE.md](docs/WORKFLOW_GUIDE.md)
- **Guides d'installation** : [docs/setup/](docs/setup/)
- **Dépannage** : [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- **Cahier des charges** : [cdc.md](docs/cdc.md)

## 🏗️ Stack Technique

- **Frontend** : Next.js 15 (App Router), React, TailwindCSS, shadcn/ui
- **Backend** : Next.js API Routes, Supabase (PostgreSQL)
- **Auth** : Clerk
- **Email** : Nylas API (Gmail/Outlook)
- **IA** : OpenAI API (GPT-4)
- **Déploiement** : Vercel

## 🗂️ Structure du projet

```
norva-app/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Composants React
│   ├── lib/             # Utilities & services
│   └── types/           # TypeScript types
├── supabase/
│   └── migrations/      # Migrations SQL
├── scripts/             # Scripts de maintenance
├── docs/                # Documentation
│   ├── setup/          # Guides d'installation
│   └── archived/       # Docs historiques
└── public/              # Assets statiques
```

## 🔑 Fonctionnalités principales

- ✅ Connexion Gmail/Outlook via OAuth
- ✅ Détection automatique de clients depuis les emails
- ✅ Analyse de sentiment par email
- ✅ Health Score client (0-100)
- ✅ Insights IA et suggestions d'actions
- ✅ Historique de santé client (graphiques)

## 🛠️ Scripts disponibles

```bash
npm run dev          # Démarrer en dev
npm run build        # Build production
npm run start        # Démarrer en prod
npm run lint         # Linter ESLint
```

## 📝 Scripts de maintenance

Voir [scripts/](scripts/) :
- `audit-database.sql` - Audit BDD
- `cleanup-database.sql` - Nettoyage BDD
- `fix-duplicates.ts` - Correction doublons

## 🔐 Variables d'environnement

Voir [.env.example](.env.example) pour la liste complète des variables requises.

Principales :
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NYLAS_CLIENT_ID`
- `NYLAS_API_KEY`
- `OPENAI_API_KEY`

## 📊 Base de données

Schéma Supabase avec :
- `users` - Utilisateurs (sync Clerk)
- `clients` - Clients détectés
- `emails` - Métadonnées emails
- `client_insights` - Insights IA
- `client_health_history` - Historique santé

Voir [docs/DATABASE-STATUS.md](docs/DATABASE-STATUS.md) pour l'état actuel.

## 🤝 Contribution

Ce projet est en développement actif. Voir [docs/cdc.md](docs/cdc.md) pour la vision produit complète.

## 📄 License

Propriétaire - Tous droits réservés
