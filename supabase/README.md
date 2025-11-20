# Supabase Database Setup

## 🗄️ Schema Overview

Le schema Norva MVP comprend 6 tables principales :

1. **users** - Comptes utilisateurs (sync avec Clerk)
2. **clients** - Clients détectés depuis les emails
3. **emails** - Métadonnées emails (pas de body complet)
4. **client_health_history** - Historique scores pour graphiques
5. **client_insights** - Insights IA générés
6. **analysis_jobs** - Tracking des jobs d'analyse

## 🚀 Installation

### Option 1 : Via Supabase Dashboard (Recommandé pour MVP)

1. Accédez à votre projet Supabase : https://supabase.com/dashboard
2. Allez dans **SQL Editor**
3. Cliquez sur **New Query**
4. Copiez-collez le contenu de `migrations/001_initial_schema.sql`
5. Cliquez sur **Run** (▶️)

✅ Si tout est vert, le schema est créé !

### Option 2 : Via Supabase CLI (Pour plus tard)

```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Lien avec votre projet
supabase link --project-ref wqdpqxugbfixfytsnyot

# Appliquer les migrations
supabase db push
```

## 🔐 Row Level Security (RLS)

Le schema inclut des **policies RLS** pour sécuriser les données :

- ✅ Chaque user ne voit **que ses propres clients**
- ✅ Isolation complète entre utilisateurs
- ✅ Protection automatique via Clerk `auth.uid()`

## 🧪 Test du Schema

Une fois le schema créé, testez la connexion :

```typescript
// Dans votre app Next.js
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Test simple
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(1)

console.log('Supabase OK:', data)
```

## 📊 Diagramme ER (Entity-Relationship)

```
users (1) ──── (N) clients
                 │
                 ├── (N) emails
                 ├── (N) client_health_history
                 ├── (N) client_insights
                 └── (N) analysis_jobs
```

## 🔧 Modifications futures

Pour ajouter une colonne ou modifier le schema :

1. Créez un nouveau fichier `migrations/002_nouvelle_feature.sql`
2. Écrivez votre SQL
3. Appliquez via Dashboard ou CLI

**Exemple** : Ajouter un champ `phone` à la table `clients`

```sql
-- migrations/002_add_phone_to_clients.sql
ALTER TABLE clients ADD COLUMN phone TEXT;
```

## ⚠️ Important : Backup

Avant toute modification en production :

```bash
# Backup via Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql
```

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/functions.html)