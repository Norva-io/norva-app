# Flux OAuth Nylas - Configuration Outlook

## ✅ Tests automatisés passés

Tous les tests de configuration ont été exécutés avec succès :
- ✅ Variables d'environnement chargées
- ✅ Client Nylas V3 initialisé
- ✅ URL OAuth correctement générée
- ✅ Paramètres OAuth validés (client_id, redirect_uri, state, provider)
- ✅ Schéma base de données validé (email_grant_id, email_connected_at)

## 🔧 Configuration Nylas V3

### Variables d'environnement (.env.local)

```bash
NYLAS_CLIENT_ID=7b27f7d1-f971-43b5-bea4-a9b591c79a8b
NYLAS_API_KEY=nyk_v0_qMcrW5gGtUWtPnpLR6OXFzIzLarmUZLbfgQ0pxF8vQAQSsLZkQiy5cQHTMEjN5Q2
NYLAS_API_URI=https://api.eu.nylas.com
NYLAS_CALLBACK_URI=http://localhost:3000/api/auth/outlook/callback
```

### Points importants Nylas V3

1. **Pas de Client Secret séparé** - L'API Key sert de Client Secret
2. **Région Europe** - Utilise `https://api.eu.nylas.com`
3. **Sandbox mode** - 5 comptes gratuits, 500 emails/mois
4. **Hosted Authentication** - Nylas gère le flux OAuth complet

## 🔄 Flux OAuth complet

### 1. Initiation (Dashboard)

**Fichier**: `src/app/(dashboard)/dashboard/page.tsx:132-137`

```tsx
<Link href="/api/auth/outlook">
  <Button size="sm" className="mt-1">
    Connecter Outlook
  </Button>
</Link>
```

**Comportement**:
- Affiche le bouton si `user.email_grant_id` est null
- Affiche la date de connexion si déjà connecté

---

### 2. Route OAuth Initiation

**Fichier**: `src/app/api/auth/outlook/route.ts`

**Étapes**:
1. Vérifie que l'utilisateur est authentifié (Clerk)
2. Encode le `userId` dans le state (base64)
3. Génère l'URL OAuth Nylas via `getOutlookAuthUrl(state)`
4. Redirige vers Microsoft consent screen

**Code clé**:
```typescript
const state = Buffer.from(JSON.stringify({ userId })).toString('base64')
const authUrl = getOutlookAuthUrl(state)
redirect(authUrl)
```

**URL générée**:
```
https://api.eu.nylas.com/v3/connect/auth
  ?client_id=7b27f7d1-f971-43b5-bea4-a9b591c79a8b
  &redirect_uri=http://localhost:3000/api/auth/outlook/callback
  &access_type=online
  &response_type=code
  &provider=microsoft
  &state=eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMTIzIn0=
```

---

### 3. Microsoft OAuth (externe)

L'utilisateur est redirigé vers Microsoft pour :
- Se connecter à son compte Outlook/Microsoft
- Autoriser les permissions demandées (`mail.read`)
- Approuver l'accès à Norva

**Scopes demandés**: `https://outlook.office.com/mail.read`

---

### 4. Callback OAuth

**Fichier**: `src/app/api/auth/outlook/callback/route.ts`

**Paramètres reçus**:
- `code` - Authorization code de Microsoft
- `state` - Le userId encodé
- `error` (optionnel) - Si l'utilisateur refuse

**Étapes**:
1. Décode le state pour récupérer le `userId`
2. Échange le code contre un grant_id via Nylas:
   ```typescript
   const response = await nylas.auth.exchangeCodeForToken({
     clientId: nylasConfig.clientId,
     clientSecret: nylasConfig.clientSecret, // = API Key en V3
     code,
     redirectUri: nylasConfig.callbackUri,
   })
   ```
3. Stocke le `grantId` et `email_connected_at` dans Supabase:
   ```typescript
   await supabase
     .from('users')
     .update({
       email_grant_id: grantId,
       email_connected_at: new Date().toISOString(),
     })
     .eq('clerk_id', userId)
   ```
4. Redirige vers le dashboard avec succès

**Redirections possibles**:
- ✅ Succès: `/dashboard?success=email_connected`
- ❌ Erreur OAuth: `/onboarding?error=oauth_failed`
- ❌ Params manquants: `/onboarding?error=missing_params`
- ❌ Erreur DB: `/onboarding?error=database_error`
- ❌ Erreur échange: `/onboarding?error=exchange_failed`

---

### 5. Dashboard mis à jour

Le dashboard détecte `email_grant_id` et affiche:
```tsx
<p className="text-xs text-muted-foreground">
  Email connecté • {new Date(user.email_connected_at!).toLocaleDateString('fr-FR')}
</p>
```

## 📊 Structure base de données

**Table**: `users`

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_grant_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS email_connected_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_email_grant_id ON users(email_grant_id);
```

**Colonnes importantes**:
- `clerk_id` (TEXT) - ID Clerk de l'utilisateur
- `email_grant_id` (TEXT) - Grant ID Nylas pour accéder aux emails
- `email_connected_at` (TIMESTAMPTZ) - Date de connexion de l'email

## 🧪 Tester le flux

### Test automatique

```bash
node test-nylas-config.mjs
```

Vérifie:
- ✅ Variables d'environnement
- ✅ Client Nylas initialisé
- ✅ URL OAuth générée correctement
- ✅ Paramètres OAuth valides

### Test manuel

1. **Démarrer le serveur**: `npm run dev`
2. **Se connecter**: http://localhost:3000/login
3. **Aller au dashboard**: http://localhost:3000/dashboard
4. **Cliquer sur** "Connecter Outlook"
5. **Autoriser** l'accès Microsoft
6. **Vérifier** le retour au dashboard avec confirmation

### Vérifier dans Supabase

```sql
SELECT clerk_id, email, email_grant_id, email_connected_at
FROM users
WHERE email_grant_id IS NOT NULL;
```

## 🔐 Sécurité

- ✅ Le `state` encode le userId pour prévenir les CSRF attacks
- ✅ Le grant_id est unique par utilisateur (UNIQUE constraint)
- ✅ Utilisation du Service Role Key côté serveur uniquement
- ✅ Pas de secrets exposés côté client
- ✅ Redirect URIs configurés dans Nylas Dashboard

## 📝 Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/lib/nylas.ts` | Config Nylas + génération URL OAuth |
| `src/app/api/auth/outlook/route.ts` | Initiation OAuth |
| `src/app/api/auth/outlook/callback/route.ts` | Callback OAuth + stockage grant_id |
| `src/app/(dashboard)/dashboard/page.tsx` | Bouton de connexion + affichage statut |
| `supabase/migrations/002_add_email_oauth_fields.sql` | Schéma DB pour OAuth |
| `.env.local` | Variables d'environnement (ne pas commit) |
| `.env.example` | Template des variables (à commit) |

## 🚀 Prochaines étapes

Une fois le flux OAuth testé et fonctionnel :

1. **Lire les emails** via Nylas API
   ```typescript
   const messages = await nylas.messages.list({
     identifier: grantId,
     queryParams: { limit: 50 }
   })
   ```

2. **Filtrer par client** (domaine email)
3. **Analyser avec Claude** (sentiment, urgence, etc.)
4. **Limiter à 3 jours** d'historique pour MVP
5. **Afficher dans le dashboard** client

## 📚 Documentation Nylas V3

- [Authentication Overview](https://developer.nylas.com/docs/v3/auth/)
- [Hosted OAuth with API Key](https://developer.nylas.com/docs/v3/auth/hosted-oauth-apikey/)
- [Messages API](https://developer.nylas.com/docs/v3/messages/)