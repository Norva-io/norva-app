# Guide de résolution des problèmes

## 🐛 Problème : Emails Cybelesoft non détectés

### Diagnostic

Le parsing des emails forwards ne fonctionne pas car :

1. ✅ **Migration 007 appliquée** : Colonne `body` existe
2. ✅ **Migration 008 appliquée** : Table `suggested_actions` existe
3. ✅ **Parsing HTML amélioré** : Fonction `stripHtml()` implémentée
4. ❌ **Emails sans body** : Les emails ont été synchronisés **AVANT** la migration 007

### Solution : Resynchroniser les emails

#### Étape 1 : Supprimer les anciens emails (optionnel)

Si vous voulez repartir de zéro :

```sql
-- Dans Supabase SQL Editor
DELETE FROM emails;
```

#### Étape 2 : Resynchroniser depuis l'interface

1. Allez sur http://localhost:3000/settings
2. Cliquez sur **"Synchroniser les emails"**
3. Attendez la fin de la synchronisation

**Maintenant, les nouveaux emails auront :**
- ✅ Body complet stocké en base
- ✅ Parsing HTML pour détecter les forwards
- ✅ Attribution correcte à Cybelesoft pour les emails transférés

#### Étape 3 : Vérifier avec le script

```bash
npx tsx scripts/check-cybelesoft-emails.ts
```

Vous devriez voir :
```
✅ Client trouvé: Cybelesoft
   Total emails: 5  # (ou plus)

📧 5 emails trouvés pour Cybelesoft:
   ✅ Contient "cybelesoft" dans le body
   🔄 Semble être un forward
```

## 🔍 Scripts de diagnostic

### Vérifier l'état de la base

```bash
npx tsx scripts/check-cybelesoft-emails.ts
```

### Réattribuer les emails orphelins

```bash
npx tsx scripts/reassign-orphaned-emails.ts
```

### Vérifier dans Supabase SQL Editor

```sql
-- Copier-coller le contenu de:
-- scripts/check-and-fix-parsing.sql
```

## 📊 Comprendre le problème du body vide

### Pourquoi le body est vide ?

Les emails ont été synchronisés avec ce code (AVANT la migration 007) :

```typescript
// Ancien code (sans body)
await supabase.from('emails').insert({
  subject: message.subject,
  preview: message.snippet,  // Seulement 150 caractères !
  // ❌ Pas de body stocké
})
```

Le `snippet` ne contient que 150 caractères, insuffisant pour détecter :
- Les headers de forward ("---------- Forwarded message ---------")
- L'email original dans un forward
- Les mentions de domaines dans le corps du message

### Après la migration 007

Nouveau code (AVEC body complet) :

```typescript
// Nouveau code (avec body)
const messageDetails = await nylas.messages.find({
  identifier: user.email_grant_id,
  messageId: message.id,
})

await supabase.from('emails').insert({
  subject: message.subject,
  preview: message.snippet,
  body: messageDetails.data.body,  // ✅ Body HTML complet !
})
```

Le `body` contient tout le HTML de l'email, permettant :
- ✅ Détection des forwards via `parseForwardedEmail()`
- ✅ Extraction des emails du corps avec `stripHtml()`
- ✅ Attribution correcte même pour emails transférés

## 🚀 Prochaines étapes

1. **Resynchroniser les emails** pour avoir le body complet
2. **Tester avec l'email Cybelesoft** que vous avez mentionné
3. **Vérifier l'attribution** avec le script de diagnostic

## ❓ Questions fréquentes

### Q: Pourquoi ne pas auto-migrer les anciens emails ?

**R:** On ne peut pas récupérer le body des anciens emails car :
- Nylas ne stocke les emails que 30 jours (plan gratuit)
- Les emails ont été synchronisés il y a plusieurs semaines
- Le seul moyen est de resynchroniser les emails récents

### Q: Combien d'emails puis-je synchroniser ?

**R:** Le plan gratuit Nylas permet 500 emails/mois. Chaque sync nécessite :
- 1 appel pour `messages.list()` (tous les emails)
- 1 appel par email pour `messages.find()` (le body)

Donc pour 100 emails = 101 appels API.

### Q: Dois-je supprimer les anciens emails ?

**R:** Optionnel, mais recommandé pour :
- Éviter les doublons
- Repartir sur une base propre
- Tester le parsing HTML sur de vrais emails
