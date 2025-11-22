# 📖 Guide du workflow Norva

## 🎯 Comment ça fonctionne ?

### Vue d'ensemble
```
1. Connecter Gmail → 2. Créer des clients → 3. Synchroniser emails → 4. Voir les emails par client
```

---

## 📋 Workflow détaillé

### 1️⃣ Connexion de l'email (Paramètres)

**Où ?** `/settings`

**Actions** :
1. Cliquer sur "Paramètres" dans la navbar
2. Section "Connexions Email"
3. Cliquer sur "Connecter" sous Gmail
4. Autoriser l'accès Gmail
5. Badge vert ✓ "Connecté" apparaît

**Résultat** : Votre `email_grant_id` est stocké dans Supabase

---

### 2️⃣ Créer des clients (Clients)

**Où ?** `/clients/new`

**Actions** :
1. Cliquer sur "Clients" dans la navbar
2. Cliquer sur "+ Nouveau client"
3. Remplir :
   - **Nom** : Nom du client (ex: "ACME Corp")
   - **Domaine** : Domaine email du client (ex: `acme.com`)
   - Contact email (optionnel)
4. Sauvegarder

**Important** : Le **domaine** est crucial ! C'est lui qui permet de matcher les emails.

**Exemples** :
- Client : "Supervizor" → Domaine : `supervizor.com`
- Client : "Google" → Domaine : `google.com`

**Résultat** : Client créé dans la base de données

---

### 3️⃣ Synchroniser les emails (Paramètres OU Page client)

#### Option A : Depuis les Paramètres
**Où ?** `/settings`

1. Section "Synchronisation des emails"
2. Cliquer sur "Synchroniser"
3. ✅ Emails synchronisés pour TOUS vos clients

#### Option B : Depuis la page d'un client
**Où ?** `/clients/[id]`

1. Aller sur un client spécifique
2. Section "Emails récents"
3. Cliquer sur "Synchroniser les emails" (bouton en haut à droite)
4. ✅ Emails synchronisés pour TOUS vos clients (même comportement)

**Ce qui se passe** :
- L'app récupère vos emails des **3 derniers jours**
- Elle cherche si un email contient le domaine d'un de vos clients dans :
  - From (expéditeur)
  - To (destinataires)
  - CC (copie)
  - BCC (copie cachée)
  - Body (pour les forwards)
- Si match → email stocké et associé au client
- Si pas de match → email stocké avec `client_id = null` (pour review manuelle future)

**Limites** :
- 100 emails max par sync
- Emails des 3 derniers jours uniquement
- Déduplication automatique (pas de doublons)

---

### 4️⃣ Voir les emails d'un client

**Où ?** `/clients/[id]`

1. Cliquer sur "Clients" dans la navbar
2. Cliquer sur un client dans la liste
3. Section "Emails récents" affiche :
   - Sujet
   - Expéditeur
   - Preview
   - Date
   - Badge de sentiment (si analysé)

**Résultat** : Vous voyez tous les emails liés à ce client

---

## 🔄 Cas d'usage : Emails transférés

### Problème
Vous recevez un email transféré par un collègue :

```
From: thomas@autredomaine.com
To: vous@gmail.com
Subject: Fwd: Question importante

---------- Forwarded message ---------
From: john@acme.com
Subject: Question importante
...
```

### Solution
L'app détecte automatiquement :
1. C'est un forward (patterns : "Forwarded message", "Fwd:")
2. Extrait l'expéditeur original : `john@acme.com`
3. Match avec votre client "ACME" (domaine : `acme.com`)
4. ✅ Email associé au bon client !

---

## 🗺️ Navigation de l'app

### Pages principales

| Page | URL | Accès depuis |
|------|-----|--------------|
| **Dashboard** | `/dashboard` | Logo navbar (toujours) |
| **Clients** | `/clients` | Navbar "Clients" |
| **Nouveau client** | `/clients/new` | Bouton "+ Nouveau client" |
| **Détail client** | `/clients/[id]` | Clic sur un client |
| **Paramètres** | `/settings` | Navbar "Paramètres" |

### Retour au Dashboard
✅ **Toujours possible** en cliquant sur le logo Norva en haut à gauche

---

## ❓ FAQ

### Q: Pourquoi mes emails ne se synchronisent pas ?
**R:** Vérifiez :
1. ✅ Email connecté ? (badge vert dans Paramètres)
2. ✅ Au moins 1 client créé ? (avec un domaine valide)
3. ✅ Emails datent de moins de 3 jours ?
4. ✅ Le domaine du client apparaît dans From/To/CC/BCC ?

### Q: Combien d'emails puis-je synchroniser ?
**R:**
- Par sync : 100 emails maximum
- Par mois : 500 emails (quota Nylas gratuit)
- Historique : 3 derniers jours uniquement

### Q: Puis-je synchroniser plusieurs fois ?
**R:**
- ✅ Oui, sans limite de fréquence
- Les emails déjà synchronisés sont ignorés (pas de doublons)
- Seuls les nouveaux emails consomment du quota

### Q: Que se passe-t-il si j'ai transféré un email ?
**R:**
L'app parse le body et détecte l'expéditeur original.
Si le domaine match → email associé au bon client !

### Q: Puis-je voir tous mes emails ?
**R:**
Non, seulement ceux liés à vos clients (par domaine).
C'est voulu : Norva est un outil de gestion client, pas une boîte mail.

### Q: Un email peut-il être associé à plusieurs clients ?
**R:**
Non, un email = 1 client maximum (le premier match trouvé).

---

## 🚀 Ordre recommandé pour démarrer

```
1. Paramètres → Connecter Gmail
2. Clients → Créer vos clients (avec domaines corrects)
3. Paramètres → Synchroniser les emails
4. Clients → Voir vos emails par client
```

---

## 💡 Bonnes pratiques

### Domaines clients
✅ **Bon** : `acme.com` (sans @ ni http://)
❌ **Mauvais** : `@acme.com`, `https://acme.com`

### Test rapide
Pour tester rapidement :
1. Créez un client avec le domaine `gmail.com`
2. Synchronisez
3. Tous vos emails Gmail apparaîtront !
4. Supprimez ce client test après

### Optimiser le quota
- Ne synchronisez que quand nécessaire
- Créez d'abord tous vos clients avant la première sync
- Les syncs suivantes ne récupèrent que les nouveaux emails

---

## 🔐 Sécurité

- **Lecture seule** : L'app ne peut QUE lire vos emails (scope Gmail readonly)
- **Pas de mot de passe** : Seul le grant_id est stocké
- **Révocation** : Déconnectez à tout moment depuis Gmail ou les Paramètres
