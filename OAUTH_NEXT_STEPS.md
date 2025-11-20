# OAuth Outlook - Prochaines étapes

## ✅ Ce qui a été fait

### 1. Code implémenté
- ✅ Page d'onboarding `/onboarding` avec UI
- ✅ Configuration Nylas dans `/lib/nylas.ts`
- ✅ Route OAuth initiation `/api/auth/outlook`
- ✅ Route OAuth callback `/api/auth/outlook/callback`
- ✅ Migration SQL pour ajouter `email_grant_id` et `email_connected_at`

### 2. Packages installés
- ✅ `nylas` - SDK pour OAuth et email API
- ✅ `lucide-react` - Icônes (déjà installé)

## 🔧 Ce qu'il reste à faire

### Étape 1: Appliquer la migration Supabase

Va dans **Supabase Dashboard** → **SQL Editor** et exécute:

```sql
-- Add OAuth email fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_grant_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS email_connected_at TIMESTAMPTZ;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email_grant_id ON users(email_grant_id);

-- Add comment for documentation
COMMENT ON COLUMN users.email_grant_id IS 'Nylas grant ID for accessing user email via OAuth';
COMMENT ON COLUMN users.email_connected_at IS 'Timestamp when user connected their email account';
```

### Étape 2: Configurer Nylas

Suis le guide complet dans **`SETUP_NYLAS_OUTLOOK.md`**:

1. Créer un compte Nylas (gratuit)
2. Créer une application Nylas
3. Récupérer API Key, Client ID, Client Secret
4. Configurer le provider Microsoft
5. Créer une App Registration dans Azure AD
6. Ajouter les variables d'environnement:

```bash
# Ajoute dans .env.local:
NYLAS_API_KEY=nyk_v0_...
NYLAS_CLIENT_ID=...
NYLAS_CLIENT_SECRET=...
NYLAS_API_URI=https://api.us.nylas.com
NYLAS_CALLBACK_URI=http://localhost:3000/api/auth/outlook/callback
```

### Étape 3: Tester en local

1. Redémarre le serveur: `npm run dev`
2. Va sur http://localhost:3000/onboarding
3. Clique sur "Connecter Outlook"
4. Autorise l'accès
5. Vérifie que tu es redirigé vers `/dashboard?success=email_connected`
6. Dans Supabase, vérifie que `email_grant_id` est bien rempli

### Étape 4: Vérifier les erreurs potentielles

Si ça ne marche pas, ouvre la console du navigateur et les logs du serveur pour voir:
- Erreurs Nylas API
- Erreurs Supabase
- Problèmes de redirect_uri

## 📋 Checklist avant de passer à l'étape suivante

- [ ] Migration SQL exécutée dans Supabase
- [ ] Compte Nylas créé
- [ ] App Registration Azure créée
- [ ] Variables d'environnement ajoutées
- [ ] Test OAuth réussi en local
- [ ] `email_grant_id` visible dans Supabase après connexion

Une fois que tout fonctionne en local, on pourra:
1. Passer à la détection manuelle des clients
2. Puis à l'analyse IA des emails
3. Et enfin déployer tout en production!

## ⏱️ Estimation

- Configuration Nylas + Azure: **15-20 minutes**
- Tests: **5 minutes**
- Total: **~25 minutes**

C'est la partie la plus longue car elle nécessite de configurer Azure AD, mais une fois fait, c'est réutilisable!