# Configuration Nylas pour OAuth Outlook

Ce guide explique comment configurer Nylas pour connecter les boîtes mail Outlook/Office 365 de tes utilisateurs.

## Étape 1: Créer un compte Nylas

1. Va sur [Nylas Dashboard](https://dashboard.nylas.com/register)
2. Crée un compte gratuit (plan Developer - gratuit jusqu'à 10 comptes connectés)
3. Vérifie ton email et connecte-toi

## Étape 2: Créer une Application Nylas

1. Dans le [Dashboard Nylas](https://dashboard.nylas.com), clique sur **"Create Application"**
2. Donne un nom: **"Norva CS Copilot"**
3. Sélectionne **"V3 API"** (la dernière version)
4. Clique sur **"Create Application"**

## Étape 3: Récupérer les credentials

Dans le dashboard de ton app:

1. **API Key**:
   - Va dans **"App Settings"** → **"API Keys"**
   - Copie la **"API Key"** (commence par `nyk_...`)

2. **Client ID & Secret**:
   - Va dans **"App Settings"** → **"OAuth"**
   - Copie le **"Client ID"**
   - Copie le **"Client Secret"**

3. **Callback URL**:
   - Dans **"OAuth"** → **"Authorized redirect URIs"**
   - Ajoute: `http://localhost:3000/api/auth/outlook/callback` (pour dev)
   - Ajoute: `https://norva.io/api/auth/outlook/callback` (pour prod)
   - Clique sur **"Save"**

## Étape 4: Configurer le provider Microsoft (Outlook)

1. Dans Nylas Dashboard, va dans **"App Settings"** → **"Providers"**
2. Clique sur **"+ Add Provider"**
3. Sélectionne **"Microsoft"**
4. Configuration:
   - **Provider Type**: Microsoft (OAuth 2.0)
   - **Scopes**: Laisse les scopes par défaut (Mail.Read, Mail.Send, etc.)
5. **Important**: Nylas va te guider pour créer une App Registration dans Azure AD

## Étape 5: Créer une App Registration dans Azure AD (Microsoft)

Nylas va te demander de créer une app Microsoft. Voici comment:

1. Va sur [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations**
2. Clique sur **"+ New registration"**
3. Configure:
   - **Name**: "Norva CS Copilot"
   - **Supported account types**: "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**:
     - Type: **Web**
     - URI: Copie l'URL fournie par Nylas (commence par `https://api.us.nylas.com/v3/connect/...`)
4. Clique sur **"Register"**

### 5.1: Copier les credentials Azure

1. Dans ton app Azure, va dans **"Overview"**
   - Copie **"Application (client) ID"**
   - Copie **"Directory (tenant) ID"**

2. Va dans **"Certificates & secrets"** → **"+ New client secret"**
   - Description: "Nylas Integration"
   - Expiration: 24 mois
   - Clique **"Add"**
   - **⚠️ IMPORTANT**: Copie immédiatement la **Value** du secret (tu ne pourras plus la voir après)

### 5.2: Configurer les permissions API

1. Dans ton app Azure, va dans **"API permissions"**
2. Clique sur **"+ Add a permission"** → **"Microsoft Graph"** → **"Delegated permissions"**
3. Ajoute ces permissions:
   - `Mail.Read`
   - `Mail.ReadWrite`
   - `Mail.Send`
   - `User.Read`
   - `offline_access`
4. Clique **"Add permissions"**
5. ⚠️ Clique sur **"Grant admin consent for [your org]"** (si tu es admin)

### 5.3: Retourner dans Nylas et finaliser

1. Retourne dans Nylas Dashboard → **"Providers"** → **"Microsoft"**
2. Entre les credentials Azure:
   - **Client ID**: L'Application ID d'Azure
   - **Client Secret**: Le secret que tu as copié
   - **Tenant ID**: Le Directory ID d'Azure
3. Clique **"Save"**

## Étape 6: Ajouter les variables d'environnement

### En local (`.env.local`):
```bash
# ── NYLAS ──
NYLAS_API_KEY=nyk_v0_ton_api_key
NYLAS_CLIENT_ID=ton_client_id
NYLAS_CLIENT_SECRET=ton_client_secret
NYLAS_API_URI=https://api.us.nylas.com
NYLAS_CALLBACK_URI=http://localhost:3000/api/auth/outlook/callback
```

### En production (Vercel):
Ajoute les mêmes variables, mais change:
```bash
NYLAS_CALLBACK_URI=https://norva.io/api/auth/outlook/callback
```

## Étape 7: Tester le flow OAuth

1. Lance le serveur local: `npm run dev`
2. Va sur http://localhost:3000/onboarding
3. Clique sur **"Connecter Outlook / Office 365"**
4. Tu seras redirigé vers Microsoft pour autoriser l'accès
5. Après autorisation, tu seras redirigé vers `/dashboard`
6. Vérifie dans Supabase que l'email token est bien enregistré!

## Architecture du Flow OAuth

```
User clique "Connecter Outlook"
  ↓
GET /api/auth/outlook
  ↓
Redirect → Nylas OAuth → Microsoft Consent Screen
  ↓
User autorise l'accès
  ↓
Redirect → GET /api/auth/outlook/callback?code=...
  ↓
Exchange code pour access_token via Nylas API
  ↓
Store token + grant_id dans Supabase (table users)
  ↓
Redirect → /dashboard (compte connecté ✅)
```

## Dépannage

### Erreur: "redirect_uri_mismatch"
→ Vérifie que le callback URI dans Nylas ET Azure correspond exactement à ton URL

### Erreur: "invalid_client"
→ Vérifie que Client ID et Client Secret sont corrects dans Nylas

### Erreur: "consent_required"
→ Dans Azure, assure-toi d'avoir accordé le "admin consent" pour les permissions

### Le token n'est pas sauvegardé
→ Vérifie les logs Vercel/console pour voir les erreurs Supabase

## Sécurité

✅ Les tokens OAuth sont stockés chiffrés dans Supabase
✅ Nylas gère le refresh automatique des tokens
✅ Seul le `grant_id` Nylas est stocké, pas le token brut
✅ Les permissions sont limitées au strict nécessaire (Mail.Read)

## Limites du plan gratuit Nylas

- **10 comptes email connectés** maximum
- **5,000 API calls/mois**
- Parfait pour le Micro-MVP et les premiers tests!

Une fois validé, tu pourras upgrader vers un plan payant.