# 📋 Plan d'action - Résolution parsing Cybelesoft

## 🎯 Objectif

Faire en sorte que les emails transférés depuis Cybelesoft (ex: via `timothee.verluise@supervizor.com`) soient correctement détectés et attribués au client Cybelesoft.

## ✅ Travaux réalisés

### 1. Infrastructure technique (✅ Complété)

- [x] Migration 007 : Ajout colonne `body` dans `emails`
- [x] Migration 008 : Création table `suggested_actions`
- [x] Parsing HTML : Fonction `stripHtml()` pour nettoyer le HTML
- [x] Amélioration `parseForwardedEmail()` pour utiliser le body nettoyé
- [x] Fetch du body complet via `nylas.messages.find()`

### 2. Scripts de diagnostic (✅ Complété)

- [x] `check-cybelesoft-emails.ts` - Vérifie l'attribution
- [x] `reassign-orphaned-emails.ts` - Réattribue avec parsing amélioré
- [x] `check-and-fix-parsing.sql` - Queries SQL de diagnostic

### 3. Documentation (✅ Complété)

- [x] `TROUBLESHOOTING.md` - Guide complet de résolution
- [x] `session-summary.md` - Résumé de la session
- [x] `ACTION-PLAN.md` - Ce document

## 🔴 Problème identifié

**Les emails en base n'ont pas de `body` !**

### Pourquoi ?

Les emails ont été synchronisés **AVANT** la migration 007 qui ajoute la colonne `body`.

L'ancien code ne stockait que le `snippet` (150 caractères max) :

```typescript
// Avant migration 007
await supabase.from('emails').insert({
  preview: message.snippet,  // ❌ Seulement 150 chars
})
```

Le nouveau code (après migration 007) stocke le body complet :

```typescript
// Après migration 007
const messageDetails = await nylas.messages.find({ messageId: message.id })
await supabase.from('emails').insert({
  preview: message.snippet,
  body: messageDetails.data.body,  // ✅ HTML complet
})
```

### Impact

Sans le `body` complet :
- ❌ Impossible de détecter les forwards (headers tronqués)
- ❌ Impossible d'extraire l'email original
- ❌ Cybelesoft n'est pas détecté dans les transfers

## 🚀 Solution : Resynchronisation

### Étape 1 : Supprimer les anciens emails

```sql
-- Dans Supabase SQL Editor
DELETE FROM emails;
```

### Étape 2 : Resynchroniser

1. Aller sur http://localhost:3000/settings
2. Cliquer sur **"Synchroniser les emails"**
3. Attendre la fin de la synchronisation

### Étape 3 : Vérifier

```bash
npx tsx scripts/check-cybelesoft-emails.ts
```

**Résultat attendu :**

```
✅ Client trouvé: Cybelesoft
   Total emails: 5

📧 5 emails trouvés pour Cybelesoft:

📨 TR: Supervizor x New order
   De: timothee.verluise@supervizor.com
   Body: 15234 caractères
   ✅ Contient "cybelesoft" dans le body
   🔄 Semble être un forward
```

## 📊 Tests à effectuer

### Test 1 : Email direct de Cybelesoft

**Email :** `contact@cybelesoft.com` → `vous@supervizor.com`

**Résultat attendu :**
- ✅ Détecté par domaine `cybelesoft.com`
- ✅ Attribué à client Cybelesoft
- ✅ Compteur `total_emails_count` incrémenté

### Test 2 : Email forward depuis Cybelesoft

**Email :** `contact@cybelesoft.com` → `vous@supervizor.com` → forward

**Contenu body HTML :**
```html
<div>---------- Forwarded message ---------</div>
<div>From: contact@cybelesoft.com</div>
<div>Subject: Demande de devis</div>
```

**Résultat attendu :**
- ✅ Forward détecté par pattern "Forwarded message"
- ✅ Email original extrait : `contact@cybelesoft.com`
- ✅ Domaine extrait : `cybelesoft.com`
- ✅ Attribué à client Cybelesoft

### Test 3 : Email de Supervizor mentionnant Cybelesoft

**Email :** `vous@supervizor.com` → `collègue@supervizor.com`

**Contenu :** "Cybelesoft nous a contacté pour..."

**Résultat attendu :**
- ✅ Pas détecté comme email Cybelesoft (correct !)
- ✅ Attribué à client Supervizor (domaine de l'expéditeur)
- ⚠️ Mention de "cybelesoft" dans le body (pourra être utilisé par l'IA)

## 🔍 Commandes utiles

### Diagnostic rapide

```bash
# Vérifier les emails Cybelesoft
npx tsx scripts/check-cybelesoft-emails.ts

# Réattribuer les orphelins
npx tsx scripts/reassign-orphaned-emails.ts
```

### Queries SQL

```sql
-- Compter les emails par client
SELECT
  c.name,
  c.domain,
  COUNT(e.id) as email_count
FROM clients c
LEFT JOIN emails e ON e.client_id = c.id
GROUP BY c.id, c.name, c.domain;

-- Vérifier les emails avec/sans body
SELECT
  COUNT(*) FILTER (WHERE body IS NULL OR body = '') AS sans_body,
  COUNT(*) FILTER (WHERE body IS NOT NULL AND body != '') AS avec_body
FROM emails;
```

## 📈 Métriques de succès

Après resynchronisation :

- [ ] `total_emails_count` > 0 pour Cybelesoft
- [ ] Emails forwards détectés dans les logs
- [ ] Email "TR: Supervizor x New order" attribué à Cybelesoft
- [ ] Body complet stocké pour tous les nouveaux emails

## 🎓 Leçons apprises

1. **Toujours stocker le body complet** pour analyse IA future
2. **Les snippets sont trop courts** pour la détection de forwards
3. **HTML doit être nettoyé** avant parsing (balises, entités)
4. **Resync nécessaire** après ajout de colonnes structurelles

## 🔮 Améliorations futures

1. **Auto-resync** : Détecter les emails sans body et les resynchroniser
2. **Parsing plus robuste** : Gérer plus de formats de forwards (Outlook, Apple Mail)
3. **ML** : Utiliser l'IA pour détecter les forwards même sans headers
4. **Webhook** : Recevoir les nouveaux emails en temps réel via Nylas webhooks
