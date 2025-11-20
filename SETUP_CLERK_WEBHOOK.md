# Configuration du Webhook Clerk → Supabase

Ce guide explique comment configurer le webhook Clerk pour synchroniser automatiquement les utilisateurs dans Supabase.

## Étape 1: Déployer en production

Le webhook a besoin d'une URL publique. Assure-toi que le code est déployé sur Vercel (norva.io).

## Étape 2: Configurer le webhook dans Clerk Dashboard

1. Va sur [Clerk Dashboard](https://dashboard.clerk.com)
2. Sélectionne ton application
3. Dans le menu de gauche, clique sur **"Webhooks"**
4. Clique sur **"+ Add Endpoint"**
5. Configure le endpoint:
   - **Endpoint URL**: `https://norva.io/api/webhooks/clerk`
   - **Subscribe to events**: Coche ces événements:
     - `user.created`
     - `user.updated`
     - `user.deleted`
6. Clique sur **"Create"**

## Étape 3: Récupérer le Signing Secret

1. Une fois le webhook créé, Clerk va te montrer un **"Signing Secret"** (commence par `whsec_...`)
2. Copie ce secret

## Étape 4: Ajouter le secret aux variables d'environnement

### En local (`.env.local`):
```bash
CLERK_WEBHOOK_SECRET=whsec_ton_secret_ici
```

### En production (Vercel):
1. Va sur [Vercel Dashboard](https://vercel.com)
2. Sélectionne ton projet `norva-app`
3. Va dans **Settings** → **Environment Variables**
4. Ajoute une nouvelle variable:
   - **Name**: `CLERK_WEBHOOK_SECRET`
   - **Value**: `whsec_ton_secret_ici`
   - **Environment**: `Production`, `Preview`, et `Development`
5. Clique sur **Save**
6. **Redéploie** l'application pour que la variable soit prise en compte

## Étape 5: Tester le webhook

1. Va sur ta page d'inscription: https://norva.io/signup
2. Crée un nouveau compte de test
3. Vérifie dans **Supabase Dashboard** → **Table Editor** → **users**
4. Tu devrais voir le nouvel utilisateur apparaître automatiquement!

## Vérification des logs

### Clerk Dashboard:
- Va dans **Webhooks** → Clique sur ton endpoint
- Tu verras l'historique des événements envoyés
- Vérifie que le statut est `200 OK`

### Vercel Logs:
- Va dans ton projet Vercel → **Logs**
- Tu devrais voir les messages de console: `✅ User user.created: email@example.com`

## Dépannage

### Erreur 400: Missing svix headers
→ Le webhook n'est pas correctement configuré dans Clerk

### Erreur 400: Verification error
→ Le `CLERK_WEBHOOK_SECRET` est incorrect ou manquant

### Erreur 500: Database error
→ Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est bien configuré en production

## Architecture

```
Clerk (user signup/update/delete)
  ↓
  Webhook POST → https://norva.io/api/webhooks/clerk
  ↓
  Vérification signature Svix
  ↓
  Supabase: INSERT/UPDATE/DELETE dans table `users`
```

## Sécurité

✅ Le webhook vérifie la signature avec Svix (pas d'accès non autorisé)
✅ Utilise `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS) côté serveur uniquement
✅ L'API route n'est accessible que via POST avec signature valide