# Flux OAuth Nylas - Gmail & Outlook

## 🎯 Vue d'ensemble

L'application Norva utilise Nylas V3 pour la synchronisation des emails via OAuth 2.0.

## 🔐 Providers supportés

### Gmail (Primaire) ✅
- **Status**: Actif
- **Scopes**: `gmail.readonly` (lecture seule)
- **Callback Dev**: `http://localhost:3000/api/auth/gmail/callback`
- **Callback Prod**: `https://norva.io/api/auth/gmail/callback`

### Outlook (Secondaire) 🔜
- **Status**: Disponible prochainement
- **Note**: Nécessite approbation admin pour comptes professionnels
- **Callback Dev**: `http://localhost:3000/api/auth/outlook/callback`

## 🔧 Configuration Nylas V3

### Variables d'environnement (.env.local)

```bash
NYLAS_CLIENT_ID=7b27f7d1-f971-43b5-bea4-a9b591c79a8b
NYLAS_API_KEY=nyk_v0_***
NYLAS_API_URI=https://api.eu.nylas.com
NYLAS_GMAIL_CALLBACK_URI=http://localhost:3000/api/auth/gmail/callback
NYLAS_OUTLOOK_CALLBACK_URI=http://localhost:3000/api/auth/outlook/callback
```

### Points importants Nylas V3

1. **Pas de Client Secret séparé** - L'API Key sert de Client Secret
2. **Région Europe** - Utilise `https://api.eu.nylas.com`
3. **Sandbox mode** - 5 comptes gratuits, 500 emails/mois
4. **Hosted Authentication** - Nylas gère le flux OAuth complet

## 🔄 Flux OAuth complet

### 1. Initiation (Settings ou Onboarding)

**Fichiers**:
- `src/components/settings/email-provider-card.tsx` - Settings page
- `src/components/onboarding/onboarding-content.tsx` - Onboarding page

```tsx
<Button onClick={() => window.location.href = '/api/auth/gmail'}>
  Connecter Gmail
</Button>
```

**Comportement**:
- Affiche le bouton "Connecter" si `email_grant_id` est null
- Affiche badge "Connecté" + date si déjà connecté
- Skip button pour passer l'onboarding

---

### 2. Route OAuth Initiation (Gmail)

**Fichier**: `src/app/api/auth/gmail/route.ts`

**Étapes**:
1. Vérifie que l'utilisateur est authentifié (Clerk)
2. Récupère le user depuis Supabase
3. Encode le `userId` dans le state (base64)
4. Génère l'URL OAuth Nylas via `getGmailAuthUrl(state)`
5. Redirige vers Google consent screen

**Code clé**:
```typescript
const state = Buffer.from(JSON.stringify({ userId })).toString('base64')
const authUrl = getGmailAuthUrl(state)
redirect(authUrl)
```

**URL générée**:
```
https://api.eu.nylas.com/v3/connect/auth
  ?client_id=7b27f7d1-f971-43b5-bea4-a9b591c79a8b
  &redirect_uri=http://localhost:3000/api/auth/gmail/callback
  &access_type=offline
  &response_type=code
  &provider=google
  &state=eyJ1c2VySWQiOiJ1c2VyXzEyMyJ9
```

---

### 3. Google OAuth (externe)

L'utilisateur est redirigé vers Google pour :
- Se connecter à son compte Gmail
- Autoriser les permissions demandées (lecture seule)
- Approuver l'accès à Norva

**Scopes demandés**: `https://www.googleapis.com/auth/gmail.readonly`

---

### 4. Callback OAuth (Gmail)

**Fichier**: `src/app/api/auth/gmail/callback/route.ts`

**Paramètres reçus**:
- `code` - Authorization code de Google
- `state` - Le userId encodé
- `error` (optionnel) - Si l'utilisateur refuse

**Étapes**:
1. Décode le state pour récupérer le `userId`
2. Échange le code contre un grant_id via Nylas API:
   ```typescript
   const response = await fetch('https://api.eu.nylas.com/v3/connect/token', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${NYLAS_API_KEY}`
     },
     body: JSON.stringify({
       client_id: nylasConfig.clientId,
       redirect_uri: nylasConfig.gmailCallbackUri,
       code,
       grant_type: 'authorization_code'
     })
   })
   ```
3. Stocke le `grant_id`, `email_provider` et `email_connected_at` dans Supabase:
   ```typescript
   await supabase
     .from('users')
     .update({
       email_grant_id: grantId,
       email_provider: 'gmail',
       email_connected_at: new Date().toISOString(),
     })
     .eq('clerk_id', userId)
   ```
4. Redirige vers settings avec succès

**Redirections possibles**:
- ✅ Succès: `/settings?success=email_connected`
- ❌ Erreur OAuth: `/settings?error=oauth_failed`
- ❌ Params manquants: `/settings?error=missing_params`
- ❌ Erreur DB: `/settings?error=database_error`
- ❌ Erreur échange: `/settings?error=exchange_failed`

---

### 5. Settings Page Updated

La page settings détecte `email_grant_id` et affiche:
```tsx
<EmailProviderCard
  provider="gmail"
  isConnected={!!user.email_grant_id && user.email_provider === 'gmail'}
  connectedAt={user.email_connected_at}
/>
```

Badge "Connecté" avec date de connexion.

## 📊 Structure base de données

**Table**: `users`

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_grant_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS email_provider TEXT,
ADD COLUMN IF NOT EXISTS email_connected_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_email_grant_id ON users(email_grant_id);
```

**Colonnes importantes**:
- `clerk_id` (TEXT) - ID Clerk de l'utilisateur
- `email_grant_id` (TEXT UNIQUE) - Grant ID Nylas pour accéder aux emails
- `email_provider` (TEXT) - Provider: 'gmail' ou 'outlook'
- `email_connected_at` (TIMESTAMPTZ) - Date de connexion de l'email

**Table**: `emails`

```sql
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  client_id UUID NULL REFERENCES clients(id), -- Nullable for unassigned emails
  nylas_message_id TEXT UNIQUE NOT NULL,
  thread_id TEXT,
  from_email TEXT NOT NULL,
  subject TEXT,
  snippet TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Note**: `client_id` est nullable pour permettre le stockage d'emails non assignés (à réviser manuellement)

## 📧 Utilisation du grant_id

### Synchronisation des emails

**File**: `src/app/api/emails/sync/route.ts`

```typescript
1. Récupère email_grant_id depuis Supabase
2. Utilise grant_id pour authentifier les requêtes Nylas
3. Fetch emails des 3 derniers jours (max 100)
4. Parse et associe aux clients par domaine (From/To/CC/BCC + body)
5. Stocke dans table `emails` (client_id peut être null)
```

**Requête Nylas Messages API**:
```bash
GET https://api.eu.nylas.com/v3/grants/{grant_id}/messages
Authorization: Bearer <NYLAS_API_KEY>
```

### Email Parsing et Matching

**File**: `src/lib/email-parser.ts`

**Fonctions**:
- `extractEmailsFromText()` - Extrait emails d'un texte via regex
- `parseForwardedEmail()` - Détecte forwards et extrait expéditeur original
- `findMatchingClients()` - Match emails avec clients par domaine

**Stratégie de matching**:
1. Extraire tous les emails de From/To/CC/BCC
2. Si aucun match, parser le body pour forwards
3. Chercher patterns: "Forwarded message", "From:", "De:", etc.
4. Matcher domaines extraits avec domaines clients
5. Créer email avec client_id ou null

## 🧪 Tester le flux

### Test manuel

1. **Démarrer le serveur**: `npm run dev`
2. **Se connecter**: http://localhost:3000/login
3. **Aller aux settings**: http://localhost:3000/settings
4. **Cliquer sur** "Connecter" sous Gmail
5. **Autoriser** l'accès Google (lecture seule)
6. **Vérifier** le badge "Connecté" avec date
7. **Créer un client** avec domaine (ex: acme.com)
8. **Cliquer** "Synchroniser" dans settings
9. **Vérifier** les emails synchronisés

### Vérifier dans Supabase

```sql
-- Vérifier la connexion email
SELECT clerk_id, email, email_grant_id, email_provider, email_connected_at
FROM users
WHERE email_grant_id IS NOT NULL;

-- Vérifier les emails synchronisés
SELECT e.subject, e.from_email, c.name as client_name, e.received_at
FROM emails e
LEFT JOIN clients c ON e.client_id = c.id
ORDER BY e.received_at DESC
LIMIT 20;
```

## 🔐 Sécurité

- ✅ Scope `readonly` uniquement (pas de modification/envoi)
- ✅ Le `state` encode le userId pour prévenir les CSRF attacks
- ✅ Le grant_id est unique par utilisateur (UNIQUE constraint)
- ✅ Utilisation du Service Role Key Supabase côté serveur uniquement
- ✅ Pas de secrets exposés côté client
- ✅ Redirect URIs configurés dans Nylas Dashboard
- ✅ Révocation possible à tout moment (Google Permissions)

### Révocation d'accès
- **Gmail**: https://myaccount.google.com/permissions
- **Nylas Dashboard**: Révocation possible du grant

## 📝 Fichiers clés

### Configuration
| Fichier | Rôle |
|---------|------|
| `src/lib/nylas.ts` | Config Nylas + génération URL OAuth Gmail/Outlook |
| `.env.local` | Variables d'environnement (ne pas commit) |
| `.env.example` | Template des variables (commit safe) |

### OAuth Routes
| Fichier | Rôle |
|---------|------|
| `src/app/api/auth/gmail/route.ts` | Initiation OAuth Gmail |
| `src/app/api/auth/gmail/callback/route.ts` | Callback Gmail + stockage grant_id |
| `src/app/api/auth/outlook/route.ts` | Initiation OAuth Outlook |
| `src/app/api/auth/outlook/callback/route.ts` | Callback Outlook + stockage grant_id |

### Synchronisation
| Fichier | Rôle |
|---------|------|
| `src/app/api/emails/sync/route.ts` | Endpoint de synchronisation manuelle |
| `src/lib/email-parser.ts` | Parsing emails + forwards + matching |

### UI Components
| Fichier | Rôle |
|---------|------|
| `src/components/settings/email-provider-card.tsx` | Card provider Gmail/Outlook |
| `src/components/settings/sync-emails-section.tsx` | Bouton sync + quotas |
| `src/components/onboarding/onboarding-content.tsx` | Page onboarding |

### Migrations
| Fichier | Rôle |
|---------|------|
| `supabase/migrations/002_add_email_oauth_fields.sql` | Schéma OAuth |
| `supabase/migrations/003_add_email_provider.sql` | Colonne email_provider |
| `supabase/migrations/004_make_client_id_nullable_in_emails.sql` | Client_id nullable |

## 📊 Limites et quotas

### Nylas Free Tier
- **Comptes**: 5 maximum
- **Emails**: 500/mois
- **Historique app**: 3 jours (limitation volontaire)
- **Sync**: 100 emails max par requête

### Optimisations
- Déduplication automatique (emails déjà synchronisés ignorés)
- Limitation à 3 jours d'historique
- Batch de 100 emails maximum par sync

## 🚀 Prochaines étapes

1. ✅ Gmail OAuth fonctionnel
2. ✅ Synchronisation manuelle
3. ✅ Affichage des quotas
4. ✅ Forward email parsing
5. 🔜 Synchronisation automatique (webhook)
6. 🔜 Support Outlook (après validation admin)
7. 🔜 Analyse sentiment avec Claude AI
8. 🔜 Calcul score de santé client

## 📚 Références

- [Nylas V3 Documentation](https://developer.nylas.com/docs/v3/)
- [OAuth 2.0 Flow](https://developer.nylas.com/docs/v3/auth/)
- [Messages API](https://developer.nylas.com/docs/v3/messages/)
- [GMAIL_SETUP.md](./GMAIL_SETUP.md) - Guide setup Gmail complet
- [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md) - Workflow client-email