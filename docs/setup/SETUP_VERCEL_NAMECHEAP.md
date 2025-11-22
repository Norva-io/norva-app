# 🚀 Déployer Norva sur Vercel avec le domaine norva.io (Namecheap)

Ce guide détaillé vous accompagne pour mettre en production votre application Norva sur **Vercel** avec votre domaine **norva.io** acheté sur **Namecheap**.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Un compte Vercel : https://vercel.com
- ✅ Le domaine **norva.io** acheté sur Namecheap
- ✅ Accès aux DNS settings de Namecheap
- ✅ Votre projet GitHub poussé : https://github.com/timotheeverluise/norva-app
- ✅ Variables d'environnement Clerk et Supabase (`.env.local`)

---

## 🎯 Étape 1 : Déployer sur Vercel

### 1.1 Créer le projet Vercel

1. Accédez à : https://vercel.com/new
2. Cliquez sur **Import Git Repository**
3. Sélectionnez votre repository **timotheeverluise/norva-app**
4. Configurez le projet :

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

5. **Ne cliquez pas encore sur Deploy !** → Passez à l'étape suivante pour configurer les variables d'environnement.

### 1.2 Ajouter les variables d'environnement

Dans la section **Environment Variables**, ajoutez **toutes** les variables de votre `.env.local` :

#### Variables Clerk (Auth)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

#### Variables Supabase (Database)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wqdpqxugbfixfytsnyot.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Variables API (à ajouter plus tard)

```bash
# Nylas (OAuth Outlook) - À configurer après
NYLAS_CLIENT_ID=your_nylas_client_id
NYLAS_CLIENT_SECRET=your_nylas_client_secret
NYLAS_API_KEY=your_nylas_api_key

# Anthropic Claude API - À configurer après
ANTHROPIC_API_KEY=sk-ant-api03-...
```

⚠️ **Important** : Copiez ces variables **exactement** depuis votre `.env.local` local.

### 1.3 Lancer le déploiement

1. Cliquez sur **Deploy**
2. Attendez 2-3 minutes (build + deploy)
3. ✅ Une fois terminé, vous verrez : **"Congratulations! Your project is live."**

Votre app sera disponible sur une URL temporaire Vercel : `https://norva-app-xxxxx.vercel.app`

---

## 🌐 Étape 2 : Configurer le domaine norva.io sur Namecheap

### 2.1 Récupérer les DNS records Vercel

1. Dans votre dashboard Vercel, allez dans :
   - **Settings** → **Domains**
2. Cliquez sur **Add Domain**
3. Entrez : `norva.io`
4. Cliquez sur **Add**

Vercel vous affichera **deux options** :

**Option A : Nameservers Vercel (Recommandé)**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Option B : DNS Records (A + CNAME)**
```
A Record    @       76.76.21.21
CNAME       www     cname.vercel-dns.com
```

➡️ **Nous allons utiliser l'Option A (Nameservers)** car c'est plus simple et automatique.

### 2.2 Changer les nameservers sur Namecheap

1. Connectez-vous à Namecheap : https://www.namecheap.com
2. Allez dans **Domain List** → Cliquez sur **Manage** à côté de `norva.io`
3. Section **NAMESERVERS** :
   - Changez de **Namecheap BasicDNS** à **Custom DNS**
4. Entrez les nameservers Vercel :

```
Nameserver 1: ns1.vercel-dns.com
Nameserver 2: ns2.vercel-dns.com
```

5. Cliquez sur le **✓ (checkmark)** pour sauvegarder

⏱️ **Propagation DNS** : Comptez entre **10 minutes à 48 heures** (généralement 1-2 heures).

### 2.3 Ajouter le sous-domaine www (optionnel mais recommandé)

Retour dans Vercel :

1. Cliquez sur **Add Domain** à nouveau
2. Entrez : `www.norva.io`
3. Cochez **Redirect to norva.io**
4. Cliquez sur **Add**

✅ Cela redirigera automatiquement `www.norva.io` → `norva.io`.

---

## 🔐 Étape 3 : Mettre à jour Clerk avec le domaine de production

Clerk doit connaître votre domaine de production pour gérer les redirections OAuth correctement.

### 3.1 Accéder au dashboard Clerk

1. Allez sur : https://dashboard.clerk.com
2. Sélectionnez votre projet **Norva**

### 3.2 Configurer le domaine de production

1. Dans le menu latéral : **Settings** → **Paths**
2. Section **Allowed Origins** :
   - Ajoutez : `https://norva.io`
   - Ajoutez : `https://www.norva.io`
3. Section **Home URL** :
   - Changez : `http://localhost:3000` → `https://norva.io`
4. Section **Sign in URL** :
   - Changez : `http://localhost:3000/login` → `https://norva.io/login`
5. Section **Sign up URL** :
   - Changez : `http://localhost:3000/signup` → `https://norva.io/signup`
6. Section **After sign in URL** :
   - Changez : `http://localhost:3000/dashboard` → `https://norva.io/dashboard`
7. Section **After sign up URL** :
   - Changez : `http://localhost:3000/dashboard` → `https://norva.io/dashboard`

### 3.3 Autoriser les redirections

1. Allez dans **Settings** → **Authentication** → **OAuth**
2. Section **OAuth Redirect URLs** :
   - Ajoutez : `https://norva.io/api/auth/callback`

### 3.4 Garder localhost pour le développement

⚠️ **Ne supprimez pas** `http://localhost:3000` des allowed origins ! Vous en aurez besoin pour développer localement.

✅ Clerk peut gérer **plusieurs environnements** (local + prod) en même temps.

---

## 🗄️ Étape 4 : Mettre à jour Supabase avec le domaine de production

Supabase doit également connaître votre domaine de production pour les redirections OAuth.

### 4.1 Accéder au dashboard Supabase

1. Allez sur : https://supabase.com/dashboard
2. Sélectionnez votre projet **Norva**

### 4.2 Ajouter le domaine aux redirections autorisées

1. Dans le menu latéral : **Authentication** → **URL Configuration**
2. Section **Site URL** :
   - Changez : `http://localhost:3000` → `https://norva.io`
3. Section **Redirect URLs** :
   - Ajoutez : `https://norva.io/**`
   - Ajoutez : `https://www.norva.io/**`
   - Gardez : `http://localhost:3000/**` (pour dev local)
4. Cliquez sur **Save**

---

## ✅ Étape 5 : Tester la production

### 5.1 Vérifier le domaine

Attendez que la propagation DNS soit terminée (vérifiez sur https://dnschecker.org avec `norva.io`).

Ensuite, testez :

1. **Page d'accueil** : https://norva.io
2. **Signup** : https://norva.io/signup
3. **Login** : https://norva.io/login
4. **Dashboard** : https://norva.io/dashboard (après connexion)

### 5.2 Tester Supabase en production

Créez un test endpoint pour vérifier la connexion DB en production :

```bash
curl https://norva.io/api/test-db
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Supabase connected! ✅",
  "data": {
    "usersCount": 0,
    "tables": {
      "users": true,
      "clients": true,
      "emails": true,
      "client_health_history": true,
      "client_insights": true,
      "analysis_jobs": true
    },
    "allTablesExist": true
  }
}
```

### 5.3 Tester l'authentification complète

1. Créez un nouveau compte : https://norva.io/signup
2. Vérifiez l'email (Clerk enverra un code)
3. Connectez-vous
4. Vérifiez la redirection vers `/dashboard`
5. Testez la déconnexion (bouton UserButton en haut à droite)

---

## 🔧 Étape 6 : Configuration SSL (Automatique)

Vercel gère automatiquement les certificats SSL via **Let's Encrypt**.

✅ Aucune action requise de votre part !

Vérifiez que le cadenas 🔒 est présent dans la barre d'adresse : `https://norva.io`

---

## 🚨 Troubleshooting

### Erreur : "Domain not found" après 48h

➡️ **Cause** : Problème de propagation DNS

**Solution** :
1. Vérifiez les nameservers sur Namecheap (doivent être `ns1.vercel-dns.com` et `ns2.vercel-dns.com`)
2. Vérifiez la propagation DNS : https://dnschecker.org
3. Attendez encore quelques heures
4. Si toujours bloqué, contactez le support Namecheap

### Erreur : "Invalid redirect URL" lors du login Clerk

➡️ **Cause** : Les URLs Clerk ne sont pas à jour

**Solution** :
1. Retournez dans Clerk Dashboard → Settings → Paths
2. Vérifiez que toutes les URLs contiennent `https://norva.io` (pas `http://`, pas de port)
3. Sauvegardez et attendez 1-2 minutes

### Erreur : Supabase RLS "permission denied"

➡️ **Cause** : L'utilisateur Clerk n'est pas créé dans Supabase `users` table

**Solution** :
1. Créez le webhook Clerk → Supabase (voir section suivante)
2. Ou créez manuellement l'utilisateur via SQL Editor :

```sql
INSERT INTO users (clerk_id, email, full_name, plan)
VALUES ('user_xxxxx', 'test@example.com', 'Test User', 'free');
```

### Erreur : Styles CSS ne s'appliquent pas

➡️ **Cause** : Build cache Vercel

**Solution** :
1. Dans Vercel Dashboard → Deployments
2. Cliquez sur **Redeploy**
3. Cochez **Clear build cache**
4. Confirmez

---

## 🔄 Prochaines étapes

Une fois votre domaine configuré :

### 1. Webhook Clerk → Supabase

Créez un webhook pour synchroniser automatiquement les nouveaux utilisateurs Clerk vers la table `users` Supabase.

**Endpoint à créer** : `/api/webhooks/clerk`

Voir le CDC section **"Webhook Clerk"** pour l'implémentation complète.

### 2. OAuth Outlook via Nylas

Configurez l'OAuth pour connecter les comptes Outlook des utilisateurs.

**Redirect URL à configurer dans Nylas** : `https://norva.io/api/auth/callback/nylas`

### 3. Monitoring et Analytics

Ajoutez des outils de monitoring :

- **Vercel Analytics** : Déjà inclus (gratuit)
- **Sentry** : Pour les erreurs (recommandé)
- **PostHog** : Pour les analytics produit (optionnel)

---

## 📚 Ressources utiles

- [Vercel Documentation](https://vercel.com/docs)
- [Namecheap DNS Guide](https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-change-dns-for-a-domain/)
- [Clerk Production Checklist](https://clerk.com/docs/deployments/production-checklist)
- [Supabase Auth with Custom Domains](https://supabase.com/docs/guides/auth/redirect-urls)
- [DNS Checker Tool](https://dnschecker.org)

---

## ✅ Checklist finale

Avant de considérer la mise en production terminée :

- [ ] Domaine `norva.io` pointe vers Vercel (nameservers configurés)
- [ ] SSL actif (cadenas 🔒 visible)
- [ ] Variables d'environnement ajoutées sur Vercel
- [ ] Clerk configuré avec `https://norva.io`
- [ ] Supabase configuré avec `https://norva.io/**`
- [ ] Test signup/login/dashboard fonctionne
- [ ] Endpoint `/api/test-db` retourne `success: true`
- [ ] Webhook Clerk créé (prochaine étape)

---

**Questions ?** Consultez le [CDC complet](/docs/cdc.md) ou la [documentation Supabase](/SETUP_SUPABASE.md).

🎉 **Félicitations ! Norva est maintenant en production sur norva.io !**