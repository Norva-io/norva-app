# Plan de Test - Norva MVP

Ce document liste tous les tests à effectuer pour vérifier que l'application fonctionne correctement.

## ✅ Checklist Générale

### 1. Design System & Logo
- [ ] **Local**: Va sur http://localhost:3000
- [ ] Le logo Norva (étoile du nord) apparaît dans la navbar
- [ ] Les couleurs sont bien Warm Earth (charcoal #2C2C2E + terracotta #D97757)
- [ ] **Production**: Va sur https://norva.io
- [ ] Le logo apparaît aussi en prod
- [ ] Le favicon (logo dans l'onglet) est visible

**Attendu**: Logo visible partout, couleurs chaleureuses, design cohérent

---

### 2. Authentification Clerk

#### Test A: Signup (Création de compte)
- [ ] Va sur http://localhost:3000/signup
- [ ] Le logo et le design sont corrects
- [ ] Crée un nouveau compte test avec un email: `test-norva-[timestamp]@yopmail.com`
- [ ] Remplis le formulaire Clerk
- [ ] Soumets le formulaire

**Attendu**:
- Redirection vers `/dashboard`
- Aucune erreur dans la console

#### Test B: Webhook Clerk → Supabase
Vérifie que l'utilisateur a bien été synchronisé dans Supabase:

- [ ] Va sur [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Sélectionne ton projet `norva-app`
- [ ] Va dans **Table Editor** → Table **`users`**
- [ ] Cherche ton utilisateur test (par email)
- [ ] Vérifie que ces champs sont remplis:
  - `clerk_id` (commence par `user_...`)
  - `email` (ton email de test)
  - `first_name` et `last_name` (si tu les as remplis)
  - `created_at` (timestamp récent)
  - `updated_at` (timestamp récent)

**Attendu**: L'utilisateur apparaît dans Supabase dans les 5 secondes après signup

**En cas d'échec**:
- Va dans Clerk Dashboard → Webhooks → Clique sur ton endpoint
- Regarde les **Recent Requests** pour voir si le webhook a été envoyé
- Vérifie le status code (devrait être `200 OK`)
- Si erreur 400/500, regarde les logs Vercel

#### Test C: Login
- [ ] Déconnecte-toi (clique sur ton avatar en haut à droite → Sign out)
- [ ] Va sur http://localhost:3000/login
- [ ] Connecte-toi avec le compte test créé
- [ ] Vérifie la redirection vers `/dashboard`

**Attendu**: Login réussi, redirection correcte

---

### 3. Page Dashboard

- [ ] Tu es sur `/dashboard`
- [ ] Le header contient:
  - Logo Norva
  - Texte "Norva"
  - Bouton utilisateur (avatar) en haut à droite
- [ ] Tu vois 3 cards:
  - "Clients actifs" → 0
  - "Emails analysés" → 0
  - "Taux de satisfaction" → --

**Attendu**: Dashboard s'affiche correctement, données à zéro (normal pour MVP)

---

### 4. Page Onboarding (OAuth Outlook)

⚠️ **Important**: Cette partie ne fonctionnera PAS encore car tu n'as pas configuré Nylas. C'est normal!

- [ ] Va sur http://localhost:3000/onboarding
- [ ] Tu vois:
  - Titre "Bienvenue sur Norva! 👋"
  - Explications des bénéfices
  - Bouton "Connecter Outlook / Office 365"
  - Bouton "Connecter Gmail" (désactivé)

- [ ] Clique sur "Connecter Outlook"
- [ ] Tu seras probablement redirigé vers une page d'erreur (car Nylas n'est pas configuré)

**Attendu**:
- Page d'onboarding s'affiche correctement
- Erreur OAuth attendue (Nylas pas configuré)

**Pour faire fonctionner OAuth**:
→ Suis le guide [SETUP_NYLAS_OUTLOOK.md](SETUP_NYLAS_OUTLOOK.md)

---

### 5. Tests Production (norva.io)

Une fois que Vercel a fini de redéployer:

#### Test A: Homepage
- [ ] Va sur https://norva.io
- [ ] Tu es redirigé vers `/login` (si déconnecté) ou `/dashboard` (si connecté)

**Attendu**: Redirection automatique fonctionne

#### Test B: Signup Production
- [ ] Va sur https://norva.io/signup
- [ ] Crée un nouveau compte avec un email différent
- [ ] Vérifie dans Supabase que l'utilisateur apparaît

**Attendu**: Webhook fonctionne aussi en production

#### Test C: Logo & Design
- [ ] Vérifie que le logo apparaît sur toutes les pages
- [ ] Vérifie le favicon dans l'onglet
- [ ] Fais un **hard refresh** (Cmd+Shift+R) si le logo ne s'affiche pas

---

## 🔍 Vérifications Base de Données

### Supabase Schema
Va dans **Supabase Dashboard** → **Table Editor**

#### Table `users`
- [ ] La table existe
- [ ] Elle contient ces colonnes:
  - `id` (UUID, primary key)
  - `clerk_id` (TEXT, unique)
  - `email` (TEXT, unique)
  - `first_name` (TEXT, nullable)
  - `last_name` (TEXT, nullable)
  - `avatar_url` (TEXT, nullable)
  - `email_grant_id` (TEXT, nullable) ← **Nouveau!**
  - `email_connected_at` (TIMESTAMPTZ, nullable) ← **Nouveau!**
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)

#### Table `clients`
- [ ] La table existe
- [ ] Vide pour l'instant (normal)

#### Table `emails`
- [ ] La table existe
- [ ] Vide pour l'instant (normal)

#### Table `health_history`
- [ ] La table existe
- [ ] Vide pour l'instant (normal)

---

## 📊 Checklist Complète par Fonctionnalité

### ✅ Fonctionnalité: Design System
- [ ] Logo visible en local
- [ ] Logo visible en prod
- [ ] Favicon visible
- [ ] Couleurs Warm Earth appliquées
- [ ] Police serif (Newsreader) pour les titres

### ✅ Fonctionnalité: Authentication
- [ ] Signup fonctionne
- [ ] Login fonctionne
- [ ] Logout fonctionne
- [ ] Redirection automatique fonctionne

### ✅ Fonctionnalité: Webhook Clerk → Supabase
- [ ] Webhook configuré dans Clerk Dashboard
- [ ] `CLERK_WEBHOOK_SECRET` ajouté dans Vercel
- [ ] Users créés via Clerk apparaissent dans Supabase
- [ ] Status `200 OK` dans Clerk webhook logs

### 🚧 Fonctionnalité: OAuth Outlook (En attente de config Nylas)
- [ ] Page onboarding s'affiche
- [ ] Bouton "Connecter Outlook" présent
- [ ] Migration SQL `email_grant_id` appliquée dans Supabase
- [ ] ⏳ Nylas pas encore configuré (à faire selon SETUP_NYLAS_OUTLOOK.md)

### ⏳ Fonctionnalité: Détection Clients (Pas encore implémenté)
- À venir dans la prochaine étape

### ⏳ Fonctionnalité: Analyse IA (Pas encore implémenté)
- À venir après détection clients

---

## 🐛 Debugging

### Problème: Le logo ne s'affiche pas en prod
**Solution**:
1. Fais un hard refresh (Cmd+Shift+R sur Mac)
2. Vérifie que le déploiement Vercel est terminé
3. Attends 2-3 minutes (cache CDN)

### Problème: User ne s'affiche pas dans Supabase après signup
**Solution**:
1. Va dans Clerk Dashboard → Webhooks → Ton endpoint
2. Regarde les "Recent Requests"
3. Si status code n'est pas 200:
   - Va dans Vercel → Logs
   - Cherche les erreurs de `/api/webhooks/clerk`
4. Vérifie que `CLERK_WEBHOOK_SECRET` est bien configuré dans Vercel

### Problème: OAuth Outlook ne marche pas
**Solution**:
- C'est normal! Nylas n'est pas encore configuré
- Suis [SETUP_NYLAS_OUTLOOK.md](SETUP_NYLAS_OUTLOOK.md) pour le configurer

### Problème: Erreur 500 sur le webhook
**Solution**:
1. Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est bien dans Vercel
2. Vérifie les logs Vercel pour voir l'erreur exacte
3. Assure-toi que la table `users` existe dans Supabase

---

## 📝 Notes

- **Tests locaux**: Utilise http://localhost:3000
- **Tests prod**: Utilise https://norva.io
- **Emails de test**: Utilise Yopmail.com pour créer des emails jetables
- **Timing**: Le webhook Clerk prend 1-5 secondes pour synchroniser

---

## ✨ Résumé Rapide (5 minutes)

**Test essentiel pour valider que tout fonctionne**:

1. Va sur https://norva.io/signup
2. Crée un compte test
3. Va dans Supabase → Table `users`
4. Vérifie que ton user apparaît avec `clerk_id` et `email`
5. ✅ Si oui → Tout fonctionne!
6. ❌ Si non → Regarde Clerk webhook logs

**Résultat attendu**: User dans Supabase = Webhook opérationnel ✅