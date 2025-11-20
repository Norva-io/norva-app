# 🗄️ Setup Supabase pour Norva

## ✅ Prérequis

- Compte Supabase créé : https://supabase.com
- Projet Supabase déjà créé (URL dans `.env.local`)

## 📋 Étapes d'installation

### 1. Appliquer le schema SQL

**Méthode recommandée** : Via Supabase Dashboard

1. Accédez à votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet **Norva**
3. Dans le menu latéral, cliquez sur **SQL Editor**
4. Cliquez sur **+ New Query**
5. Ouvrez le fichier `/supabase/migrations/001_initial_schema.sql`
6. Copiez TOUT le contenu
7. Collez dans l'éditeur SQL
8. Cliquez sur **Run** (bouton ▶️ en bas à droite)

✅ **Résultat attendu** : Message de succès "Success. No rows returned"

### 2. Vérifier les tables créées

1. Dans le menu latéral, cliquez sur **Table Editor**
2. Vous devriez voir 6 tables :
   - ✅ `users`
   - ✅ `clients`
   - ✅ `emails`
   - ✅ `client_health_history`
   - ✅ `client_insights`
   - ✅ `analysis_jobs`

### 3. Vérifier Row Level Security (RLS)

1. Cliquez sur une table (ex: `clients`)
2. Onglet **Policies**
3. Vous devriez voir plusieurs policies actives :
   - "Users can view own clients"
   - "Users can insert own clients"
   - etc.

✅ **Important** : RLS doit être **ENABLED** sur toutes les tables

### 4. Tester la connexion depuis l'app

Créez un fichier de test :

```typescript
// src/app/api/test-db/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Test simple : count users
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Supabase connected!',
    usersCount: count,
  })
}
```

Testez : http://localhost:3000/api/test-db

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Supabase connected!",
  "usersCount": 0
}
```

## 🔧 Configuration TypeScript

Les types sont déjà générés dans `/src/types/database.ts`.

Utilisation :

```typescript
import { Client, ClientInsert } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Insert avec typage
const newClient: ClientInsert = {
  user_id: 'uuid-here',
  name: 'ACME Corp',
  domain: 'acme.com',
}

const { data, error } = await supabase
  .from('clients')
  .insert(newClient)
  .select()
  .single()

// data est typé comme Client ✅
```

## 🐛 Troubleshooting

### Erreur : "permission denied for table users"

➡️ **Cause** : RLS est activé mais les policies ne sont pas créées

**Solution** :
1. Vérifiez que toutes les policies sont présentes dans SQL Editor
2. Re-exécutez le script complet si besoin

### Erreur : "relation 'users' does not exist"

➡️ **Cause** : Le schema n'a pas été appliqué

**Solution** : Réappliquez `001_initial_schema.sql`

### Erreur : "JWT expired"

➡️ **Cause** : Les clés Supabase dans `.env.local` sont invalides

**Solution** :
1. Allez dans **Settings** > **API**
2. Copiez les nouvelles clés :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (pour admin)

## 📚 Ressources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase with Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## 🎯 Prochaines étapes

Une fois le schema OK :

1. ✅ Créer la table `users` via Clerk webhook
2. ✅ Implémenter l'OAuth Outlook
3. ✅ Créer le flow d'onboarding
4. ✅ Développer l'analyse IA

---

**Questions ?** Consultez le [CDC complet](/docs/cdc.md)