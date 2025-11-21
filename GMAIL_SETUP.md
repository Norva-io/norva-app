# Configuration Gmail avec Nylas

## 📋 Étapes de configuration

### 1. Configuration Nylas Dashboard

1. **Allez sur** : https://dashboard.eu.nylas.com
2. **Sélectionnez votre application** (ID: `7b27f7d1-f971-43b5-bea4-a9b591c79a8b`)
3. **Configurez les Redirect URIs** dans les paramètres OAuth :
   - `http://localhost:3000/api/auth/gmail/callback` (dev local)
   - `https://norva.io/api/auth/gmail/callback` (production)
4. **Sauvegardez** les modifications

### 2. Variables d'environnement

#### Local (.env.local)
Vérifiez que vous avez :
```bash
NYLAS_CLIENT_ID=7b27f7d1-f971-43b5-bea4-a9b591c79a8b
NYLAS_API_KEY=nyk_v0_qMcrW5gGtUWtPnpLR6OXFzIzLarmUZLbfgQ0pxF8vQAQSsLZkQiy5cQHTMEjN5Q2
NYLAS_API_URI=https://api.eu.nylas.com
NYLAS_GMAIL_CALLBACK_URI=http://localhost:3000/api/auth/gmail/callback
NYLAS_OUTLOOK_CALLBACK_URI=http://localhost:3000/api/auth/outlook/callback
```

#### Production (Vercel)
Ajoutez sur https://vercel.com :
```bash
NYLAS_GMAIL_CALLBACK_URI=https://norva.io/api/auth/gmail/callback
NYLAS_OUTLOOK_CALLBACK_URI=https://norva.io/api/auth/outlook/callback
```

### 3. Tester la connexion Gmail

1. **Démarrer le serveur** : `npm run dev`
2. **Aller sur** : http://localhost:3000/settings
3. **Cliquer sur** "Connecter" sous Google Gmail
4. **Autoriser** l'accès Gmail (lecture seule)
5. **Vérifier** le retour avec succès

### 4. Créer un client et transférer des emails

#### A. Créer un client
1. Aller sur `/clients/new`
2. Créer un client avec un domaine (ex: `acme.com`)

#### B. Transférer des emails de test
Pour tester, transférez des emails de vos clients vers votre Gmail :

1. **Configurez un filtre Gmail** (optionnel) :
   - Paramètres → Filtres et adresses bloquées
   - Créer un filtre pour les emails transférés
   - Ajouter un label "Client - [Nom]"

2. **Transférez des emails** :
   - Sélectionnez un email d'un client
   - Cliquez sur "Transférer"
   - Envoyez à votre Gmail connecté à Norva
   - L'email apparaîtra dans Norva si le domaine correspond

#### C. Synchroniser les emails
1. Aller sur la page du client
2. Cliquer sur **"Synchroniser les emails"**
3. Les emails apparaîtront dans la section "Emails récents"

## 📊 Comment ça fonctionne

### Détection des clients
L'application synchronise **uniquement** les emails où le domaine du client apparaît dans :
- L'expéditeur (From)
- Les destinataires (To)
- Les personnes en copie (CC)
- Les personnes en copie cachée (BCC)

**Exemple** :
- Client créé avec domaine : `acme.com`
- Email de `john@acme.com` → ✅ Synchronisé
- Email vers `sales@acme.com` → ✅ Synchronisé
- Email en CC avec `support@acme.com` → ✅ Synchronisé
- Email de `autre@exemple.com` → ❌ Non synchronisé

### Historique limité
- **3 jours** d'historique maximum (MVP)
- Déduplication automatique (emails déjà synchronisés ignorés)
- Mise à jour du compteur d'emails par client

## ⚠️ Important

### Permissions Gmail
- **Lecture seule** : L'application ne peut **que lire** vos emails
- **Scope** : `https://www.googleapis.com/auth/gmail.readonly`
- **Aucune modification** possible de vos emails

### Sécurité
- Le `grant_id` Nylas est stocké de manière sécurisée dans Supabase
- Pas de stockage du mot de passe Gmail
- Révocation possible à tout moment depuis Gmail

### Limites Nylas Sandbox
- **5 comptes** maximum
- **500 emails/mois** en mode gratuit
- Pour la production, passez à un plan payant

## 🔄 Révoquer l'accès

Pour révoquer l'accès de Norva à Gmail :
1. Allez sur https://myaccount.google.com/permissions
2. Trouvez "Nylas" ou "Norva"
3. Cliquez sur "Révoquer l'accès"

## 🐛 Dépannage

### Erreur "invalid_query_params"
- Vérifiez que le redirect URI est configuré dans Nylas Dashboard
- Format exact : `https://norva.io/api/auth/gmail/callback`

### Aucun email synchronisé
- Vérifiez que le domaine du client correspond exactement
- Les emails doivent dater de moins de 3 jours
- Cliquez sur "Synchroniser les emails" manuellement

### "Email not connected"
- Allez dans Paramètres → Connectez d'abord votre Gmail
- Le badge vert "Connecté" doit apparaître

## 📚 Prochaines étapes

Une fois Gmail fonctionnel :
1. ✅ Tester la synchronisation avec vos vrais clients
2. 🔜 Analyser le sentiment des emails avec Claude AI
3. 🔜 Générer des insights automatiques
4. 🔜 Calculer le score de santé client
