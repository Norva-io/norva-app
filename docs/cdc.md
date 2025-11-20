# NORVA : CAHIER DES CHARGES DÉTAILLÉ

## Préambule : Philosophie "Batch Invariant & Trust First"

**Principe directeur** : Chaque élément technique doit renforcer la confiance utilisateur.

```python
Trust = Clarté + Prévisibilité + Fiabilité + Sécurité

- Clarté : UI explicite sur ce qui se passe
- Prévisibilité : Pas de comportement magique incompréhensible
- Fiabilité : Ça marche à chaque fois, pareil
- Sécurité : Données protégées, conformité visible
```

**Implications sur l'archi** :

- ✅ Messages clairs à chaque étape ("Analyse de 847 emails en cours...")
- ✅ Feedback visuel permanent (progress bars, states)
- ✅ Gestion d'erreur gracieuse (retry, fallback)
- ✅ Logs transparents pour debug user ("Pourquoi ce score ?")
- ✅ Performance constante (pas de dégradation avec plus de données)

# 1️⃣ SPÉCIFICATIONS FONCTIONNELLES

## 1.1 Vision Produit

**Nom** : Norva

**Baseline** : "Your Customer Success Copilot"

**Problème résolu** : Les CSM perdent 40% de leur temps à trier leurs emails et ratent les signaux de churn clients par manque de visibilité.

**Solution** : Une IA qui analyse automatiquement les emails clients, détecte les risques et suggère des actions prioritaires.

**Cible initiale** :

- CSM en agence/conseil (5-50 personnes)
- Gèrent 20-100 clients simultanément
- Utilisent Gmail/Outlook comme outil principal
- Budget : 40-80€/user/mois acceptable

## 1.2 User Personas

### Persona 1 : Sarah, CSM Solo

- 32 ans, consultante freelance
- 25 clients actifs
- 150 emails/jour
- Pain : "Je passe 2h/jour juste à trier mes mails, je rate des urgences"
- Motivation : Gagner du temps, éviter de perdre un client

### Persona 2 : Marc, Head of Customer Success

- 38 ans, manage une équipe de 8 CSM
- 150 clients totaux en portfolio équipe
- Pain : "Je ne sais pas quel CSM est débordé, ni quels clients sont à risque"
- Motivation : Piloter son équipe, prévenir le churn, reporting direction

### Persona 3 : RDAV, Head of Customer Success

- 31 ans, manage une équipe de 4 CSM a distance
- X clients totaux en portfolio équipe
- Pain : "Je ne sais pas quel CSM est débordé, ni quels clients sont à risque"
- Motivation : Piloter son équipe, prévenir le churn, reporting direction

## 1.3 User Stories MVP (Itération 1 - POC)

### 🎯 Objectif Itération 1

**Prouver la valeur** : Un CSM solo peut détecter 1 client à risque qu'il n'aurait pas vu sans Norva.

**Scope réduit pour POC** :

- ✅ Connexion Outlook uniquement
- ✅ Analyse 30 derniers jours max
- ✅ Max 20 clients
- ✅ Interface française
- ✅ 1 seul user (pas de team features)
- ❌ Pas de CSV import
- ❌ Pas de génération email
- ❌ Pas de billing (gratuit le temps du POC)

---

### **Epic 1 : Onboarding & Setup**

**US1.1 : Inscription**

```json
En tant que nouveau user
Je veux créer un compte en 30 secondes
Pour commencer à utiliser Norva rapidement

Acceptance Criteria :
✓ Sign up avec email + mot de passe (Clerk Auth)
✓ Email de confirmation avec CTA "Confirmer mon compte"
✓ Redirect auto vers /onboarding après confirmation
✓ Langue : Français uniquement (hardcodé)
✓ Message accueil : "Bienvenue sur Norva 👋"

Écran :
┌────────────────────────────────────────┐
│         🧭 Norva                     │
│                                        │
│   Créer votre compte                   │
│                                        │
│   Email : [_____________]              │
│   Mot de passe : [_____________]       │
│   [Créer mon compte]                   │
│                                        │
│   Déjà inscrit ? [Se connecter]       │
└────────────────────────────────────────┘

Priorité : P0 (bloquant)
Effort : 0.5j
```

**US1.2 : Connexion Outlook**

```json
En tant que user
Je veux connecter ma boîte Outlook en OAuth
Pour autoriser Norva à lire mes emails

Flow technique :
1. Microsoft Graph API OAuth 2.0
2. Scopes demandés : 
   - Mail.Read (lecture emails)
   - User.Read (infos profil)
3. Pas de Mail.Send (read-only)

Acceptance Criteria :
✓ Bouton "Connecter Outlook" avec logo Microsoft
✓ Popup OAuth Microsoft (redirect vers login.microsoftonline.com)
✓ Message explicite AVANT OAuth :
  "Norva va lire vos emails pour analyser vos échanges clients.
   Vos emails ne sont jamais modifiés ni partagés."
✓ Lien "Politique de confidentialité" (page /privacy)
✓ Gestion erreur OAuth :
  - Permission refusée → "Vous avez annulé. [Réessayer]"
  - Erreur serveur → "Erreur temporaire. [Réessayer]"
✓ Success : Toast "Outlook connecté ✓" + redirect vers étape 2

Écran :
┌────────────────────────────────────────┐
│  Étape 1/3 : Connecter votre boîte     │
│                                        │
│  Norva a besoin d'accéder à vos     │
│  emails pour les analyser.             │
│                                        │
│  🔒 Lecture seule - Vos données restent│
│     privées et chiffrées               │
│                                        │
│  [🔵 Connecter Outlook]                │
│                                        │
│  [Politique de confidentialité]       │
└────────────────────────────────────────┘

Priorité : P0
Effort : 1.5j (OAuth Microsoft + tests)

Notes dev pour Claude Code :
- Utiliser @azure/msal-node pour OAuth
- Stocker refresh_token chiffré en DB (Supabase encryption)
- Implémenter token refresh automatique
- Docs Microsoft Graph : https://learn.microsoft.com/graph/
```

**US1.3 : Sélection période d'analyse**

```json
En tant que user
Je veux choisir la période d'emails à analyser
Pour contrôler la quantité de données traitées

Rationale :
- Éviter d'analyser 5 ans d'historique (coût IA)
- Donner contrôle à l'utilisateur
- Permettre de tester sur une petite période d'abord

Acceptance Criteria :
✓ Écran après connexion Outlook réussie
✓ Options pré-définies :
  - 7 derniers jours (recommandé pour test rapide)
  - 30 derniers jours (défaut sélectionné)
  - 90 derniers jours (analyse complète)
✓ Affichage estimation :
  "~450 emails seront analysés"
  "Durée estimée : 3 minutes"
  "Coût en crédits : 15 crédits" (si système de crédits)
✓ Bouton "Analyser mes emails" → Step 4
✓ Tooltip : "Pourquoi limiter la période ?"
  → "Pour démarrer rapidement et réduire les coûts d'analyse"

Écran :
┌────────────────────────────────────────┐
│  Étape 2/3 : Période d'analyse         │
│                                        │
│  Choisissez la période à analyser :    │
│                                        │
│  ○ 7 derniers jours (test rapide)     │
│  ● 30 derniers jours (recommandé)     │
│  ○ 90 derniers jours (complet)        │
│                                        │
│  📊 Estimation :                       │
│     ~450 emails à analyser             │
│     Durée : ~3 minutes                 │
│                                        │
│  [← Retour] [Analyser mes emails →]   │
└────────────────────────────────────────┘

Priorité : P0
Effort : 0.5j

Notes dev :
- Faire un COUNT rapide avant analyse (Graph API $count)
- Stocker la période choisie pour futures syncs incrémentielles
```

**US1.4 : Détection & validation clients**

```json
En tant que user
Je veux valider la liste de clients détectée par l'IA
Pour corriger les erreurs et exclure les contacts persos

Flow :
1. Norva analyse les emails de la période choisie
2. Détection intelligente des clients par :
   - Domaine email récurrent (@acme.com)
   - Signatures emails (regex: "Nom Prénom, Entreprise")
   - Fréquence d'échange (>5 emails dans la période)
   - Exclusion auto : @gmail.com, @outlook.com, @free.fr (domaines persos)

3. Affichage table de validation :

┌────────────────────────────────────────────────────┐
│  Étape 3/3 : Vos clients détectés                  │
│                                                    │
│  ✓ | Nom client      | Domaine       | Emails #    │
├────────────────────────────────────────────────────┤
│  ☑ | ACME Corp       | acme.com      | 47          │
│  ☑ | TechStart SAS   | techstart.io  | 23          │
│  ☐ | Sophie Martin   | gmail.com     | 12  [Perso] │
│  ☑ | Innovate GmbH   | innovate.de   | 8           │
│  ☑ | BetaCorp        | betacorp.fr   | 15          │
├────────────────────────────────────────────────────┤
│  [+ Ajouter manuellement]  [Valider (4 clients)]   │
└────────────────────────────────────────────────────┘

Actions possibles :
- ✓ Cocher/décocher pour inclure/exclure
- ✏️ Renommer (double-click sur nom)
- 🔗 Fusionner (si doublon détecté)
- ➕ Ajouter manuellement (modal avec form)

Acceptance Criteria :
✓ Détection IA avec score de confiance (non affiché, juste interne)
✓ Tri par nombre d'emails (décroissant)
✓ Auto-exclusion domaines persos (gmail, outlook, free, orange, etc.)
✓ Checkboxes cochées par défaut si confiance > 70%
✓ Recherche en temps réel dans la liste
✓ Limitation POC : Max 20 clients sélectionnables
✓ Warning si > 20 : 
  "Version POC limitée à 20 clients. Sélectionnez vos priorités."
✓ Validation : minimum 1 client sélectionné
✓ Bouton "Ajouter manuellement" :
  → Modal avec champs : Nom, Domaine, Email contact principal
✓ Bouton "Valider" déclenche analyse → redirect /dashboard

Priorité : P0
Effort : 2j (algo détection + UI)

Notes dev :
- Algo détection simple suffisant pour POC :
  GROUP BY email_domain 
  HAVING COUNT(*) > 5 
  AND domain NOT IN (liste_domaines_persos)
- Stocker clients en DB (table clients)
- Associer emails aux clients (table client_emails)
```

**US1.5 : Première analyse (background job)**

```json
En tant que user
Je veux que Norva analyse mes emails en arrière-plan
Pour ne pas attendre devant un écran de chargement

Flow :
1. User clique "Valider" (step 3)
2. Redirect immédiat vers /dashboard
3. Dashboard affiche état "Analyse en cours"
4. Background job (queue) :
   a. Fetch emails Outlook API (batch 50)
   b. Pour chaque client sélectionné :
      - Filtrer emails liés (from/to client domain)
      - Grouper par conversation (subject + references)
      - Appel Claude API pour analyse (batch 10 threads max)
   c. Calcul health score par client
   d. Stockage résultats en DB
5. WebSocket/polling refresh le dashboard quand terminé

Acceptance Criteria :
✓ Job queue (Upstash QStash ou Inngest)
✓ Retry automatique si échec (3 tentatives)
✓ Timeout par client : 2min max
✓ Si échec partiel : continuer les autres clients
✓ Logs détaillés (Sentry) :
  - Client X : 47 emails, 12 threads analysés
  - Client Y : erreur (retry scheduled)
✓ Notification user quand terminé :
  - Toast in-app si user encore connecté
  - Email si analyse > 5min
✓ Écran dashboard pendant analyse :

┌────────────────────────────────────────┐
│  🔄 Analyse en cours...                │
│                                        │
│  [████████████░░░░░░] 67%             │
│                                        │
│  3 clients analysés sur 4              │
│  Temps restant : ~1 minute             │
│                                        │
│  [Actualiser]                         │
└────────────────────────────────────────┘

✓ Auto-refresh toutes les 5 secondes (polling)
✓ Quand terminé : transition smooth vers dashboard complet

Priorité : P0
Effort : 2.5j (complexe : queue + retry + monitoring)

Notes dev pour Claude Code :
- Upstash QStash recommandé (serverless, pay-per-use)
- Alternative : Inngest (meilleure DX, generous free tier)
- Stockage progress en Redis (Upstash Redis)
- Pattern : 1 job par client (parallélisation)
- Exemple code Inngest :
  
  inngest.createFunction(
    { id: "analyze-client" },
    { event: "client.analyze" },
    async ({ event, step }) => {
      const emails = await step.run("fetch-emails", async () => {
        return fetchOutlookEmails(event.data.clientId);
      });
      
      const analysis = await step.run("claude-analysis", async () => {
        return analyzeWithClaude(emails);
      });
      
      await step.run("save-results", async () => {
        return saveToDatabase(analysis);
      });
    }
  );
```

---

### Epic 2 : Dashboard Clients

**US2.1 : Liste clients avec health score**

```json
En tant que user
Je veux voir tous mes clients d'un coup d'œil
Pour prioriser qui contacter aujourd'hui

UI Desktop (français) :
┌────────────────────────────────────────────────────┐
│ 🧭 Norva    [Clients] [Paramètres]      👤 Rémi │
├────────────────────────────────────────────────────┤
│                                                    │
│  🔍 Rechercher un client...  [Filtrer ▾] [Trier ▾]│
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Client          | Score | Dernier contact    │ │
│  ├──────────────────────────────────────────────┤ │
│  │ 🔴 ACME Corp     │  32   │ Il y a 12 jours   │ │
│  │ 🟡 TechStart SAS │  68   │ Il y a 2 jours    │ │
│  │ 🟢 Innovate GmbH │  89   │ Hier              │ │
│  │ 🟢 BetaCorp      │  91   │ Il y a 3 heures   │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  4 clients sur 4                                  │
└────────────────────────────────────────────────────┘

Filtres (dropdown) :
- Tous les clients (4)
- À risque (<50) [1]
- Stables (50-80) [1]
- En bonne santé (>80) [2]

Options de tri :
- Score (plus bas en premier) ← défaut
- Dernier contact (plus ancien en premier)
- Nom (A-Z)

Acceptance Criteria :
✓ Table responsive (shadcn/ui DataTable)
✓ Pas de pagination pour POC (max 20 clients)
✓ Score coloré : 
  - <50 = 🔴 Rouge (#EF4444)
  - 50-80 = 🟡 Jaune (#F59E0B)
  - >80 = 🟢 Vert (#10B981)
✓ Hover row : background légèrement grisé
✓ Click row → redirect /client/[slug]
✓ Loading state : skeleton (3 lignes grises pulsantes)
✓ Empty state (si aucun client) :
  ┌────────────────────────────────────┐
  │  📭 Aucun client analysé           │
  │                                    │
  │  Connectez votre boîte mail pour   │
  │  commencer.                        │
  │                                    │
  │  [Connecter Outlook]               │
  └────────────────────────────────────┘
✓ Timestamp relatif en français :
  - "Il y a 3 heures"
  - "Hier"
  - "Il y a 5 jours"
  - Librairie : date-fns avec locale fr

Priorité : P0
Effort : 1.5j

Notes dev :
- Utiliser shadcn/ui Table component
- date-fns/locale/fr pour timestamps
- Slug client : normalize(name).toLowerCase().replace(/\s+/g, '-')
```

**US2.2 : Filtres et recherche**

```json
En tant que user
Je veux filtrer mes clients par niveau de risque
Pour me concentrer sur les urgences

Acceptance Criteria :
✓ Search bar : 
  - Recherche fuzzy (nom client OU domaine)
  - Debounce 300ms
  - Clear button (X) si texte présent
✓ Filtre "Niveau de risque" :
  - Dropdown avec 4 options (All, À risque, Stables, Sains)
  - Badge count : "À risque (1)"
  - Multi-select non nécessaire pour POC
✓ Sort dropdown :
  - 3 options (Score, Dernier contact, Nom)
  - Icon ↑↓ selon ordre
✓ Filtres actifs visibles :
  "À risque (1) ×" (badge cliquable pour clear)
✓ Bouton "Réinitialiser" si filtres appliqués
✓ State sync URL params :
  - /dashboard?filter=risk&sort=score
  - Permet partage de vue (utile plus tard pour team)

Priorité : P1 (important mais pas bloquant)
Effort : 0.5j
```

---

### Epic 3 : Fiche Client Détaillée

**US3.1 : Vue détaillée client**

```json
En tant que user
Je veux voir tous les détails d'un client spécifique
Pour comprendre pourquoi son score est bas/élevé

URL : /client/acme-corp

UI :
┌─────────────────────────────────────────────────┐
│ ← Retour aux clients                            │
├─────────────────────────────────────────────────┤
│                                                 │
│  ACME Corp                      Score : 32 🔴   │
│  contact@acme.com               [↻ Actualiser]  │
│  ━━━━━━━━░░░░░░░░░░░░░░░░░  À risque           │
│                                                 │
│  📊 Évolution du score (30 derniers jours)      │
│  ┌────────────────────────────────────────────┐│
│  │ [Graphique ligne : 85 (J-30) → 32 (Auj.)]││
│  └────────────────────────────────────────────┘│
│                                                 │
│  🧠 Analyse IA                                  │
│  ┌────────────────────────────────────────────┐│
│  │ ⚠ Temps de réponse dégradé : 4h → 2 jours  ││
│  │ ⚠ 3 derniers emails sans réponse            ││
│  │ ℹ Client a mentionné "budget serré" 2 fois ││
│  │ ⚠ Ton formel (était décontracté il y a 2m) ││
│  └────────────────────────────────────────────┘│
│                                                 │
│  💡 Actions recommandées                        │
│  ┌────────────────────────────────────────────┐│
│  │ 1. Appeler aujourd'hui - Check-in urgent   ││
│  │ 2. Répondre aux questions en suspens       ││
│  │ 3. Proposer un point pour discuter budget  ││
│  └────────────────────────────────────────────┘│
│                                                 │
│  📧 Conversations récentes (20 derniers fils)   │
│  [Accordion avec liste de threads]             │
│                                                 │
└─────────────────────────────────────────────────┘

Acceptance Criteria :
✓ Header sticky avec nom client + score
✓ Bouton "Actualiser" :
  - Re-déclenche analyse (job queue)
  - Disabled pendant 5min après dernière analyse
  - Tooltip : "Dernière analyse il y a 3h"
✓ Chart évolution score :
  - Line chart simple (Recharts)
  - 30 derniers jours avec points tous les 3-5 jours
  - Si données insuffisantes : "Pas assez d'historique"
✓ Section "Analyse IA" :
  - 3 à 6 insights maximum
  - Icons : ⚠ (warning rouge), ℹ (info bleue), ✓ (succès vert)
  - Texte clair et actionnable
  - Ordre de priorité : warnings d'abord
✓ Section "Actions recommandées" :
  - Liste numérotée (1, 2, 3)
  - Ton directif ("Appeler", "Répondre", "Proposer")
  - Pas de génération de template dans POC
✓ Section "Conversations récentes" :
  - Accordion (shadcn/ui Accordion)
  - 20 derniers threads max
  - Voir US3.2 pour détails
✓ Loading states granulaires :
  - Skeleton pour chart pendant fetch
  - Skeleton pour insights
  - Threads chargés en dernier (lazy load acceptable)
✓ Breadcrumb : "Clients > ACME Corp"

Priorité : P0
Effort : 2.5j

Notes dev :
- Chart : Recharts LineChart
- Données score : table client_health_history (snapshot daily)
- Insights : stockés en JSON en DB (table client_insights)
```

**US3.2 : Timeline conversations (threads)**

```json
En tant que user
Je veux voir l'historique de mes échanges avec le client
Pour retrouver le contexte rapidement

UI (Accordion) :
┌─────────────────────────────────────────────┐
│ ▶ RE: Projet Q4 - Point d'avancement       │
│   Il y a 2 jours · Sentiment : Négatif     │
├─────────────────────────────────────────────┤
│ ▼ Questions onboarding (12 messages)       │
│   Il y a 5 jours · Sentiment : Neutre      │
│   ┌───────────────────────────────────────┐│
│   │ 👤 Vous → John (il y a 5 jours)      ││
│   │ "Merci pour vos questions, voici..." ││
│   │                                       ││
│   │ 💼 John → Vous (il y a 5 jours)      ││
│   │ "Encore une question sur l'API..."   ││
│   │                                       ││
│   │ [Ouvrir dans Outlook →]              ││
│   └───────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│ ▶ Bienvenue chez ACME Corp (3 messages)    │
│   Il y a 15 jours · Sentiment : Positif    │
└─────────────────────────────────────────────┘

Acceptance Criteria :
✓ Threads groupés par sujet (subject email)
✓ Tri chronologique (plus récent d'abord)
✓ Badge sentiment par thread :
  - Positif (vert)
  - Neutre (gris)
  - Négatif (rouge)
✓ Expand/collapse accordion
✓ Dans un thread ouvert :
  - Messages alternés (vous vs client)
  - Avatar : 👤 (vous) vs 💼 (client)
  - Timestamp relatif
  - Texte tronqué si >300 caractères (+ "Lire plus")
✓ Bouton "Ouvrir dans Outlook" :
  - Deep link : outlook:// ou web link
  - Ouvre le thread directement dans Outlook
✓ Limite : 20 threads max affichés
✓ Si > 20 : bouton "Voir plus" (charge 20 suivants)

Priorité : P0
Effort : 1.5j

Notes dev :
- Grouper par conversationId (Outlook API fournit ça)
- Sentiment : analyse Claude stockée en DB
- Deep link Outlook : 
  - Desktop : outlook://emails/{messageId}
  - Web : https://outlook.office.com/mail/inbox/id/{messageId}
```

---

### Epic 4 : Settings & Admin

**US4.1 : Paramètres compte**

```json
En tant que user
Je veux gérer mon compte
Pour mettre à jour mes informations

Pages :
- /settings/profil : Nom, email, photo, langue
- /settings/email : Boîte Outlook connectée, reconnecter
- /settings/clients : Liste, éditer, supprimer
- /settings/compte : Supprimer mon compte

Acceptance Criteria :
✓ Sidebar navigation (active state visible)
✓ Forms avec validation (Zod schemas)
✓ Toast confirmations après chaque action
✓ Bouton "Supprimer mon compte" :
  - Modal de confirmation sérieuse
  - "Tapez DELETE pour confirmer"
  - Suppression cascade (emails, analyses, etc.)
  - Email de confirmation envoyé après

Priorité : P1
Effort : 1j
```

**US4.2 : Gestion abonnement**

```json
En tant que user
Je veux voir mon usage et upgrader si besoin
Pour débloquer plus de clients

Pricing POC (simplifié) :

┌─────────────────────────────────────────┐
│          Plans Norva                  │
├─────────────────────────────────────────┤
│                                         │
│  Gratuit       Starter      Pro        │
│  0€/mois       49€/mois     99€/mois   │
│                                         │
│  5 clients     20 clients   50 clients │
│  500 emails    2000 emails  Illimité   │
│  Sync 1x/jour  Sync 4x/jour Sync 1x/h  │
│                                         │
│  [Actuel]      [Choisir]    [Choisir]  │
└─────────────────────────────────────────┘

Logique :
- Plan basé sur nb clients + volume emails analysés/mois
- Pas de team features dans POC
- Upgrade simple via Stripe Checkout

Acceptance Criteria :
✓ Page /settings/abonnement :
  - Affichage plan actuel
  - Usage : "12 / 20 clients" avec progress bar
  - Usage : "847 / 2000 emails ce mois"
✓ Warning si proche limite :
  "⚠ Plus que 3 clients disponibles. Upgrader ?"
✓ Bouton "Upgrader" → Stripe Checkout
✓ Stripe webhooks :
  - checkout.session.completed → Activer plan
  - customer.subscription.updated → MàJ DB
  - customer.subscription.deleted → Downgrade auto
✓ Lien "Gérer mon abonnement" → Stripe Customer Portal
  (permet annulation, changement carte, factures)

Priorité : P0 (pour monétiser !)
Effort : 2j (Stripe intégration + webhooks)

Notes dev :
- Stripe Checkout : mode=subscription
- Webhook signing (vérifier signature Stripe)
- Env vars : STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- Test avec Stripe CLI : stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 1.4 User Flows (Wireframes textuels)

### Flow 1 : First-time user → Premier insight (POC)

```json
┌─────────────────────────────────────────────────┐
│ Step 1 : Landing Page (Norva.fr)             │
│ Hero : "Détectez les clients à risque avant    │
│         qu'il ne soit trop tard"                │
│ CTA : [Essayer gratuitement] → /signup         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Step 2 : Sign Up                                │
│ Email + Password                                │
│ Email confirmation → /onboarding                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Step 3 : Connect Outlook (OAuth)                │
│ [Connecter Outlook] → Microsoft login           │
│ → /onboarding/periode                           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Step 4 : Choisir période (30j par défaut)       │
│ [Analyser mes emails] → /onboarding/clients     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Step 5 : Valider clients détectés               │
│ 12 clients trouvés, user coche/décoche          │
│ [Valider] → Background job + /dashboard         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Step 6 : Dashboard (Analyse en cours...)        │
│ Progress bar + "2 min restantes"                │
│ Auto-refresh → Analyse terminée                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Step 7 : Dashboard complet                      │
│ ⚠ "2 clients à risque détectés"                 │
│ Liste clients avec scores                       │
│ [Voir détails] → /client/acme-corp              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Step 8 : Fiche client ACME Corp                 │
│ Score 32 - À risque                             │
│ Insights IA + Actions recommandées              │
│ 💡 AHA MOMENT : "Je n'avais pas vu ça !"        │
└─────────────────────────────────────────────────┘
```

**Temps total cible** : 5-7 minutes de l'inscription au premier insight

**Objectif** : User comprend la valeur en <10 min

---

### Flow 2 : Returning user (usage quotidien)

```json
Login (/login) → Dashboard
  ↓
Consulte filtre "À risque" (2 clients)
  ↓
Clique sur ACME Corp (score passé de 85 → 32)
  ↓
Lit insights IA :
  "Client ghosting détecté"
  "Ton devenu formel"
  "Budget évoqué 2 fois"
  ↓
Voit action recommandée : "Appeler aujourd'hui"
  ↓
Clique "Ouvrir dans Outlook" sur dernier thread
  ↓
Gère la situation dans Outlook
  ↓
Revient 1h plus tard → Score n'a pas encore changé
  (normal, sync 1x/jour en plan gratuit)
  ↓
Lendemain : Score updated (32 → 45)
  ↓
Confiance renforcée dans l'outil
```

**Usage typique** : 3-5 min/matin pour check

**Objectif** : Rituel quotidien comme "ouvrir son CRM"

---

## 1.5 Règles métier (Business Logic)

### Calcul Health Score (Détaillé)

**Formule** : Score = Engagement (40) + Sentiment (30) + Résolution (20) + Lifecycle (10)

```python
def calculate_health_score(client_id: str, period_days: int = 30) -> int:
    """
    Calcule le health score d'un client (0-100)
    Plus le score est élevé, meilleure est la relation
    
    Args:
        client_id: ID du client
        period_days: Période d'analyse (défaut 30j)
    
    Returns:
        Score entre 0 et 100
    """
    
    # 1. ENGAGEMENT (40 pts max)
    engagement_score = calculate_engagement(client_id, period_days)
    
    # 2. SENTIMENT (30 pts max)
    sentiment_score = calculate_sentiment(client_id, period_days)
    
    # 3. RÉSOLUTION (20 pts max)
    resolution_score = calculate_resolution(client_id)
    
    # 4. LIFECYCLE (10 pts max)
    lifecycle_score = calculate_lifecycle(client_id)
    
    total = engagement_score + sentiment_score + resolution_score + lifecycle_score
    
    # Clamp entre 0 et 100
    return max(0, min(100, total))
```

### 1. Engagement Score (40 pts)

```python
def calculate_engagement(client_id: str, period_days: int) -> float:
    """
    Mesure l'engagement du client dans les échanges
    """
    
    # Récupérer emails de la période
    emails = get_client_emails(client_id, days=period_days)
    
    if len(emails) == 0:
        return 0  # Aucun échange = 0 pts
    
    # --- Fréquence d'échanges (15 pts max) ---
    # Comparer à la baseline (moyenne mobile des 90 derniers jours)
    baseline_freq = get_baseline_frequency(client_id, days=90)
    current_freq = len(emails)
    
    if baseline_freq == 0:
        # Premier calcul, pas de baseline
        frequency_score = 15 if current_freq > 5 else (current_freq / 5) * 15
    else:
        ratio = current_freq / baseline_freq
        
        if ratio >= 1.2:
            frequency_score = 15  # +20% d'engagement
        elif ratio >= 0.8:
            frequency_score = 12  # Normal
        elif ratio >= 0.5:
            frequency_score = 7   # -50% = déclin
        else:
            frequency_score = 0   # Ghosting
    
    # --- Temps de réponse du client (10 pts max) ---
    # Mesure combien de temps le client met à répondre
    response_times = []
    
    for email in emails:
        if email.sender == 'client':
            # Trouver l'email précédent de nous
            prev_email = get_previous_email(email, sender='us')
            if prev_email:
                response_time_hours = (email.timestamp - prev_email.timestamp).total_seconds() / 3600
                response_times.append(response_time_hours)
    
    if len(response_times) == 0:
        response_score = 5  # Pas de réponse = neutre
    else:
        avg_response_hours = sum(response_times) / len(response_times)
        
        if avg_response_hours < 4:
            response_score = 10  # Très réactif
        elif avg_response_hours < 24:
            response_score = 7   # Bon
        elif avg_response_hours < 48:
            response_score = 3   # Lent
        else:
            response_score = 0   # Très lent
    
    # --- Initiative client (10 pts max) ---
    # Combien de threads initiés par le client ?
    threads = group_emails_by_thread(emails)
    client_initiated = sum(1 for t in threads if t[0].sender == 'client')
    total_threads = len(threads)
    
    if total_threads == 0:
        initiative_score = 0
    else:
        initiative_ratio = client_initiated / total_threads
        initiative_score = min(10, initiative_ratio * 20)
    
    # --- Longueur emails client (5 pts max) ---
    # Emails plus longs = plus engagé
    client_emails = [e for e in emails if e.sender == 'client']
    
    if len(client_emails) == 0:
        length_score = 0
    else:
        avg_length = sum(len(e.body) for e in client_emails) / len(client_emails)
        
        if avg_length > 500:  # Emails détaillés
            length_score = 5
        elif avg_length > 200:
            length_score = 3
        else:
            length_score = 1  # Emails très courts
    
    return frequency_score + response_score + initiative_score + length_score
```

### **2. Sentiment Score (30 pts)**

```python
def calculate_sentiment(client_id: str, period_days: int) -> float:
    """
    Analyse le sentiment des emails client avec Claude
    """
    
    # Récupérer derniers emails du client (max 10)
    client_emails = get_client_emails(
        client_id, 
        sender='client', 
        limit=10,
        days=period_days
    )
    
    if len(client_emails) == 0:
        return 15  # Neutre par défaut
    
    # --- Appel Claude pour analyse sentiment ---
    prompt = f"""
Analyse le sentiment de ces emails d'un client.

Pour chaque email, classifie le sentiment :
- positive (+1) : ton amical, enthousiaste, satisfait
- neutral (0) : professionnel, factuel
- negative (-1) : frustré, déçu, formel/distant

Détecte aussi la tendance : improving, stable, degrading

Emails :
{format_emails_for_claude(client_emails)}

Réponds UNIQUEMENT en JSON :
{{
  "sentiments": [1, 0, -1, ...],
  "trend": "improving|stable|degrading",
  "key_concerns": ["budget", "délais", ...]
}}
"""
    
    response = call_claude_api(prompt, max_tokens=500)
    analysis = json.loads(response)
    
    # --- Calcul score moyen (20 pts max) ---
    sentiments = analysis['sentiments']
    avg_sentiment = sum(sentiments) / len(sentiments)
    
    # Mapper [-1, 1] vers [0, 20]
    sentiment_score = (avg_sentiment + 1) * 10
    
    # --- Bonus/malus tendance (±10 pts) ---
    trend = analysis['trend']
    
    if trend == 'improving':
        trend_score = 10
    elif trend == 'degrading':
        trend_score = -10
    else:
        trend_score = 0
    
    # Stocker key_concerns en DB pour affichage insights
    save_key_concerns(client_id, analysis['key_concerns'])
    
    total = sentiment_score + trend_score
    return max(0, min(30, total))
```

### **3. Résolution Score (20 pts)**

```python
def calculate_resolution(client_id: str) -> float:
    """
    Mesure si les questions/problèmes sont résolus
    """
    
    threads = get_client_threads(client_id, days=30)
    
    # --- Questions sans réponse (10 pts max) ---
    unanswered_questions = 0
    
    for thread in threads:
        last_message = thread[-1]
        
        # Si dernier message = client + contient question
        if last_message.sender == 'client' and is_question(last_message.body):
            # Vérifier si on a répondu après
            has_response = any(
                msg.sender == 'us' and msg.timestamp > last_message.timestamp 
                for msg in thread
            )
            
            if not has_response:
                unanswered_questions += 1
    
    # Pénaliser chaque question non répondue
    question_score = max(0, 10 - (unanswered_questions * 3))
    
    # --- Escalades (10 pts max) ---
    # Détecter mots-clés escalade
    escalation_keywords = [
        'urgent', 'manager', 'escalade', 'insatisfait', 
        'déçu', 'problème grave', 'inacceptable'
    ]
    
    escalations = 0
    
    for thread in threads:
        for email in thread:
            if email.sender == 'client':
                body_lower = email.body.lower()
                if any(keyword in body_lower for keyword in escalation_keywords):
                    escalations += 1
                    break  # 1 seule escalation par thread
    
    escalation_score = max(0, 10 - (escalations * 5))
    
    return question_score + escalation_score

def is_question(text: str) -> bool:
    """Détecte si un email contient une question"""
    # Simple heuristique
    question_markers = ['?', 'comment', 'pourquoi', 'quand', 'pouvez-vous']
    return any(marker in text.lower() for marker in question_markers)
```

### **4. Lifecycle Score (10 pts)**

```python
def calculate_lifecycle(client_id: str) -> float:
    """
    Score basé sur phase du contrat
    (POC : simplifié, juste ancienneté)
    """
    
    client = get_client(client_id)
    
    # Calculer ancienneté relation (date premier email)
    first_email_date = get_first_email_date(client_id)
    
    if not first_email_date:
        return 5  # Nouveau client = neutre
    
    days_active = (datetime.now() - first_email_date).days
    
    # Période critique : premiers 90 jours
    if days_active < 30:
        lifecycle_score = 5  # Onboarding
    elif days_active < 90:
        lifecycle_score = 7  # Établissement relation
    elif days_active < 365:
        lifecycle_score = 10  # Relation établie
    else:
        lifecycle_score = 10  # Client mature
    
    # TODO Itération 2 : Intégrer date de renouvellement contrat
    # Si contrat proche expiration → baisser score
    
    return lifecycle_score
```

### **Génération Insights IA**

```python
def generate_insights(client_id: str, health_score: int) -> List[Insight]:
    """
    Génère les insights affichés sur la fiche client
    Utilise Claude pour analyse qualitative
    """
    
    client = get_client(client_id)
    emails = get_client_emails(client_id, days=30, limit=20)
    threads = group_emails_by_thread(emails)
    
    # Préparer contexte pour Claude
    context = {
        'client_name': client.name,
        'health_score': health_score,
        'email_count': len(emails),
        'thread_count': len(threads),
        'score_components': {
            'engagement': calculate_engagement(client_id, 30),
            'sentiment': calculate_sentiment(client_id, 30),
            'resolution': calculate_resolution(client_id),
            'lifecycle': calculate_lifecycle(client_id)
        },
        'recent_emails_summary': summarize_recent_emails(emails[:5])
    }
    
    prompt = f"""
Tu es un expert Customer Success. Analyse cette situation client et génère des insights actionnables.

Contexte :
- Client : {context['client_name']}
- Health Score : {context['health_score']}/100
- {context['email_count']} emails sur 30 jours
- Scores détaillés :
  * Engagement : {context['score_components']['engagement']}/40
  * Sentiment : {context['score_components']['sentiment']}/30
  * Résolution : {context['score_components']['resolution']}/20
  * Lifecycle : {context['score_components']['lifecycle']}/10

Derniers emails :
{context['recent_emails_summary']}

Génère 3 à 6 insights maximum, classés par priorité.
Chaque insight doit être :
- Concret et basé sur les données
- Actionnable
- Formulé clairement (max 15 mots)

Format JSON uniquement :
{{
  "insights": [
    {{
      "type": "warning|info|success",
      "text": "Temps de réponse dégradé : 4h → 2 jours",
      "priority": 1
    }},
    ...
  ],
  "recommended_actions": [
    "Appeler aujourd'hui - Check-in urgent",
    "Répondre aux 2 questions en suspens",
    ...
  ]
}}
"""
    
    response = call_claude_api(prompt, max_tokens=800)
    analysis = json.loads(response)
    
    # Sauvegarder en DB
    save_insights(client_id, analysis['insights'])
    save_recommended_actions(client_id, analysis['recommended_actions'])
    
    return analysis['insights']
```

## 1.6 Contraintes & Limitations MVP (POC)

### Limitations techniques POC

**Volumétrie stricte** :

- ✅ Max **20 clients** par user
- ✅ Max **30 jours** d'historique analysé au setup
- ✅ Max **1000 emails** analysés au total (guard rails)
- ✅ Sync **1x/jour** (cron job à 6h du matin)
- ✅ Refresh manuel : **1x/6h max** par client

**Performance** :

- Analyse initiale : <5min pour 20 clients × 50 emails = 1000 emails
- Dashboard load : <500ms (cache Redis)
- Client detail : <300ms

**Stockage** :

- Pas de stockage body emails complet (RGPD + coût)
- Stocker uniquement : metadata + summary généré par IA
- Retention : 90 jours max (configurable)

### Limitations fonctionnelles POC

**Out of scope Itération 1** :

- ❌ Support Gmail (Outlook uniquement)
- ❌ Multi-langue (Français uniquement)
- ❌ Mobile app (responsive web desktop-first)
- ❌ Team features (1 user = 1 compte)
- ❌ Intégrations CRM
- ❌ Calendar sync
- ❌ Notifications (email/Slack/Teams)
- ❌ Génération templates emails
- ❌ Rapports PDF
- ❌ API publique
- ❌ Import CSV clients
- ❌ Webhooks

**Inclus dans POC** :

- ✅ Connexion Outlook OAuth
- ✅ Analyse période 7/30/90 jours
- ✅ Détection + validation clients (max 20)
- ✅ Dashboard liste clients avec scores
- ✅ Fiche client détaillée (insights IA + timeline)
- ✅ Filtres et recherche
- ✅ Settings basiques (profil, reconnexion Outlook)
- ✅ Pricing 3 tiers (Gratuit/Starter/Pro)
- ✅ Paiement Stripe

---

## 1.7 Critères de succès POC

**Métriques produit** :

- [ ]  5 beta testers activés
- [ ]  >80% complètent l'onboarding (<10min)
- [ ]  >60% reviennent J+1 (daily habit)
- [ ]  1+ insight "wow" par user (feedback qualitatif)
- [ ]  2+ conversions payantes (Starter plan minimum)

**Métriques techniques** :

- [ ]  Uptime >99% (Vercel monitoring)
- [ ]  Analyse initiale <5min (95th percentile)
- [ ]  Dashboard load <500ms (p95)
- [ ]  0 erreur critique (Sentry)
- [ ]  Score Lighthouse >90 (performance)

**Métriques business** :

- [ ]  CAC <100€ (acquisition organique via réseau associé)
- [ ]  Churn <10% M1 (si payant activé)
- [ ]  NPS >40 (survey post-onboarding J+7)

---

## 1.8 Roadmap post-POC (Itération 2 & 3)

### Itération 2 : Team Features (pour RDAV, Head of CS)

**Epic : Dashboard équipe**

- Multi-langue (EN, ES, DE)
- Vue agrégée : 120 clients répartis sur 4 CSM
- Leaderboard : Quel CSM a le meilleur portfolio health ?
- Alertes : Clients à risque non traités depuis >48h
- Guidelines : Temps de réponse cible, tone of voice
- Analytics équipe : Temps de réponse moyen, volume traité

**US additionnelles** :

- Inviter membres équipe
- Assigner clients à CSM
- Commentaires internes sur clients
- Activity log (qui a fait quoi)

**Effort estimé** : 3-4 semaines

---

### Itération 3 : Productivité CSM

**Epic : Task management intégré**

- To-do générée automatiquement depuis insights
- "3 clients à appeler aujourd'hui" (priorisation IA)
- Checkbox pour marquer actions done
- Intégration Outlook Calendar (suggest meetings)

**Epic : Génération contenu**

- Templates emails contextuels
- Génération compte-rendu réunion (si transcript fourni)
- Suggestions de follow-up personnalisées

**Effort estimé** : 3-4 semaines

---

### Itération 4+ : Expansion

- Support Gmail
- Intégrations CRM (Salesforce, HubSpot, Pipedrive)
- Mobile app (React Native)
- Notifications multi-canal (email, Slack, Teams, SMS)
- Rapports PDF automatiques (weekly/monthly)
- API publique (webhook sur score change)

# 2️⃣ ARCHITECTURE TECHNIQUE

## **2.1 Vue d'ensemble système**

### **Architecture Haut Niveau**

```python
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js 15 (App Router) + React 19 + TypeScript           │
│  Deployment: Vercel (EU region - Frankfurt)                 │
│                                                              │
│  - /app/dashboard          (Liste clients)                  │
│  - /app/client/[slug]      (Fiche détaillée)               │
│  - /app/onboarding         (Setup)                          │
│  - /app/settings           (Config user)                    │
└──────────────────┬──────────────────────────────────────────┘
                   │ tRPC (type-safe API)
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (API Routes)                      │
│  Next.js API Routes + tRPC Server                           │
│                                                              │
│  Endpoints:                                                  │
│  - /api/trpc/*             (tRPC router)                    │
│  - /api/webhooks/stripe    (Stripe webhooks)               │
│  - /api/cron/sync-emails   (Vercel Cron)                   │
└────┬─────────────┬──────────────┬─────────────┬────────────┘
     │             │              │             │
     ↓             ↓              ↓             ↓
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Supabase│  │  Nylas   │  │ Anthropic│  │  Stripe  │
│  (DB)   │  │  (Email) │  │ (Claude) │  │(Billing) │
└─────────┘  └──────────┘  └──────────┘  └──────────┘
     │
     ↓
┌─────────────────────────────────────────────────────────────┐
│                   JOB QUEUE (Inngest)                        │
│  - analyze-client      (Analyse emails + scoring)           │
│  - sync-emails         (Fetch nouveaux emails)              │
│  - compute-daily-scores (Cron journalier)                   │
└─────────────────────────────────────────────────────────────┘
```

## 2.2 Stack Technique Détaillée

### Choix Stack (optimisé pour Claude Code)

```python
FRONTEND:
├─ Next.js 15.0+           // Framework full-stack
├─ React 19                // UI library
├─ TypeScript 5.3+         // Type safety (CRITIQUE pour Claude Code)
├─ Tailwind CSS 3.4+       // Styling utility-first
├─ shadcn/ui               // Composants UI premium
├─ Zustand                 // State management (+ simple que Redux)
├─ TanStack Query v5       // Data fetching & caching
├─ Recharts                // Charts (health score evolution)
└─ date-fns                // Date manipulation (locale FR)

BACKEND:
├─ tRPC v11                // Type-safe API (TypeScript end-to-end)
├─ Zod                     // Schema validation
├─ Prisma 5.x              // ORM (génération types auto)
└─ Inngest                 // Job queue serverless

AUTH & EMAIL:
├─ Clerk                   // Auth (OAuth, user management)
├─ Nylas v3                // Email API (Outlook abstraction) 💰
└─ Resend                  // Transactional emails

DATABASE & STORAGE:
├─ Supabase (EU)           // PostgreSQL + Auth + Storage
│  ├─ PostgreSQL 15        
│  ├─ pgvector             // Vector embeddings (future: semantic search)
│  └─ Row Level Security   // RGPD by design
└─ Upstash Redis           // Cache + rate limiting

AI & ANALYTICS:
├─ Anthropic Claude API    // Analyse sentiment + insights
├─ OpenAI Embeddings       // text-embedding-3-small (cheap)
├─ Sentry                  // Error monitoring
└─ Vercel Analytics        // Web vitals

PAYMENTS:
└─ Stripe                  // Subscriptions + billing

DEPLOYMENT:
├─ Vercel (EU region)      // Hosting + serverless functions
├─ GitHub Actions          // CI/CD
└─ Vercel Cron             // Scheduled jobs
```

### Justification : Pourquoi Nylas ? 💰

**Problème OAuth Outlook DIY** :

- Microsoft Graph API = complexe (MSAL.js, token refresh, scopes)
- Webhook setup manuel (ngrok en dev, certificats SSL)
- Gestion pagination, rate limits, erreurs
- Support multi-tenant (future)
- **Effort estimé DIY** : 5-7 jours dev + maintenance continue

**Solution Nylas** :

- Abstraction complète OAuth (1 endpoint)
- Webhook automatique (nouveaux emails)
- SDK bien documenté (compatible Claude Code)
- Support Outlook + Gmail (futur)
- **Coût** : $9/mailbox/mois (plan Starter)
- **ROI** : User paie 49€/mois, coût Nylas 9€ → Marge 40€ OK

**Calcul rentabilité** :

```python
Scenario 20 users payants (Starter @ 49€/mois) :
Revenus :    20 × 49€ = 980€/mois
Coûts Nylas: 20 × 9€  = 180€/mois
Marge brute:           800€/mois (82%)

Coût opportunité dev DIY :
7 jours × 500€/jour = 3,500€
Amortissement : 3,500€ / 40€ économisé par user = 88 users
→ Nylas rentable jusqu'à ~80-100 users
```

**Alternative low-cost (Phase 2 si scaling)** :

- Développer OAuth direct après 100 users
- Migration progressive (feature flag)
- Keep Nylas pour onboarding (simplicité)

---

## 2.3 Diagrammes Architecture

### 2.3.1 Diagramme de Séquence : Onboarding Complet

```python
User          Frontend       Backend        Nylas        Supabase      Inngest       Claude
 │                │             │             │              │            │            │
 │─── Sign up ───→│             │             │              │            │            │
 │                │─ POST /api/auth ─────────→│              │            │            │
 │                │←──── token ────────────────│              │            │            │
 │                │── INSERT user ────────────→│              │            │            │
 │                │←──── user_id ───────────────│              │            │            │
 │                │                             │              │            │            │
 │← Redirect to                                │              │            │            │
 │  /onboarding  │                             │              │            │            │
 │                │                             │              │            │            │
 │─ Connect ─────→│                             │              │            │            │
 │  Outlook       │─ GET /api/oauth/nylas ────→│              │            │            │
 │                │                             │─ OAuth URL ─→│            │            │
 │                │←──── redirect URL ──────────│              │            │            │
 │                │                             │              │            │            │
 │←─ Redirect to ─│                             │              │            │            │
 │   Microsoft    │                             │              │            │            │
 │   login        │                             │              │            │            │
 │                │                             │              │            │            │
 │─ Authorize ───→ Microsoft OAuth              │              │            │            │
 │                │                             │              │            │            │
 │←─ Callback ────┤                             │              │            │            │
 │                │─ POST /api/oauth/callback ─→│              │            │            │
 │                │                             │─ Exchange ──→│            │            │
 │                │                             │    code      │            │            │
 │                │                             │←─ tokens ────│            │            │
 │                │─ UPDATE user ──────────────→│              │            │            │
 │                │  (nylas_grant_id)           │              │            │            │
 │                │                             │              │            │            │
 │← Redirect to                                │              │            │            │
 │  /onboarding/periode                         │              │            │            │
 │                │                             │              │            │            │
 │─ Select 30d ──→│                             │              │            │            │
 │                │─ POST /api/emails/count ───→│              │            │            │
 │                │                             │─ Count ─────→│            │            │
 │                │                             │    emails    │            │            │
 │                │                             │←─ ~847 ──────│            │            │
 │                │←─── "847 emails" ───────────│              │            │            │
 │                │                             │              │            │            │
 │─ Analyze ─────→│                             │              │            │            │
 │                │─ POST /api/clients/detect ─→│              │            │            │
 │                │                             │─ Fetch ─────→│            │            │
 │                │                             │   emails     │            │            │
 │                │                             │←─ emails[] ──│            │            │
 │                │                             │              │            │            │
 │                │─ Detect clients (domain grouping) ────────→│            │            │
 │                │←─ clients[] ────────────────│              │            │            │
 │                │                             │              │            │            │
 │← Show clients  │                             │              │            │            │
 │  validation UI │                             │              │            │            │
 │                │                             │              │            │            │
 │─ Validate ────→│                             │              │            │            │
 │  (4 clients)   │─ POST /api/analysis/start ─→│              │            │            │
 │                │                             │── INSERT ───→│            │            │
 │                │                             │   clients    │            │            │
 │                │                             │              │            │            │
 │                │                             │─ Enqueue ───→│            │            │
 │                │                             │   jobs       │            │            │
 │                │                             │              │            │            │
 │← Redirect to                                │              │            │            │
 │  /dashboard    │                             │              │            │            │
 │  (analyzing)   │                             │              │            │            │
 │                │                             │              │            │            │
 │                │         [BACKGROUND JOBS START]            │            │            │
 │                │                             │              │     For each client:    │
 │                │                             │              │←─ analyze-client ───────│
 │                │                             │              │            │            │
 │                │                             │    Fetch client emails ───→│            │
 │                │                             │              │←─ emails[] ─│            │
 │                │                             │              │            │            │
 │                │                             │         Group by thread    │            │
 │                │                             │              │            │            │
 │                │                             │    Analyze sentiment ──────→│           │
 │                │                             │              │            │─ POST ────→│
 │                │                             │              │            │  /messages │
 │                │                             │              │            │            │
 │                │                             │              │            │← analysis ─│
 │                │                             │              │            │            │
 │                │                             │    Calculate score         │            │
 │                │                             │              │            │            │
 │                │                             │── UPDATE ───→│            │            │
 │                │                             │   client     │            │            │
 │                │                             │   (score,    │            │            │
 │                │                             │    insights) │            │            │
 │                │                             │              │            │            │
 │                │         [JOB COMPLETE - NOTIFY]           │            │            │
 │                │                             │              │            │            │
 │                │◄─── WebSocket: analysis_complete ─────────│            │            │
 │◄─ Toast: ──────┤                             │              │            │            │
 │  "Analyse      │                             │              │            │            │
 │   terminée"    │                             │              │            │            │
 │                │                             │              │            │            │
 │─ Refresh ─────→│─ GET /api/clients ─────────→│              │            │            │
 │                │                             │── SELECT ───→│            │            │
 │                │                             │   clients    │            │            │
 │                │←─── clients with scores ────│              │            │            │
 │                │                             │              │            │            │
 │← Dashboard     │                             │              │            │            │
 │  with scores   │                             │              │        
```

---

### 2.3.2 Diagramme Data Flow : Analyse Client

```python
                    ┌──────────────────────┐
                    │  CRON TRIGGER        │
                    │  (Daily 6am)         │
                    └──────────┬───────────┘
                               │
                               ↓
                    ┌──────────────────────┐
                    │  Inngest Job:        │
                    │  sync-all-clients    │
                    └──────────┬───────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ↓                             ↓
    ┌─────────────────────┐      ┌─────────────────────┐
    │  For each client    │      │   Parallel jobs     │
    │  (batched)          │      │   (max 5 concurrent)│
    └──────────┬──────────┘      └─────────────────────┘
               │
               ↓
    ┌─────────────────────────────────────────┐
    │  1. FETCH NEW EMAILS                    │
    │  ────────────────────────────────────   │
    │  Nylas API:                             │
    │  GET /messages?since=last_sync_date     │
    │                                         │
    │  Filters:                               │
    │  - from: client_domain OR to: us        │
    │  - limit: 100                           │
    │  - only unread: false                   │
    │                                         │
    │  Result: emails[] (metadata + body)     │
    └──────────┬──────────────────────────────┘
               │
               ↓
    ┌─────────────────────────────────────────┐
    │  2. FILTER & DEDUPE                     │
    │  ────────────────────────────────────   │
    │  - Remove duplicates (by message_id)    │
    │  - Exclude spam/auto-replies            │
    │  - Group by conversation thread         │
    │                                         │
    │  Result: threads[] (grouped emails)     │
    └──────────┬──────────────────────────────┘
               │
               ↓
    ┌─────────────────────────────────────────┐
    │  3. STORE RAW DATA                      │
    │  ────────────────────────────────────   │
    │  INSERT INTO emails (                   │
    │    client_id,                           │
    │    message_id,                          │
    │    subject,                             │
    │    from_email,                          │
    │    to_email,                            │
    │    sent_at,                             │
    │    body_preview,  ← Only first 500 chars│
    │    thread_id                            │
    │  )                                      │
    │                                         │
    │  Note: Pas de stockage body complet     │
    │        (RGPD + coût)                    │
    └──────────┬──────────────────────────────┘
               │
               ↓
    ┌─────────────────────────────────────────┐
    │  4. ANALYZE WITH CLAUDE                 │
    │  ────────────────────────────────────   │
    │  Batch: 10 threads max par call         │
    │                                         │
    │  Prompt Claude:                         │
    │  "Analyze sentiment of these threads:   │
    │   [thread1, thread2, ...]               │
    │                                         │
    │   Return JSON:                          │
    │   {                                     │
    │     sentiments: [1, -1, 0, ...],       │
    │     trend: 'improving',                 │
    │     key_concerns: ['budget', ...],      │
    │     unanswered_questions: 2             │
    │   }"                                    │
    │                                         │
    │  Cost optimization:                     │
    │  - Summarize long emails (>2000 chars) │
    │  - Reuse previous analysis if similar   │
    └──────────┬──────────────────────────────┘
               │
               ↓
    ┌─────────────────────────────────────────┐
    │  5. CALCULATE HEALTH SCORE              │
    │  ────────────────────────────────────   │
    │  compute_health_score(client_id):       │
    │                                         │
    │  engagement = calc_engagement()         │
    │  sentiment = calc_sentiment()           │
    │  resolution = calc_resolution()         │
    │  lifecycle = calc_lifecycle()           │
    │                                         │
    │  total_score = sum(components)          │
    │                                         │
    │  Result: score (0-100)                  │
    └──────────┬──────────────────────────────┘
               │
               ↓
    ┌─────────────────────────────────────────┐
    │  6. GENERATE INSIGHTS                   │
    │  ────────────────────────────────────   │
    │  Claude call #2 (if score changed >10): │
    │                                         │
    │  "Generate actionable insights for:     │
    │   Client: ACME Corp                     │
    │   Score: 32 (was 85)                    │
    │   Recent activity: [summary]            │
    │                                         │
    │   Format: 3-5 bullet points"            │
    │                                         │
    │  Result: insights[] (text + type)       │
    └──────────┬──────────────────────────────┘
               │
               ↓
    ┌─────────────────────────────────────────┐
    │  7. PERSIST RESULTS                     │
    │  ────────────────────────────────────   │
    │  UPDATE clients SET                     │
    │    health_score = 32,                   │
    │    last_analyzed_at = NOW(),            │
    │    updated_at = NOW()                   │
    │  WHERE id = client_id                   │
    │                                         │
    │  INSERT INTO client_health_history (    │
    │    client_id, score, recorded_at        │
    │  ) VALUES (client_id, 32, NOW())        │
    │                                         │
    │  INSERT INTO client_insights (          │
    │    client_id, insights_json, created_at │
    │  ) VALUES (client_id, [...], NOW())     │
    └──────────┬──────────────────────────────┘
               │
               ↓
    ┌─────────────────────────────────────────┐
    │  8. CHECK ALERTS                        │
    │  ────────────────────────────────────   │
    │  IF score < 50 AND previous_score > 60: │
    │    CREATE alert (type: 'at_risk')       │
    │    NOTIFY user (email, in-app)          │
    │                                         │
    │  IF unanswered_questions > 2:           │
    │    CREATE alert (type: 'unanswered')    │
    └──────────┬──────────────────────────────┘
               │
               ↓
    ┌─────────────────────────────────────────┐
    │  9. INVALIDATE CACHE                    │
    │  ────────────────────────────────────   │
    │  Redis DEL:                             │
    │  - dashboard:user:{user_id}             │
    │  - client:{client_id}                   │
    │                                         │
    │  Next.js revalidatePath('/dashboard')   │
    └──────────┬──────────────────────────────┘
               │
               ↓
    ┌─────────────────────────────────────────┐
    │  10. JOB COMPLETE                       │
    │  ────────────────────────────────────   │
    │  Log metrics:                           │
    │  - Duration: 47s                        │
    │  - Emails analyzed: 23                  │
    │  - Claude tokens: 12,450                │
    │  - Status: success                      │
    │                                         │
    │  Emit event: client_analyzed            │
    │  (triggers real-time UI update)         │
    └─────────────────────────────────────────┘
```

## 2.4 Schéma Base de Données

### Architecture Supabase (PostgreSQL)

```sql
-- ============================================
-- Norva DATABASE SCHEMA v1.0
-- PostgreSQL 15 + pgvector extension
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- TABLE: users
-- Utilisateurs de l'application
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Auth (géré par Clerk)
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  
  -- Email connection
  nylas_grant_id VARCHAR(255) UNIQUE, -- Nylas access token ref
  email_provider VARCHAR(20) CHECK (email_provider IN ('outlook', 'gmail')),
  email_sync_enabled BOOLEAN DEFAULT true,
  last_email_sync_at TIMESTAMPTZ,
  
  -- Subscription (Stripe)
  stripe_customer_id VARCHAR(255) UNIQUE,
  subscription_status VARCHAR(50) DEFAULT 'free' 
    CHECK (subscription_status IN ('free', 'starter', 'pro', 'enterprise', 'canceled')),
  subscription_current_period_end TIMESTAMPTZ,
  
  -- Limits (based on plan)
  max_clients INTEGER DEFAULT 5, -- free: 5, starter: 20, pro: 50
  max_emails_per_month INTEGER DEFAULT 500,
  emails_analyzed_this_month INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Indexes
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe ON users(stripe_customer_id);

-- Row Level Security (RGPD)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users
  FOR SELECT USING (clerk_user_id = auth.uid());

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (clerk_user_id = auth.uid());
```

```sql
-- ============================================
-- TABLE: clients
-- Clients analysés par utilisateur
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Client info
  name VARCHAR(255) NOT NULL, -- "ACME Corp"
  domain VARCHAR(255) NOT NULL, -- "acme.com"
  slug VARCHAR(255) NOT NULL, -- "acme-corp" (pour URL)
  contact_email VARCHAR(255), -- Email principal
  
  -- Health score
  health_score INTEGER DEFAULT NULL CHECK (health_score >= 0 AND health_score <= 100),
  score_components JSONB DEFAULT '{
    "engagement": 0,
    "sentiment": 0,
    "resolution": 0,
    "lifecycle": 0
  }'::jsonb,
  
  -- Analysis metadata
  first_email_date DATE, -- Date premier échange
  last_email_date DATE, -- Date dernier échange
  total_emails_count INTEGER DEFAULT 0,
  total_threads_count INTEGER DEFAULT 0,
  
  last_analyzed_at TIMESTAMPTZ,
  analysis_status VARCHAR(50) DEFAULT 'pending' 
    CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, domain) -- 1 client par domaine par user
);

-- Indexes
CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_clients_score ON clients(health_score DESC);
CREATE INDEX idx_clients_slug ON clients(slug);
CREATE INDEX idx_clients_status ON clients(analysis_status);

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_crud_own ON clients
  FOR ALL USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.uid()
  ));
```

```sql
-- ============================================
-- TABLE: emails
-- Emails stockés (metadata uniquement)
-- ============================================
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Email identifiers
  message_id VARCHAR(500) UNIQUE NOT NULL, -- Outlook/Gmail message ID
  thread_id VARCHAR(500), -- Conversation ID
  
  -- Email metadata
  subject TEXT,
  from_email VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  cc_emails TEXT[], -- Array d'emails en CC
  sent_at TIMESTAMPTZ NOT NULL,
  
  -- Body (preview uniquement pour RGPD)
  body_preview TEXT, -- Premier 500 chars
  body_length INTEGER, -- Longueur totale (pour stats)
  
  -- Analysis
  is_from_client BOOLEAN DEFAULT false, -- true si from = client
  is_question BOOLEAN DEFAULT false, -- Détecté par IA
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_emails_client ON emails(client_id);
CREATE INDEX idx_emails_thread ON emails(thread_id);
CREATE INDEX idx_emails_sent_at ON emails(sent_at DESC);
CREATE INDEX idx_emails_message_id ON emails(message_id);

-- RLS
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY emails_select_own ON emails
  FOR SELECT USING (client_id IN (
    SELECT id FROM clients WHERE user_id IN (
      SELECT id FROM users WHERE clerk_user_id = auth.uid()
    )
  ));
```

```sql
-- ============================================
-- TABLE: client_health_history
-- Historique des scores (pour graphe évolution)
-- ============================================
CREATE TABLE client_health_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  score_components JSONB,
  
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(client_id, recorded_at) -- 1 snapshot par jour
);

-- Indexes
CREATE INDEX idx_health_history_client ON client_health_history(client_id);
CREATE INDEX idx_health_history_date ON client_health_history(recorded_at DESC);

-- RLS
ALTER TABLE client_health_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY health_history_select_own ON client_health_history
  FOR SELECT USING (client_id IN (
    SELECT id FROM clients WHERE user_id IN (
      SELECT id FROM users WHERE clerk_user_id = auth.uid()
    )
  ));
```

```sql
-- ============================================
-- TABLE: client_insights
-- Insights générés par IA
-- ============================================
CREATE TABLE client_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Insights data
  insights_json JSONB NOT NULL,
  -- Structure:
  -- {
  --   "insights": [
  --     {"type": "warning", "text": "...", "priority": 1},
  --     {"type": "info", "text": "...", "priority": 2}
  --   ],
  --   "recommended_actions": [
  --     "Appeler aujourd'hui",
  --     "Répondre aux questions"
  --   ],
  --   "key_concerns": ["budget", "délais"]
  -- }
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days') -- Auto-cleanup
);

-- Indexes
CREATE INDEX idx_insights_client ON client_insights(client_id);
CREATE INDEX idx_insights_created ON client_insights(created_at DESC);
CREATE INDEX idx_insights_expires ON client_insights(expires_at);

-- RLS
ALTER TABLE client_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY insights_select_own ON client_insights
  FOR SELECT USING (client_id IN (
    SELECT id FROM clients WHERE user_id IN (
      SELECT id FROM users WHERE clerk_user_id = auth.uid()
    )
  ));
```

```sql
-- ============================================
-- TABLE: analysis_jobs
-- Tracking des jobs d'analyse
-- ============================================
CREATE TABLE analysis_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Job info
  job_type VARCHAR(50) NOT NULL 
    CHECK (job_type IN ('initial_analysis', 'sync', 'manual_refresh')),
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  
  -- Progress tracking
  total_emails INTEGER DEFAULT 0,
  processed_emails INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Results
  result_summary JSONB,
  error_message TEXT,
  
  -- Performance metrics
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  claude_tokens_used INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_user ON analysis_jobs(user_id);
CREATE INDEX idx_jobs_client ON analysis_jobs(client_id);
CREATE INDEX idx_jobs_status ON analysis_jobs(status);
CREATE INDEX idx_jobs_created ON analysis_jobs(created_at DESC);

-- RLS
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_select_own ON analysis_jobs
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.uid()
  ));

-- ============================================
-- TABLE: alerts
-- Alertes utilisateur (clients à risque, etc.)
-- ============================================
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Alert info
  type VARCHAR(50) NOT NULL 
    CHECK (type IN ('at_risk', 'score_dropped', 'unanswered_questions', 'ghosting')),
  severity VARCHAR(20) DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  title VARCHAR(255) NOT NULL,
  message TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_client ON alerts(client_id);
CREATE INDEX idx_alerts_unread ON alerts(user_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY alerts_crud_own ON alerts
  FOR ALL USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.uid()
  ));

-- ============================================
-- TABLE: audit_logs
-- Logs d'accès (RGPD compliance)
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Event info
  event_type VARCHAR(100) NOT NULL, -- "email_accessed", "client_viewed", etc.
  resource_type VARCHAR(50), -- "email", "client", "user"
  resource_id UUID,
  
  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_event ON audit_logs(event_type);

-- Partition par mois (pour perfs sur gros volumes)
-- TODO: Setup partitioning après MVP

```

```sql
-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Increment emails_analyzed_this_month
CREATE OR REPLACE FUNCTION increment_email_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET emails_analyzed_this_month = emails_analyzed_this_month + 1
  WHERE id = (SELECT user_id FROM clients WHERE id = NEW.client_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emails_count_trigger
  AFTER INSERT ON emails
  FOR EACH ROW EXECUTE FUNCTION increment_email_count();

-- Function: Auto-create health_history snapshot
CREATE OR REPLACE FUNCTION snapshot_health_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.health_score IS DISTINCT FROM OLD.health_score THEN
    INSERT INTO client_health_history (client_id, score, score_components, recorded_at)
    VALUES (NEW.id, NEW.health_score, NEW.score_components, NOW())
    ON CONFLICT (client_id, recorded_at) DO UPDATE
    SET score = NEW.health_score, score_components = NEW.score_components;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_health_snapshot
  AFTER UPDATE OF health_score ON clients
  FOR EACH ROW EXECUTE FUNCTION snapshot_health_score();

-- ============================================
-- VIEWS (pour simplifier queries fréquentes)
-- ============================================

-- View: Dashboard client list
CREATE VIEW v_dashboard_clients AS
SELECT 
  c.id,
  c.user_id,
  c.name,
  c.domain,
  c.slug,
  c.health_score,
  c.last_email_date,
  c.total_emails_count,
  c.analysis_status,
  c.last_analyzed_at,
  -- Risk level
  CASE 
    WHEN c.health_score IS NULL THEN 'unknown'
    WHEN c.health_score < 50 THEN 'at_risk'
    WHEN c.health_score < 80 THEN 'stable'
    ELSE 'healthy'
  END as risk_level,
  -- Last contact (human-readable)
  CASE
    WHEN c.last_email_date IS NULL THEN 'Jamais'
    WHEN c.last_email_date = CURRENT_DATE THEN 'Aujourd''hui'
    WHEN c.last_email_date = CURRENT_DATE - 1 THEN 'Hier'
    WHEN c.last_email_date > CURRENT_DATE - 7 THEN 'Il y a ' || (CURRENT_DATE - c.last_email_date) || ' jours'
    ELSE 'Il y a ' || (CURRENT_DATE - c.last_email_date) || ' jours'
  END as last_contact_label
FROM clients c
WHERE c.user_id IN (SELECT id FROM users WHERE deleted_at IS NULL);

-- ============================================
-- INITIAL DATA (optional)
-- ============================================

-- Seed example user (for dev)
-- INSERT INTO users (clerk_user_id, email, first_name, last_name, subscription_status, max_clients)
-- VALUES ('user_dev_123', 'dev@Norva.fr', 'Dev', 'User', 'pro', 50);

-- ============================================
-- CLEANUP JOBS (Supabase cron extension)
-- ============================================

-- Delete expired insights (>90 days)
-- SELECT cron.schedule('cleanup-old-insights', '0 2 * * *', 
--   'DELETE FROM client_insights WHERE expires_at < NOW()');

-- Delete expired alerts (>30 days)
-- SELECT cron.schedule('cleanup-old-alerts', '0 2 * * *',
--   'DELETE FROM alerts WHERE expires_at < NOW()');

-- Reset monthly email counter (1st of month)
-- SELECT cron.schedule('reset-email-counter', '0 0 1 * *',
--   'UPDATE users SET emails_analyzed_this_month = 0');
```

---

### Relations & Cardinalités

```sql
users (1) ──────< (N) clients
  │
  └──────< (N) analysis_jobs
  │
  └──────< (N) alerts

clients (1) ──────< (N) emails
   │
   ├──────< (N) client_health_history
   │
   ├──────< (N) client_insights
   │
   └──────< (N) alerts

emails (N) ────── (1) thread_id (grouping logique)
```

## 2.5 API Endpoints (tRPC)

### Structure tRPC Router

```tsx
// src/server/trpc/router.ts

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from './trpc';

// ============================================
// AUTH ROUTER
// ============================================
export const authRouter = createTRPCRouter({
  // Get current user
  me: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerk_user_id: ctx.userId },
        include: {
          _count: {
            select: { clients: true }
          }
        }
      });
      
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
      
      return user;
    }),
  
  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      avatar_url: z.string().url().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: { clerk_user_id: ctx.userId },
        data: input
      });
    })
});

// ============================================
// OAUTH ROUTER (Nylas)
// ============================================
export const oauthRouter = createTRPCRouter({
  // Get Nylas OAuth URL
  getNylasAuthUrl: protectedProcedure
    .input(z.object({
      provider: z.enum(['outlook', 'gmail'])
    }))
    .mutation(async ({ ctx, input }) => {
      const config = {
        clientId: process.env.NYLAS_CLIENT_ID!,
        redirectUri: `${process.env.NEXT_PUBLIC_URL}/api/oauth/callback`,
        provider: input.provider
      };
      
      const authUrl = `https://api.us.nylas.com/v3/connect/auth?` +
        `client_id=${config.clientId}&` +
        `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
        `response_type=code&` +
        `provider=${input.provider}&` +
        `scope=email.read_only&` +
        `state=${ctx.userId}`; // State = user ID pour callback
      
      return { authUrl };
    }),
  
  // Check if user has connected email
  getConnectionStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerk_user_id: ctx.userId },
        select: { 
          nylas_grant_id: true, 
          email_provider: true,
          last_email_sync_at: true 
        }
      });
      
      return {
        isConnected: !!user?.nylas_grant_id,
        provider: user?.email_provider,
        lastSync: user?.last_email_sync_at
      };
    })
});

// ============================================
// CLIENTS ROUTER
// ============================================
export const clientsRouter = createTRPCRouter({
  // List all clients for user
  list: protectedProcedure
    .input(z.object({
      filter: z.enum(['all', 'at_risk', 'stable', 'healthy']).optional(),
      sortBy: z.enum(['score', 'last_contact', 'name']).default('score'),
      search: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const user = await getUserFromContext(ctx);
      
      const whereClause: any = {
        user_id: user.id,
        analysis_status: 'completed'
      };
      
      // Filter by risk level
      if (input.filter && input.filter !== 'all') {
        const scoreRanges = {
          at_risk: { lt: 50 },
          stable: { gte: 50, lt: 80 },
          healthy: { gte: 80 }
        };
        whereClause.health_score = scoreRanges[input.filter];
      }
      
      // Search by name or domain
      if (input.search) {
        whereClause.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { domain: { contains: input.search, mode: 'insensitive' } }
        ];
      }
      
      // Sort
      const orderBy = {
        score: { health_score: 'asc' } as const,
        last_contact: { last_email_date: 'desc' } as const,
        name: { name: 'asc' } as const
      }[input.sortBy];
      
      const clients = await ctx.db.client.findMany({
        where: whereClause,
        orderBy,
        include: {
          _count: {
            select: { emails: true }
          }
        }
      });
      
      return clients;
    }),
  
  // Get single client details
  get: protectedProcedure
    .input(z.object({
      slug: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const user = await getUserFromContext(ctx);
      
      const client = await ctx.db.client.findFirst({
        where: {
          slug: input.slug,
          user_id: user.id
        },
        include: {
          health_history: {
            orderBy: { recorded_at: 'desc' },
            take: 30 // Last 30 days
          },
          insights: {
            orderBy: { created_at: 'desc' },
            take: 1 // Latest insights
          },
          emails: {
            orderBy: { sent_at: 'desc' },
            take: 20, // Recent conversations
            select: {
              id: true,
              subject: true,
              from_email: true,
              to_email: true,
              sent_at: true,
              thread_id: true,
              body_preview: true,
              is_from_client: true,
              sentiment: true
            }
          }
        }
      });
      
      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }
      
      // Group emails by thread
      const threads = groupEmailsByThread(client.emails);
      
      return {
        ...client,
        emails: undefined,
        threads
      };
    }),
  
  // Detect clients from emails
  detectClients: protectedProcedure
    .input(z.object({
      periodDays: z.number().min(7).max(90)
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromContext(ctx);
      
      // Check if Nylas connected
      if (!user.nylas_grant_id) {
        throw new TRPCError({ 
          code: 'PRECONDITION_FAILED', 
          message: 'Email not connected' 
        });
      }
      
      // Fetch emails from Nylas
      const since = new Date();
      since.setDate(since.getDate() - input.periodDays);
      
      const nylasEmails = await fetchNylasEmails(user.nylas_grant_id, {
        limit: 1000,
        receivedAfter: Math.floor(since.getTime() / 1000)
      });
      
      // Detect clients by domain grouping
      const detectedClients = await detectClientsFromEmails(nylasEmails);
      
      return {
        clients: detectedClients,
        totalEmails: nylasEmails.length
      };
    }),
  
  // Validate and create clients
  createClients: protectedProcedure
    .input(z.object({
      clients: z.array(z.object({
        name: z.string(),
        domain: z.string(),
        contact_email: z.string().email().optional()
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromContext(ctx);
      
      // Check limit
      const existingCount = await ctx.db.client.count({
        where: { user_id: user.id }
      });
      
      if (existingCount + input.clients.length > user.max_clients) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Limite de ${user.max_clients} clients atteinte. Upgrader votre plan.`
        });
      }
      
      // Create clients
      const created = await ctx.db.client.createMany({
        data: input.clients.map(c => ({
          ...c,
          user_id: user.id,
          slug: slugify(c.name),
          analysis_status: 'pending'
        }))
      });
      
      // Trigger analysis jobs
      const clients = await ctx.db.client.findMany({
        where: { 
          user_id: user.id,
          domain: { in: input.clients.map(c => c.domain) }
        }
      });
      
      for (const client of clients) {
        await inngest.send({
          name: 'client.analyze',
          data: { clientId: client.id, type: 'initial' }
        });
      }
      
      return { count: created.count, clients };
    }),
  
  // Manually refresh client analysis
  refreshAnalysis: protectedProcedure
    .input(z.object({
      clientId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromContext(ctx);
      
      const client = await ctx.db.client.findFirst({
        where: { id: input.clientId, user_id: user.id }
      });
      
      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      // Check rate limit (6h between refreshes)
      if (client.last_analyzed_at) {
        const hoursSinceLastAnalysis = 
          (Date.now() - client.last_analyzed_at.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastAnalysis < 6) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Prochaine analyse possible dans ${Math.ceil(6 - hoursSinceLastAnalysis)}h`
          });
        }
      }
      
      // Trigger job
      await inngest.send({
        name: 'client.analyze',
        data: { clientId: client.id, type: 'manual_refresh' }
      });
      
      return { status: 'queued' };
    })
});

// ============================================
// ANALYSIS ROUTER
// ============================================
export const analysisRouter = createTRPCRouter({
  // Get analysis job status
  getJobStatus: protectedProcedure
    .input(z.object({
      jobId: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.analysis_job.findUnique({
        where: { id: input.jobId },
        include: {
          client: {
            select: { name: true }
          }
        }
      });
      
      if (!job) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      return job;
    }),
  
  // List user's jobs
  listJobs: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await getUserFromContext(ctx);
      
      return await ctx.db.analysis_job.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        take: 20,
        include: {
          client: {
            select: { name: true }
          }
        }
      });
    })
});

// ============================================
// ALERTS ROUTER
// ============================================
export const alertsRouter = createTRPCRouter({
  // Get unread alerts
  getUnread: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await getUserFromContext(ctx);
      
      return await ctx.db.alert.findMany({
        where: {
          user_id: user.id,
          is_read: false,
          is_dismissed: false
        },
        orderBy: { created_at: 'desc' },
        include: {
          client: {
            select: { name: true, slug: true }
          }
        }
      });
    }),
  
  // Mark alert as read
  markAsRead: protectedProcedure
    .input(z.object({
      alertId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.alert.update({
        where: { id: input.alertId },
        data: { 
          is_read: true,
          read_at: new Date()
        }
      });
    }),
  
  // Dismiss alert
  dismiss: protectedProcedure
    .input(z.object({
      alertId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.alert.update({
        where: { id: input.alertId },
        data: { is_dismissed: true }
      });
    })
});

// ============================================
// BILLING ROUTER (Stripe)
// ============================================
export const billingRouter = createTRPCRouter({
  // Get current subscription
  getSubscription: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await getUserFromContext(ctx);
      
      return {
        status: user.subscription_status,
        currentPeriodEnd: user.subscription_current_period_end,
        maxClients: user.max_clients,
        maxEmailsPerMonth: user.max_emails_per_month,
        emailsUsedThisMonth: user.emails_analyzed_this_month
      };
    }),
  
  // Create Stripe Checkout session
  createCheckoutSession: protectedProcedure
    .input(z.object({
      plan: z.enum(['starter', 'pro'])
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromContext(ctx);
      
      const priceIds = {
        starter: process.env.STRIPE_PRICE_STARTER!,
        pro: process.env.STRIPE_PRICE_PRO!
      };
      
      const session = await stripe.checkout.sessions.create({
        customer: user.stripe_customer_id || undefined,
        customer_email: !user.stripe_customer_id ? user.email : undefined,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price: priceIds[input.plan],
          quantity: 1
        }],
        success_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing?canceled=true`,
        metadata: {
          userId: user.id,
          plan: input.plan
        }
      });
      
      return { sessionUrl: session.url };
    }),
  
  // Create Customer Portal session
  createPortalSession: protectedProcedure
    .mutation(async ({ ctx }) => {
      const user = await getUserFromContext(ctx);
      
      if (!user.stripe_customer_id) {
        throw new TRPCError({ 
          code: 'PRECONDITION_FAILED',
          message: 'No subscription found'
        });
      }
      
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing`
      });
      
      return { portalUrl: session.url };
    })
});

// ============================================
// ROOT ROUTER (merge all)
// ============================================
export const appRouter = createTRPCRouter({
  auth: authRouter,
  oauth: oauthRouter,
  clients: clientsRouter,
  analysis: analysisRouter,
  alerts: alertsRouter,
  billing: billingRouter
});

export type AppRouter = typeof appRouter;
```

## **2.6 Sécurité & RGPDPrincipe : Security & Privacy by Design**

**Objectif** : Conformité RGPD dès le code, pas après coup.

```python
Règle d'or : Si vous ne savez pas pourquoi vous stockez une donnée,
             ne la stockez pas.
```

### **2.6.1 Mesures de Sécurité (Infrastructure)**

```tsx
// config/security.ts

export const SECURITY_CONFIG = {
  // Headers de sécurité (Next.js middleware)
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  },
  
  // Rate limiting (Upstash Redis)
  rateLimit: {
    api: {
      windowMs: 60 * 1000, // 1 minute
      max: 100, // 100 requêtes/min
    },
    analysis: {
      windowMs: 24 * 60 * 60 * 1000, // 24h
      max: 10, // 10 analyses manuelles/jour
    },
  },
  
  // Data retention
  retention: {
    emails: 90, // jours
    insights: 90,
    alerts: 30,
    auditLogs: 365,
  },
} as const;
```

### **Middleware Next.js (Security Headers)**

```tsx
// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
});

export async function middleware(request: NextRequest) {
  // 1. Security headers
  const response = NextResponse.next();
  
  Object.entries(SECURITY_CONFIG.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // 2. Rate limiting (API routes uniquement)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }
  }
  
  // 3. CORS (si API publique future)
  if (request.nextUrl.pathname.startsWith('/api/public/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_URL!);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/client/:path*',
  ],
};
```

### 2.6.2 RGPD Compliance

### Charte de traitement des données

```tsx
// lib/data-processing.ts

/**
 * RÈGLES DE TRAITEMENT DES DONNÉES (RGPD)
 * 
 * 1. MINIMISATION
 *    - On ne stocke QUE ce qui est nécessaire
 *    - Body email : preview 500 chars max (pas le contenu complet)
 *    - Pas de pièces jointes
 * 
 * 2. FINALITÉ
 *    - Données utilisées UNIQUEMENT pour analyse relation client
 *    - Pas de revente, pas de partage tiers
 * 
 * 3. DURÉE DE CONSERVATION
 *    - Emails : 90 jours max
 *    - Analyses : 90 jours max
 *    - Suppression auto via CRON
 * 
 * 4. DROITS UTILISATEUR
 *    - Accès : API pour exporter ses données
 *    - Rectification : Édition clients/settings
 *    - Suppression : Bouton "Supprimer mon compte" (cascade)
 *    - Portabilité : Export JSON
 *    - Opposition : Déconnexion email = stop analyse
 * 
 * 5. SÉCURITÉ
 *    - Chiffrement au repos (Supabase encryption)
 *    - HTTPS obligatoire
 *    - Tokens Nylas chiffrés (pgcrypto)
 *    - Logs d'accès (audit_logs)
 */

export async function sanitizeEmailForStorage(email: NylasEmail): Promise<EmailRecord> {
  return {
    message_id: email.id,
    subject: email.subject || '(Pas de sujet)',
    from_email: email.from[0].email,
    to_email: email.to[0].email,
    sent_at: new Date(email.date * 1000),
    
    // ⚠️ CRITIQUE : Pas le body complet
    body_preview: email.snippet?.substring(0, 500) || '',
    body_length: email.body?.length || 0,
    
    // Métadonnées uniquement
    thread_id: email.thread_id,
    is_from_client: isClientEmail(email.from[0].email),
  };
}

export async function deleteUserData(userId: string): Promise<void> {
  /**
   * Suppression RGPD complète (cascade)
   * Appelé par bouton "Supprimer mon compte"
   */
  
  await db.$transaction([
    // 1. Supprimer tous les clients (cascade sur emails, insights, etc.)
    db.client.deleteMany({ where: { user_id: userId } }),
    
    // 2. Supprimer jobs
    db.analysisJob.deleteMany({ where: { user_id: userId } }),
    
    // 3. Supprimer alertes
    db.alert.deleteMany({ where: { user_id: userId } }),
    
    // 4. Anonymiser audit logs (pas supprimer pour traçabilité)
    db.auditLog.updateMany({
      where: { user_id: userId },
      data: { user_id: null },
    }),
    
    // 5. Révoquer accès Nylas
    // (appel API Nylas pour delete grant)
    
    // 6. Supprimer user
    db.user.update({
      where: { id: userId },
      data: { deleted_at: new Date() },
    }),
  ]);
  
  // 7. Log action (pour conformité)
  await logAudit({
    event_type: 'user_deleted',
    user_id: userId,
    resource_type: 'user',
    resource_id: userId,
  });
}

export async function exportUserData(userId: string): Promise<UserDataExport> {
  /**
   * Export RGPD (droit à la portabilité)
   */
  
  const user = await db.user.findUnique({ 
    where: { id: userId },
    include: {
      clients: {
        include: {
          emails: true,
          insights: true,
          health_history: true,
        },
      },
      alerts: true,
      analysis_jobs: true,
    },
  });
  
  return {
    user: {
      email: user.email,
      created_at: user.created_at,
      subscription: user.subscription_status,
    },
    clients: user.clients.map(sanitizeForExport),
    export_date: new Date().toISOString(),
  };
}
```

### **Page Politique de Confidentialité (obligatoire)**

```tsx
// app/privacy/page.tsx

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1>Politique de confidentialité</h1>
      
      <section>
        <h2>1. Responsable du traitement</h2>
        <p>Norva SAS, 123 rue du Code, 75001 Paris, France</p>
      </section>
      
      <section>
        <h2>2. Données collectées</h2>
        <ul>
          <li><strong>Compte</strong> : Email, nom, prénom</li>
          <li><strong>Emails professionnels</strong> : Métadonnées uniquement (expéditeur, destinataire, sujet, date, aperçu 500 caractères)</li>
          <li><strong>Analyses</strong> : Scores de santé, insights générés par IA</li>
          <li><strong>Technique</strong> : Logs d'accès, adresse IP</li>
        </ul>
      </section>
      
      <section>
        <h2>3. Finalité du traitement</h2>
        <p>Analyser vos échanges clients pour détecter les risques de churn.</p>
        <p><strong>Base légale</strong> : Consentement (connexion email) et exécution du contrat.</p>
      </section>
      
      <section>
        <h2>4. Durée de conservation</h2>
        <ul>
          <li>Emails : 90 jours maximum</li>
          <li>Analyses : 90 jours maximum</li>
          <li>Compte : Tant que actif + 30 jours après suppression</li>
        </ul>
      </section>
      
      <section>
        <h2>5. Vos droits</h2>
        <ul>
          <li><strong>Accès</strong> : Exporter vos données (Settings > Exporter)</li>
          <li><strong>Rectification</strong> : Modifier vos infos (Settings > Profil)</li>
          <li><strong>Suppression</strong> : Supprimer votre compte (Settings > Compte > Supprimer)</li>
          <li><strong>Opposition</strong> : Déconnecter votre boîte mail (Settings > Email)</li>
        </ul>
        <p>Contact : privacy@Norva.fr</p>
      </section>
      
      <section>
        <h2>6. Sous-traitants</h2>
        <ul>
          <li><strong>Nylas</strong> (USA, Privacy Shield) : Connexion email</li>
          <li><strong>Anthropic</strong> (USA) : Analyse IA (données anonymisées)</li>
          <li><strong>Supabase</strong> (EU) : Hébergement base de données</li>
          <li><strong>Vercel</strong> (EU) : Hébergement application</li>
        </ul>
        <p>Tous conformes RGPD avec DPA signés.</p>
      </section>
      
      <section>
        <h2>7. Transferts hors UE</h2>
        <p>Nylas et Anthropic sont basés aux USA. Transferts encadrés par clauses contractuelles types (SCC).</p>
      </section>
      
      <section>
        <h2>8. Sécurité</h2>
        <ul>
          <li>Chiffrement HTTPS</li>
          <li>Chiffrement base de données (AES-256)</li>
          <li>Authentification OAuth sécurisée</li>
          <li>Logs d'accès tracés</li>
        </ul>
      </section>
      
      <p className="text-sm text-gray-500 mt-8">
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
      </p>
    </div>
  );
}
```

### **2.6.3 Audit & Logging**

```tsx
// lib/audit.ts

import { db } from './db';

export async function logAudit(params: {
  event_type: string;
  user_id?: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
}) {
  await db.auditLog.create({
    data: {
      ...params,
      created_at: new Date(),
    },
  });
}

// Utilisation dans les endpoints sensibles
export const clientsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const client = await db.client.findFirst({
        where: { slug: input.slug, user_id: ctx.user.id },
      });
      
      // Log accès client (RGPD : traçabilité)
      await logAudit({
        event_type: 'client_viewed',
        user_id: ctx.user.id,
        resource_type: 'client',
        resource_id: client.id,
        ip_address: ctx.req.ip,
        user_agent: ctx.req.headers['user-agent'],
      });
      
      return client;
    }),
});
```

## 2.7 Intégrations Externes (APIs)

### 2.7.1 Nylas Email API

```tsx
// lib/nylas.ts

import Nylas from 'nylas';

const nylas = new Nylas({
  apiKey: process.env.NYLAS_API_KEY!,
  apiUri: 'https://api.us.nylas.com',
});

export async function fetchNylasEmails(
  grantId: string,
  options: {
    limit?: number;
    receivedAfter?: number; // Unix timestamp
  }
) {
  try {
    const messages = await nylas.messages.list({
      identifier: grantId,
      queryParams: {
        limit: options.limit || 100,
        received_after: options.receivedAfter,
      },
    });
    
    return messages.data;
  } catch (error) {
    console.error('Nylas fetch error:', error);
    throw new Error('Failed to fetch emails');
  }
}

export async function setupNylasWebhook(grantId: string) {
  /**
   * Webhook pour nouveaux emails (sync temps réel)
   * Appelé après connexion Outlook
   */
  
  await nylas.webhooks.create({
    triggers: ['message.created'],
    webhookUrl: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/nylas`,
    description: `Norva sync for grant ${grantId}`,
  });
}

// Webhook handler
// app/api/webhooks/nylas/route.ts
export async function POST(req: Request) {
  const signature = req.headers.get('x-nylas-signature');
  const body = await req.text();
  
  // Vérifier signature (sécurité)
  if (!verifyNylasSignature(body, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const event = JSON.parse(body);
  
  if (event.type === 'message.created') {
    // Déclencher analyse incrémentale
    await inngest.send({
      name: 'email.new',
      data: {
        grantId: event.data.grant_id,
        messageId: event.data.id,
      },
    });
  }
  
  return new Response('OK', { status: 200 });
}
```

### **2.7.2 Claude API (Anthropic)**

```tsx
// lib/claude.ts

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function analyzeSentiment(emails: Email[]) {
  /**
   * Analyse sentiment d'un batch d'emails
   * Optimisé pour coût tokens
   */
  
  // Préparer prompt condensé
  const emailSummaries = emails.map(e => ({
    from: e.is_from_client ? 'Client' : 'Nous',
    date: e.sent_at.toISOString().split('T')[0],
    text: e.body_preview,
  }));
  
  const prompt = `Analyse le sentiment de ces échanges client/CSM.

Pour chaque email, retourne :
- sentiment : 1 (positif), 0 (neutre), -1 (négatif)
- tendance générale : improving/stable/degrading

Emails (${emails.length}) :
${JSON.stringify(emailSummaries, null, 2)}

Réponds UNIQUEMENT en JSON :
{
  "sentiments": [1, 0, -1, ...],
  "trend": "improving",
  "key_concerns": ["budget", "délais"]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0.3, // Cohérence (pas de créativité)
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });
    
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }
    
    // Parser JSON
    const analysis = JSON.parse(content.text);
    
    // Log usage (pour monitoring coûts)
    await logClaudeUsage({
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
      cost_usd: calculateCost(message.usage),
    });
    
    return analysis;
    
  } catch (error) {
    console.error('Claude API error:', error);
    
    // Fallback simple si échec
    return {
      sentiments: emails.map(() => 0), // Neutre par défaut
      trend: 'stable',
      key_concerns: [],
    };
  }
}

export async function generateInsights(context: {
  clientName: string;
  healthScore: number;
  emailCount: number;
  recentActivity: string;
}) {
  const prompt = `Tu es expert Customer Success. Génère 3-5 insights actionnables.

Client : ${context.clientName}
Score santé : ${context.healthScore}/100
Activité récente : ${context.recentActivity}

Format JSON :
{
  "insights": [
    {"type": "warning", "text": "Temps de réponse dégradé", "priority": 1},
    ...
  ],
  "actions": ["Appeler aujourd'hui", ...]
}

Concis, factuel, actionnable.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const content = message.content[0];
  return JSON.parse(content.type === 'text' ? content.text : '{}');
}

function calculateCost(usage: { input_tokens: number; output_tokens: number }) {
  // Sonnet 4 : $3/1M input, $15/1M output
  const inputCost = (usage.input_tokens / 1_000_000) * 3;
  const outputCost = (usage.output_tokens / 1_000_000) * 15;
  return inputCost + outputCost;
}
```

### **2.7.3 Stripe Billing**

```tsx
// lib/stripe.ts

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Webhook handler
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }
  
  // Handle événements
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
  }
  
  return new Response('OK', { status: 200 });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;
  
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );
  
  const plan = session.metadata?.plan as 'starter' | 'pro';
  const limits = {
    starter: { clients: 20, emails: 2000 },
    pro: { clients: 50, emails: 10000 },
  };
  
  await db.user.update({
    where: { id: userId },
    data: {
      stripe_customer_id: session.customer as string,
      subscription_status: 'active',
      subscription_current_period_end: new Date(subscription.current_period_end * 1000),
      max_clients: limits[plan].clients,
      max_emails_per_month: limits[plan].emails,
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await db.user.update({
    where: { stripe_customer_id: subscription.customer as string },
    data: {
      subscription_status: subscription.status as any,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await db.user.update({
    where: { stripe_customer_id: subscription.customer as string },
    data: {
      subscription_status: 'canceled',
      max_clients: 5, // Retour plan gratuit
      max_emails_per_month: 500,
    },
  });
}
```

## **2.8 Background Jobs (Inngest)**

```tsx
// inngest/functions.ts

import { inngest } from './client';

/**
 * JOB : Analyse initiale d'un client
 * Déclenché après validation clients dans onboarding
 */
export const analyzeClient = inngest.createFunction(
  { 
    id: 'analyze-client',
    retries: 3,
  },
  { event: 'client.analyze' },
  async ({ event, step }) => {
    const { clientId, type } = event.data;
    
    // Step 1: Fetch emails
    const emails = await step.run('fetch-emails', async () => {
      const client = await db.client.findUnique({
        where: { id: clientId },
        include: { user: true },
      });
      
      if (!client?.user.nylas_grant_id) {
        throw new Error('No email connection');
      }
      
      // Fetch depuis Nylas
      const since = new Date();
      since.setDate(since.getDate() - 30); // 30 derniers jours
      
      return await fetchNylasEmails(client.user.nylas_grant_id, {
        receivedAfter: Math.floor(since.getTime() / 1000),
        limit: 1000,
      });
    });
    
    // Step 2: Filter & store
    const storedEmails = await step.run('store-emails', async () => {
      // Filtrer emails du client
      const client = await db.client.findUnique({ where: { id: clientId } });
      const clientEmails = emails.filter(e => 
        e.from[0].email.endsWith(`@${client.domain}`) ||
        e.to.some(t => t.email.endsWith(`@${client.domain}`))
      );
      
      // Stocker (avec sanitization)
      const records = clientEmails.map(sanitizeEmailForStorage);
      await db.email.createMany({
        data: records.map(r => ({ ...r, client_id: clientId })),
        skipDuplicates: true, // Éviter doublons
      });
      
      return records;
    });
    
    // Step 3: Analyze sentiment (Claude)
    const sentimentAnalysis = await step.run('analyze-sentiment', async () => {
      // Batch par 10 pour optimiser coûts
      const batches = chunk(storedEmails, 10);
      const results = [];
      
      for (const batch of batches) {
        const analysis = await analyzeSentiment(batch);
        results.push(analysis);
        
        // Rate limit (éviter dépassement quota Claude)
        await sleep(500);
      }
      
      return results;
    });
    
    // Step 4: Calculate health score
    const healthScore = await step.run('calculate-score', async () => {
      return await computeHealthScore(clientId, storedEmails, sentimentAnalysis);
    });
    
    // Step 5: Generate insights
    const insights = await step.run('generate-insights', async () => {
      const client = await db.client.findUnique({ where: { id: clientId } });
      
      return await generateInsights({
        clientName: client.name,
        healthScore,
        emailCount: storedEmails.length,
        recentActivity: summarizeActivity(storedEmails),
      });
    });
    
    // Step 6: Persist results
    await step.run('persist-results', async () => {
      await db.client.update({
        where: { id: clientId },
        data: {
          health_score: healthScore,
          total_emails_count: storedEmails.length,
          analysis_status: 'completed',
          last_analyzed_at: new Date(),
        },
      });
      
      await db.clientInsight.create({
        data: {
          client_id: clientId,
          insights_json: insights,
        },
      });
    });
    
    // Step 7: Check alerts
    await step.run('check-alerts', async () => {
      if (healthScore < 50) {
        await db.alert.create({
          data: {
            user_id: client.user_id,
            client_id: clientId,
            type: 'at_risk',
            severity: 'high',
            title: `${client.name} est à risque`,
            message: `Score : ${healthScore}/100`,
          },
        });
      }
    });
    
    return { clientId, healthScore, emailsAnalyzed: storedEmails.length };
  }
);

/**
 * CRON : Sync quotidien (6h du matin)
 */
export const dailySync = inngest.createFunction(
  { id: 'daily-sync' },
  { cron: '0 6 * * *' }, // Tous les jours à 6h
  async ({ step }) => {
    // Fetch tous les users actifs
    const users = await step.run('get-active-users', async () => {
      return await db.user.findMany({
        where: {
          email_sync_enabled: true,
          nylas_grant_id: { not: null },
          subscription_status: { in: ['starter', 'pro'] },
        },
        include: { clients: true },
      });
    });
    
    // Déclencher analyse pour chaque client
    await step.run('trigger-analysis', async () => {
      for (const user of users) {
        for (const client of user.clients) {
          await inngest.send({
            name: 'client.analyze',
            data: { clientId: client.id, type: 'sync' },
          });
        }
      }
    });
    
    return { usersProcessed: users.length };
  }
);

// Helpers
function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

# 3️⃣ UI/UX & DESIGN SYSTEM

## 3.1 Principes de Design

**Philosophie "Trust Through Clarity"**

```tsx
Design = Clarté absolue + Sophistication discrète

Inspiration : Claude.ai, Linear, Vercel
- Fond blanc/crème omniprésent
- Texte noir profond très lisible
- Bleu accent unique et stratégique
- Icônes premium (Lucide React Pro)
```

**4 piliers du design Norva** :

1. **Minimalisme radical**
    - Blanc cassé (`#FEFDFB`) comme base universelle
    - Bordures ultra-subtiles (1px `#E8E6E3`)
    - Hiérarchie par taille de texte, pas par couleur
2. **Bleu stratégique**
    - Utilisé UNIQUEMENT pour actions primaires
    - Jamais pour décoration
    - Contraste maximal sur fond blanc
3. **Icônes premium**
    - Lucide React (16-24px selon contexte)
    - Poids uniforme (stroke-width: 1.5)
    - Jamais de couleur fantaisie
4. **Typographie expressive**
    - Inter pour texte (14-15px base)
    - Geist Mono pour données numériques
    - Line-height généreux (1.6-1.8)

---

## 3.2 Design System

### **3.2.1 Palette Minimaliste**

```tsx
// tailwind.config.ts

export default {
  theme: {
    extend: {
      colors: {
        // === NEUTRALS (90% de l'interface) ===
        cream: {
          50: '#FEFDFB',   // Background principal (like Claude)
          100: '#FAF9F7',  // Cards, sections
          200: '#F5F3F0',  // Hover states subtils
        },
        
        stone: {
          200: '#E8E6E3',  // Borders principales
          300: '#D4D2CE',  // Borders hover
          400: '#B8B5B0',  // Disabled states
          500: '#928F89',  // Secondary text
          600: '#6B6863',  // Body text
          800: '#38352F',  // Headings
          900: '#1F1D1A',  // Primary text (presque noir)
        },
        
        // === BLEU ACCENT (usage parcimonieux) ===
        blue: {
          500: '#2563EB',  // Primary actions UNIQUEMENT
          600: '#1D4ED8',  // Hover
          700: '#1E40AF',  // Active/pressed
          50: '#EFF6FF',   // Backgrounds légers (badges, alerts info)
        },
        
        // === SEMANTIC (scoring uniquement) ===
        // Pas de vert/jaune/rouge partout, juste pour scores
        success: {
          600: '#059669',  // Score > 80
          50: '#ECFDF5',
        },
        warning: {
          600: '#D97706',  // Score 50-80
          50: '#FFFBEB',
        },
        danger: {
          600: '#DC2626',  // Score < 50
          50: '#FEF2F2',
        },
      },
      
      // === TYPOGRAPHIE ===
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'Menlo',
          'Monaco',
          'Courier New',
          'monospace'
        ],
      },
      
      fontSize: {
        // Échelle harmonique
        xs: ['0.75rem', { lineHeight: '1.5' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.6' }],     // 14px
        base: ['0.9375rem', { lineHeight: '1.7' }],  // 15px (base lisible)
        lg: ['1.0625rem', { lineHeight: '1.6' }],    // 17px
        xl: ['1.25rem', { lineHeight: '1.5' }],      // 20px
        '2xl': ['1.5rem', { lineHeight: '1.4' }],    // 24px
        '3xl': ['2rem', { lineHeight: '1.3' }],      // 32px
        '4xl': ['2.5rem', { lineHeight: '1.2' }],    // 40px
      },
      
      // === SPACING (système 4px) ===
      spacing: {
        18: '4.5rem',   // 72px
        22: '5.5rem',   // 88px
      },
      
      // === BORDER RADIUS (subtil) ===
      borderRadius: {
        DEFAULT: '0.5rem',   // 8px (défaut pour tout)
        lg: '0.75rem',       // 12px (cards importantes)
        xl: '1rem',          // 16px (modals)
        '2xl': '1.5rem',     // 24px (sections hero)
      },
      
      // === SHADOWS (très subtiles) ===
      boxShadow: {
        // Ombres presque imperceptibles (comme Claude)
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 2px 6px -1px rgba(0, 0, 0, 0.08)',
        'lg': '0 4px 12px -2px rgba(0, 0, 0, 0.1)',
        
        // Border shadow (alternative aux borders colorées)
        'border': '0 0 0 1px rgba(0, 0, 0, 0.06)',
      },
      
      // === ANIMATIONS (discrètes) ===
      animation: {
        'fade-in': 'fadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 150ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
};
```

### **3.2.2 Composants Révisés (shadcn/ui customisés)**

**Button Component (override shadcn)**

```tsx
*// components/ui/button.tsx (personnalisé)*

import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const buttonVariants = cva(
  *// Base styles (minimalistes)*
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        *// Primary : BLEU (actions principales uniquement)*
        default:
          'bg-blue-500 text-white shadow-sm hover:bg-blue-600 active:bg-blue-700',
        
        *// Secondary : fond crème (actions secondaires)*
        secondary:
          'bg-cream-100 text-stone-900 border border-stone-200 hover:bg-cream-200 hover:border-stone-300',
        
        *// Ghost : transparent (navigation, actions tertiaires)*
        ghost:
          'hover:bg-cream-100 text-stone-700 hover:text-stone-900',
        
        *// Danger : rouge (delete, actions destructives)*
        destructive:
          'bg-danger-600 text-white hover:bg-danger-700',
        
        *// Link : texte souligné*
        link:
          'text-blue-600 underline-offset-4 hover:underline',
      },
      
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

---

**ScoreIndicator (révisé avec icônes Lucide)**

```tsx
*// components/ui/score-indicator.tsx*

import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ScoreIndicatorProps {
  score: number; *// 0-100*
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ScoreIndicator({ 
  score, 
  size = 'md', 
  showLabel = true,
  className 
}: ScoreIndicatorProps) {
  const getScoreInfo = (score: number) => {
    if (score < 50) {
      return {
        label: 'À risque',
        Icon: AlertCircle,
        iconClass: 'text-danger-600',
        textClass: 'text-danger-600',
        bgClass: 'bg-danger-50',
      };
    } else if (score < 80) {
      return {
        label: 'Stable',
        Icon: AlertTriangle,
        iconClass: 'text-warning-600',
        textClass: 'text-warning-600',
        bgClass: 'bg-warning-50',
      };
    } else {
      return {
        label: 'En bonne santé',
        Icon: CheckCircle2,
        iconClass: 'text-success-600',
        textClass: 'text-success-600',
        bgClass: 'bg-success-50',
      };
    }
  };
  
  const info = getScoreInfo(score);
  const Icon = info.Icon;
  
  const sizeClasses = {
    sm: { icon: 'h-4 w-4', text: 'text-sm' },
    md: { icon: 'h-5 w-5', text: 'text-base' },
    lg: { icon: 'h-6 w-6', text: 'text-lg' },
  };
  
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {*/* Icône Lucide */*}
      <Icon 
        className={cn(sizeClasses[size].icon, info.iconClass)} 
        strokeWidth={1.5}
      />
      
      {*/* Score (monospace pour alignement) */*}
      <span className={cn(
        'font-mono font-semibold tabular-nums',
        info.textClass,
        sizeClasses[size].text
      )}>
        {score}
      </span>
      
      {*/* Label */*}
      {showLabel && (
        <span className={cn('text-sm font-medium', info.textClass)}>
          {info.label}
        </span>
      )}
    </div>
  );
}

*// Variant : Progress bar minimaliste*
export function ScoreProgressBar({ 
  score, 
  className 
}: { 
  score: number; 
  className?: string;
}) {
  const info = getScoreInfo(score);
  
  return (
    <div className={cn('w-full', className)}>
      {*/* Header */*}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-stone-700">
          Score de santé
        </span>
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-semibold', info.textClass)}>
            {score}
          </span>
          <span className="text-sm text-stone-500">/100</span>
        </div>
      </div>
      
      {*/* Bar */*}
      <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div 
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            score < 50 ? 'bg-danger-600' : 
            score < 80 ? 'bg-warning-600' : 
            'bg-success-600'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      
      {*/* Label */*}
      <p className={cn('text-xs font-medium mt-1.5', info.textClass)}>
        {info.label}
      </p>
    </div>
  );
}

*// Helper (keep DRY)*
function getScoreInfo(score: number) {
  if (score < 50) {
    return {
      label: 'À risque',
      Icon: AlertCircle,
      iconClass: 'text-danger-600',
      textClass: 'text-danger-600',
      bgClass: 'bg-danger-50',
    };
  } else if (score < 80) {
    return {
      label: 'Stable',
      Icon: AlertTriangle,
      iconClass: 'text-warning-600',
      textClass: 'text-warning-600',
      bgClass: 'bg-warning-50',
    };
  } else {
    return {
      label: 'En bonne santé',
      Icon: CheckCircle2,
      iconClass: 'text-success-600',
      textClass: 'text-success-600',
      bgClass: 'bg-success-50',
    };
  }
}
```

---

**EmptyState (révisé avec Lucide)**

```tsx
*// components/ui/empty-state.tsx*

import { Button } from './button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-20 px-4 text-center',
      className
    )}>
      {*/* Icon container */*}
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-cream-100 border border-stone-200 mb-5">
        <Icon 
          className="h-8 w-8 text-stone-400" 
          strokeWidth={1.5}
        />
      </div>
      
      {*/* Title */*}
      <h3 className="text-lg font-semibold text-stone-900 mb-2">
        {title}
      </h3>
      
      {*/* Description */*}
      <p className="text-sm text-stone-600 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      
      {*/* Action */*}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

---

### **3.2.3 Iconographie (Lucide React)**

**Règles d'usage des icônes** :

```tsx
*// lib/icons.ts - Dictionnaire centralisé*

import {
  *// Navigation & Actions*
  Home,
  Settings,
  Search,
  Filter,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  
  *// Status & Feedback*
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  
  *// Business objects*
  Mail,
  Inbox,
  Users,
  User,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  
  *// Security*
  Shield,
  Lock,
  Eye,
  EyeOff,
  
  *// Files & Data*
  FileText,
  Download,
  Upload,
  Copy,
  
  *// Misc*
  Sparkles, *// AI/Magic*
  Zap,      *// Speed*
  Target,   *// Goals*
} from 'lucide-react';

*// Config par défaut*
export const ICON_DEFAULTS = {
  size: 20,           *// 20px par défaut (ni trop gros ni trop petit)*
  strokeWidth: 1.5,   *// Cohérence visuelle*
} as const;

*// Helper pour garantir cohérence*
export function Icon({ 
  icon: IconComponent, 
  size = ICON_DEFAULTS.size,
  strokeWidth = ICON_DEFAULTS.strokeWidth,
  className = '',
  ...props 
}: {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
  className?: string;
  [key: string]: any;
}) {
  return (
    <IconComponent 
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
}

*// Export groupé par catégorie*
export const Icons = {
  *// Navigation*
  home: Home,
  settings: Settings,
  search: Search,
  filter: Filter,
  
  *// Actions*
  add: Plus,
  close: X,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  external: ExternalLink,
  
  *// Status*
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
  
  *// Business*
  email: Mail,
  inbox: Inbox,
  clients: Users,
  user: User,
  calendar: Calendar,
  clock: Clock,
  trendUp: TrendingUp,
  trendDown: TrendingDown,
  activity: Activity,
  
  *// Security*
  shield: Shield,
  lock: Lock,
  eye: Eye,
  eyeOff: EyeOff,
  
  *// Files*
  file: FileText,
  download: Download,
  upload: Upload,
  copy: Copy,
  
  *// Special*
  ai: Sparkles,
  speed: Zap,
  target: Target,
};

*// Usage dans les composants// import { Icons } from '@/lib/icons';// <Icons.success className="h-5 w-5 text-success-600" />*
```

---

## 3.3 Pages Révisées (Minimalisme Premium)

### **3.3.1 Landing Page (Claude-style)**

```tsx
*// app/page.tsx*

import { Button } from '@/components/ui/button';
import { Icons } from '@/lib/icons';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      {*/* Navbar minimaliste */*}
      <nav className="border-b border-stone-200 bg-cream-50/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {*/* Logo */*}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Icons.target className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-lg font-semibold text-stone-900">Norva</span>
          </div>
          
          {*/* Actions */*}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href="/login">Se connecter</a>
            </Button>
            <Button size="sm" asChild>
              <a href="/signup">Essayer gratuitement</a>
            </Button>
          </div>
        </div>
      </nav>
      
      {*/* Hero Section */*}
      <section className="container mx-auto px-6 pt-24 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          {*/* Badge */*}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-sm font-medium text-blue-700 mb-8">
            <Icons.ai className="h-4 w-4" />
            Propulsé par l'IA Claude
          </div>
          
          {*/* Headline */*}
          <h1 className="text-5xl font-bold text-stone-900 mb-6 tracking-tight leading-tight">
            Détectez les clients à risque
            <br />
            avant qu'il ne soit trop tard
          </h1>
          
          {*/* Subheadline */*}
          <p className="text-xl text-stone-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Norva analyse vos emails clients avec l'IA pour vous alerter 
            des signaux de churn invisibles. Gagnez 2h/jour et gardez vos clients.
          </p>
          
          {*/* CTA */*}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button size="lg" asChild>
              <a href="/signup" className="gap-2">
                Commencer gratuitement
                <Icons.arrowRight className="h-5 w-5" />
              </a>
            </Button>
          </div>
          
          {*/* Trust indicators */*}
          <p className="text-sm text-stone-500">
            Gratuit • Sans carte bancaire • Setup en 5 minutes
          </p>
        </div>
        
        {*/* Screenshot (mockup) */*}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="relative rounded-xl border border-stone-200 bg-white shadow-lg overflow-hidden">
            {*/* Fake browser bar */*}
            <div className="h-10 bg-cream-100 border-b border-stone-200 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-stone-300" />
                <div className="w-3 h-3 rounded-full bg-stone-300" />
                <div className="w-3 h-3 rounded-full bg-stone-300" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-white border border-stone-200 text-xs text-stone-500">
                  app.Norva.fr/dashboard
                </div>
              </div>
            </div>
            
            {*/* Screenshot placeholder */*}
            <div className="aspect-[16/10] bg-gradient-to-br from-cream-50 to-stone-100 flex items-center justify-center">
              <p className="text-stone-400 text-sm">
                [Screenshot dashboard ici]
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {*/* Features (3 colonnes épurées) */*}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard
              icon={Icons.speed}
              title="Setup instantané"
              description="Connectez Outlook en 2 clics. Première analyse en 5 minutes. Aucune configuration technique."
            />
            
            <FeatureCard
              icon={Icons.ai}
              title="IA qualitative"
              description="Analyse le ton, les délais, les non-dits. Pas que des métriques, de vrais insights."
            />
            
            <FeatureCard
              icon={Icons.shield}
              title="100% sécurisé"
              description="Données chiffrées, hébergées en UE. Conformité RGPD garantie. Lecture seule."
            />
          </div>
        </div>
      </section>
      
      {*/* Social Proof (minimaliste) */*}
      <section className="container mx-auto px-6 py-16">
        <p className="text-center text-sm text-stone-500 mb-8">
          Déjà utilisé par des Customer Success Managers chez
        </p>
        <div className="flex items-center justify-center gap-16 opacity-40">
          <span className="text-xl font-semibold text-stone-600">Contentsquare</span>
          <span className="text-xl font-semibold text-stone-600">Alan</span>
          <span className="text-xl font-semibold text-stone-600">Spendesk</span>
        </div>
      </section>
      
      {*/* CTA Final (sobre) */*}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-3xl mx-auto text-center bg-cream-100 border border-stone-200 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-stone-900 mb-4">
            Arrêtez de perdre des clients en silence
          </h2>
          <p className="text-lg text-stone-600 mb-8">
            Rejoignez les CSM qui gardent une longueur d'avance.
          </p>
          <Button size="lg" asChild>
            <a href="/signup">Essayer Norva gratuitement</a>
          </Button>
        </div>
      </section>
      
      {*/* Footer */*}
      <footer className="border-t border-stone-200 bg-cream-50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-sm text-stone-500">
            <p>© 2025 Norva. Tous droits réservés.</p>
            <div className="flex gap-8">
              <a href="/privacy" className="hover:text-stone-900 transition-colors">
                Confidentialité
              </a>
              <a href="/terms" className="hover:text-stone-900 transition-colors">
                CGU
              </a>
              <a href="mailto:contact@Norva.fr" className="hover:text-stone-900 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: typeof Icons.speed; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center">
      {*/* Icon */*}
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cream-100 border border-stone-200 mb-4">
        <Icon className="h-6 w-6 text-stone-700" strokeWidth={1.5} />
      </div>
      
      {*/* Title */*}
      <h3 className="text-lg font-semibold text-stone-900 mb-2">
        {title}
      </h3>
      
      {*/* Description */*}
      <p className="text-sm text-stone-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
```

---

### 3.3.2 Dashboard (révisé minimaliste)

```tsx
*// app/dashboard/page.tsx*

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScoreIndicator } from '@/components/ui/score-indicator';
import { EmptyState } from '@/components/ui/empty-state';
import { Icons } from '@/lib/icons';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'at_risk' | 'stable' | 'healthy'>('all');
  
  *// Mock data*
  const clients = [
    { id: '1', name: 'ACME Corp', domain: 'acme.com', score: 32, lastContact: new Date('2025-01-07'), emails: 47 },
    { id: '2', name: 'TechStart SAS', domain: 'techstart.io', score: 68, lastContact: new Date('2025-01-17'), emails: 23 },
    { id: '3', name: 'Innovate GmbH', domain: 'innovate.de', score: 89, lastContact: new Date('2025-01-18'), emails: 8 },
    { id: '4', name: 'BetaCorp', domain: 'betacorp.fr', score: 91, lastContact: new Date('2025-01-19'), emails: 15 },
  ];
  
  const atRiskCount = clients.filter(c => c.score < 50).length;
  
  return (
    <div className="min-h-screen bg-cream-50">
      {*/* Header fixe */*}
      <header className="bg-cream-50 border-b border-stone-200 sticky top-0 z-10 backdrop-blur-sm bg-cream-50/95">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {*/* Logo */*}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Icons.target className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-lg font-semibold text-stone-900">Norva</span>
          </Link>
          
          {*/* Navigation */*}
          <nav className="flex items-center gap-1">
            <Link 
              href="/dashboard"
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg"
            >
              Clients
            </Link>
            <Link 
              href="/settings"
              className="px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-cream-100 rounded-lg transition-colors"
            >
              Paramètres
            </Link>
          </nav>
          
          {*/* User */*}
          <Button variant="ghost" size="sm" className="gap-2">
            <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center">
              <span className="text-xs font-semibold text-stone-700">RM</span>
            </div>
          </Button>
        </div>
      </header>
      
      {*/* Main */*}
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {*/* Alert banner (si clients à risque) */*}
        {atRiskCount > 0 && (
          <div className="mb-8 p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-start gap-3">
            <Icons.error className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-danger-900 mb-0.5">
                {atRiskCount} client{atRiskCount > 1 ? 's' : ''} à risque détecté{atRiskCount > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-danger-700">
                Ces clients nécessitent une attention immédiate.
              </p>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              className="text-danger-700 hover:bg-danger-100"
              onClick={() => setFilter('at_risk')}
            >
              Voir
            </Button>
          </div>
        )}
        
        {*/* Filters (épurés) */*}
        <div className="mb-6 flex items-center gap-3">
          {*/* Search */*}
          <div className="flex-1 relative">
            <Icons.search 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" 
              strokeWidth={1.5}
            />
            <Input
              placeholder="Rechercher un client..."
              className="pl-10 bg-white border-stone-200 focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {*/* Filter buttons */*}
          <div className="flex items-center gap-1 p-1 bg-cream-100 rounded-lg border border-stone-200">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filter === 'all' 
                  ? 'bg-white text-stone-900 shadow-sm' 
                  : 'text-stone-600 hover:text-stone-900'
              )}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('at_risk')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filter === 'at_risk' 
                  ? 'bg-white text-stone-900 shadow-sm' 
                  : 'text-stone-600 hover:text-stone-900'
              )}
            >
              À risque
            </button>
            <button
              onClick={() => setFilter('stable')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filter === 'stable' 
                  ? 'bg-white text-stone-900 shadow-sm' 
                  : 'text-stone-600 hover:text-stone-900'
              )}
            >
              Stables
            </button>
            <button
              onClick={() => setFilter('healthy')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filter === 'healthy' 
                  ? 'bg-white text-stone-900 shadow-sm' 
                  : 'text-stone-600 hover:text-stone-900'
              )}
            >
              Sains
            </button>
          </div>
        </div>
        
        {*/* Table (minimaliste) */*}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-stone-700 uppercase tracking-wide">
                  Client
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-stone-700 uppercase tracking-wide">
                  Score
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-stone-700 uppercase tracking-wide">
                  Dernier contact
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-stone-700 uppercase tracking-wide">
                  Emails
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {clients.map((client) => (
                <tr 
                  key={client.id}
                  className="group hover:bg-cream-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link 
                      href={`/client/${client.domain}`}
                      className="block"
                    >
                      <p className="font-medium text-stone-900 group-hover:text-blue-600 transition-colors">
                        {client.name}
                      </p>
                      <p className="text-sm text-stone-500 font-mono">
                        {client.domain}
                      </p>
                    </Link>
                  </td>
                  
                  <td className="px-6 py-4">
                    <ScoreIndicator score={client.score} size="sm" showLabel={false} />
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-stone-600">
                    {formatDistanceToNow(client.lastContact, {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </td>
                  
                  <td className="px-6 py-4 text-right text-sm font-mono text-stone-600">
                    {client.emails}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {*/* Footer info */*}
        <p className="mt-6 text-center text-sm text-stone-500">
          {clients.length} client{clients.length > 1 ? 's' : ''} • Dernière analyse il y a 2 heures
        </p>
      </main>
    </div>
  );
}
```

# 4️⃣ PROMPTS CLAUDE & IA

## 4.1 Philosophie Prompting (Anthropic Best Practices)

### Principes tirés de "Effective Context Engineering for AI Agents"

```tsx
PROMPTING = ARCHITECTURE LOGICIELLE

1. BATCH INVARIANCE (Critique)
   ✓ Même input → Même output (déterministe)
   ✓ Schémas stricts (Zod validation)
   ✓ Parsing robuste avec fallbacks
   
2. STRUCTURED CONTEXT
   ✓ Séparation nette : Instructions | Data | Format
   ✓ XML tags pour délimiter sections
   ✓ Exemples inline (few-shot)
   
3. ATOMIC PROMPTS
   ✓ 1 prompt = 1 tâche précise
   ✓ Pas de multi-tasking complexe
   ✓ Composition > Monolithe
   
4. VERIFIABLE OUTPUTS
   ✓ JSON Schema strict
   ✓ Type-safe parsing (Zod)
   ✓ Validation automatique
```

## 4.2 Architecture Prompting

### 4.2.1 Template Pattern

```tsx
*// lib/prompts/base-template.ts/***
 * Template de base pour tous les prompts Norva
 * Structure stricte inspirée Anthropic guidelines
 **/*
export function createPromptTemplate(config: {
  task: string;
  context: Record<string, any>;
  data: string;
  outputSchema: string;
  examples?: string;
  constraints?: string[];
}): string {
  return `<task>
${config.task}
</task>

<context>
${Object.entries(config.context)
  .map(([key, value]) => `<${key}>${value}</${key}>`)
  .join('\n')}
</context>

<data>
${config.data}
</data>

${config.examples ? `<examples>\n${config.examples}\n</examples>` : ''}

${config.constraints ? `<constraints>\n${config.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n</constraints>` : ''}

<output_format>
You MUST respond with a valid JSON object matching this exact schema:

${config.outputSchema}

CRITICAL:
- Output ONLY valid JSON
- No text before or after JSON
- No markdown code blocks
- All fields are required
</output_format>`;
}
```

---

## 4.3 Prompts Production (Batch Invariant)

### 4.3.1 Analyse Sentiment (Révisé)

```tsx
*// lib/prompts/sentiment-analysis.ts*

import { z } from 'zod';
import { createPromptTemplate } from './base-template';

*/***
 * SCHÉMA OUTPUT (strict validation)
 **/*
export const SentimentAnalysisSchema = z.object({
  sentiments: z.array(
    z.object({
      email_id: z.number(),
      score: z.enum(['-1', '0', '1']), *// String pour éviter erreurs parsing*
      confidence: z.number().min(0).max(1),
    })
  ),
  trend: z.enum(['improving', 'stable', 'degrading']),
  key_concerns: z.array(z.string()).max(3),
  metadata: z.object({
    total_analyzed: z.number(),
    avg_sentiment: z.number().min(-1).max(1),
  }),
});

export type SentimentAnalysisOutput = z.infer<typeof SentimentAnalysisSchema>;

*/***
 * BUILDER PROMPT
 **/*
export function buildSentimentPrompt(emails: EmailForAnalysis[]): string {
  *// Formatter data (XML structure)*
  const emailsXML = emails
    .map(
      (e, idx) => `<email id="${idx + 1}">
  <from>${e.is_from_client ? 'CLIENT' : 'CSM'}</from>
  <date>${e.sent_at.toISOString().split('T')[0]}</date>
  <text>${escapeXML(e.body_preview.substring(0, 400))}</text>
</email>`
    )
    .join('\n');

  return createPromptTemplate({
    task: `You are a Customer Success sentiment analyzer. Analyze the sentiment of each email in a client-CSM conversation thread.`,

    context: {
      client_name: emails[0]?.client_name || 'Unknown Client',
      period: `${emails.length} emails analyzed`,
      objective: 'Detect satisfaction/dissatisfaction signals',
    },

    data: `<emails>\n${emailsXML}\n</emails>`,

    examples: `<example_input>
<email id="1">
  <from>CLIENT</from>
  <date>2025-01-15</date>
  <text>Merci pour votre réponse rapide ! Super travail.</text>
</email>
</example_input>

<example_output>
{
  "sentiments": [
    {
      "email_id": 1,
      "score": "1",
      "confidence": 0.95
    }
  ],
  "trend": "stable",
  "key_concerns": [],
  "metadata": {
    "total_analyzed": 1,
    "avg_sentiment": 1.0
  }
}
</example_output>

<example_input>
<email id="1">
  <from>CLIENT</from>
  <date>2025-01-10</date>
  <text>Toujours pas de réponse sur le bug. Très déçu.</text>
</email>
</example_input>

<example_output>
{
  "sentiments": [
    {
      "email_id": 1,
      "score": "-1",
      "confidence": 0.92
    }
  ],
  "trend": "stable",
  "key_concerns": ["support"],
  "metadata": {
    "total_analyzed": 1,
    "avg_sentiment": -1.0
  }
}
</example_output>`,

    constraints: [
      'Each email must have exactly one sentiment entry',
      'score must be "-1" (negative), "0" (neutral), or "1" (positive)',
      'confidence reflects your certainty (0.0 to 1.0)',
      'key_concerns: max 3 words (e.g., "budget", "delays", "support")',
      'trend: compare first 3 vs last 3 emails if possible',
      'avg_sentiment: arithmetic mean of all scores',
    ],

    outputSchema: JSON.stringify(
      {
        sentiments: [
          {
            email_id: 'number',
            score: '"-1" | "0" | "1"',
            confidence: 'number (0-1)',
          },
        ],
        trend: '"improving" | "stable" | "degrading"',
        key_concerns: ['string (max 3)'],
        metadata: {
          total_analyzed: 'number',
          avg_sentiment: 'number (-1 to 1)',
        },
      },
      null,
      2
    ),
  });
}

*// Helper*
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface EmailForAnalysis {
  client_name: string;
  is_from_client: boolean;
  sent_at: Date;
  body_preview: string;
}
```

---

### 4.3.2 Parsing Robuste (Batch Invariant)

```tsx
*// lib/claude-parser.ts*

import { z } from 'zod';

*/***
 * Parser universel avec fallback et retry
 * Garantit batch invariance
 **/*
export async function parseClaudeJSON<T>(
  responseText: string,
  schema: z.ZodSchema<T>,
  options: {
    fallback?: T;
    maxRetries?: number;
  } = {}
): Promise<T> {
  const { fallback, maxRetries = 3 } = options;

  *// Stratégie de nettoyage progressive*
  const cleaningStrategies = [
    *// 1. Basique : strip markdown*
    (text: string) => text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim(),

    *// 2. Extraction regex (si Claude ajoute texte avant/après)*
    (text: string) => {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? match[0] : text;
    },

    *// 3. Trouver premier { et dernier }*
    (text: string) => {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return text.substring(start, end + 1);
      }
      return text;
    },

    *// 4. Supprimer commentaires (si Claude en ajoute)*
    (text: string) => text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''),
  ];

  *// Tentatives progressives*
  for (let i = 0; i < cleaningStrategies.length; i++) {
    try {
      const cleaned = cleaningStrategies[i](responseText);
      const parsed = JSON.parse(cleaned);
      
      *// Validation Zod (throw si invalide)*
      const validated = schema.parse(parsed);
      
      return validated;
      
    } catch (error) {
      console.warn(`Parse attempt ${i + 1} failed:`, error instanceof Error ? error.message : error);
      
      *// Continue vers stratégie suivante*
      if (i === cleaningStrategies.length - 1) {
        *// Dernière tentative échouée*
        if (fallback !== undefined) {
          console.error('All parse attempts failed, using fallback');
          return fallback;
        }
        
        throw new Error(`Failed to parse Claude response after ${cleaningStrategies.length} attempts: ${error}`);
      }
    }
  }

  *// Should never reach here*
  throw new Error('Unexpected parser error');
}

*/***
 * Wrapper complet : Call + Parse
 **/*
export async function callClaudeParsed<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    fallback?: T;
  } = {}
): Promise<T> {
  const {
    model = 'claude-sonnet-4-20250514',
    temperature = 0, *// CRITIQUE pour batch invariance*
    maxTokens = 2000,
    fallback,
  } = options;

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature, *// 0 = déterministe*
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    *// Parse avec stratégies fallback*
    const parsed = await parseClaudeJSON(content.text, schema, { fallback });

    *// Log usage*
    await logClaudeUsage({
      prompt_type: extractPromptType(prompt),
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
      cost_usd: calculateCost(message.usage),
      success: true,
    });

    return parsed;

  } catch (error) {
    console.error('Claude call failed:', error);

    *// Log échec*
    await logClaudeUsage({
      prompt_type: extractPromptType(prompt),
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });

    *// Si fallback dispo, retourner*
    if (fallback !== undefined) {
      return fallback;
    }

    throw error;
  }
}

function extractPromptType(prompt: string): string {
  *// Extraire de la balise <task>*
  const match = prompt.match(/<task>\s*([^<]+)/);
  return match ? match[1].substring(0, 50) : 'unknown';
}
```

---

### 4.3.3 Génération Insights (Révisé)

```tsx
*// lib/prompts/insights-generation.ts*

import { z } from 'zod';
import { createPromptTemplate } from './base-template';

*/***
 * SCHÉMA OUTPUT
 **/*
export const InsightsSchema = z.object({
  insights: z.array(
    z.object({
      type: z.enum(['warning', 'info', 'positive']),
      text: z.string().max(100),
      priority: z.number().int().min(1).max(5),
      evidence: z.string().max(200), *// Nouvelle : traçabilité*
    })
  ).min(2).max(5),
  
  actions: z.array(
    z.object({
      text: z.string().max(80),
      urgency: z.enum(['immediate', 'this_week', 'this_month']),
    })
  ).min(1).max(3),
  
  summary: z.string().min(10).max(100),
  
  metadata: z.object({
    confidence: z.number().min(0).max(1),
    data_quality: z.enum(['high', 'medium', 'low']),
  }),
});

export type InsightsOutput = z.infer<typeof InsightsSchema>;

*/***
 * BUILDER PROMPT
 **/*
export function buildInsightsPrompt(context: InsightContext): string {
  *// Contexte structuré en XML*
  const contextXML = `<client>
  <name>${context.clientName}</name>
  <health_score>${context.healthScore}</health_score>
  <status>${getScoreLabel(context.healthScore)}</status>
</client>

<metrics>
  <engagement>${context.scoreComponents.engagement}/40</engagement>
  <sentiment>${context.scoreComponents.sentiment}/30</sentiment>
  <resolution>${context.scoreComponents.resolution}/20</resolution>
  <lifecycle>${context.scoreComponents.lifecycle}/10</lifecycle>
</metrics>

<activity>
  <period_days>${context.periodDays}</period_days>
  <email_count>${context.emailCount}</email_count>
  <last_contact_days>${context.lastContactDays}</last_contact_days>
  <recent_summary>${context.recentActivity}</recent_summary>
</activity>

<history>
${context.scoreHistory.map(h => `  <snapshot date="${h.date}" score="${h.score}" />`).join('\n')}
</history>

${context.keyConcerns.length > 0 ? `<concerns>\n${context.keyConcerns.map(c => `  <concern>${c}</concern>`).join('\n')}\n</concerns>` : ''}`;

  return createPromptTemplate({
    task: `You are an expert Customer Success Manager analyzing a client relationship. Generate actionable insights to help a CSM manage this client effectively.`,

    context: {
      role: 'CSM Advisor',
      goal: 'Help CSM prioritize actions and understand client health',
      audience: 'Experienced CSM who needs concrete guidance',
    },

    data: contextXML,

    examples: `<example_input>
<client>
  <name>ACME Corp</name>
  <health_score>32</health_score>
  <status>At Risk</status>
</client>
<metrics>
  <engagement>8/40</engagement>
  <sentiment>10/30</sentiment>
  <resolution>10/20</resolution>
  <lifecycle>4/10</lifecycle>
</metrics>
<activity>
  <period_days>30</period_days>
  <email_count>47</email_count>
  <last_contact_days>12</last_contact_days>
  <recent_summary>Client response time degraded from 4h to 2 days</recent_summary>
</activity>
<concerns>
  <concern>budget</concern>
  <concern>delays</concern>
</concerns>
</example_input>

<example_output>
{
  "insights": [
    {
      "type": "warning",
      "text": "Response time degraded: 4h → 2 days",
      "priority": 1,
      "evidence": "Last 5 exchanges show increasing delay"
    },
    {
      "type": "warning",
      "text": "Budget concerns mentioned twice",
      "priority": 2,
      "evidence": "Emails from Jan 5 and Jan 12"
    },
    {
      "type": "info",
      "text": "No contact in 12 days (above 7-day threshold)",
      "priority": 3,
      "evidence": "Last email: Jan 7"
    }
  ],
  "actions": [
    {
      "text": "Call today - Urgent check-in",
      "urgency": "immediate"
    },
    {
      "text": "Discuss budget concerns and options",
      "urgency": "this_week"
    },
    {
      "text": "Set up bi-weekly sync meetings",
      "urgency": "this_week"
    }
  ],
  "summary": "Critical: Client disengaging - immediate action required",
  "metadata": {
    "confidence": 0.88,
    "data_quality": "high"
  }
}
</example_output>`,

    constraints: [
      'insights: 2-5 items ordered by priority (1=most urgent)',
      'Each insight must have concrete evidence (not generic)',
      'warning: signals requiring immediate attention',
      'info: contextual information for awareness',
      'positive: strengths to maintain or leverage',
      'actions: imperative voice, specific and actionable',
      'urgency: immediate (today), this_week, this_month',
      'summary: one sentence, clear verdict',
      'confidence: your certainty in the analysis (0.0-1.0)',
      'data_quality: high (30+ emails), medium (10-30), low (<10)',
    ],

    outputSchema: JSON.stringify(
      {
        insights: [
          {
            type: '"warning" | "info" | "positive"',
            text: 'string (max 100 chars)',
            priority: 'number 1-5',
            evidence: 'string (max 200 chars)',
          },
        ],
        actions: [
          {
            text: 'string (max 80 chars)',
            urgency: '"immediate" | "this_week" | "this_month"',
          },
        ],
        summary: 'string (10-100 chars)',
        metadata: {
          confidence: 'number (0-1)',
          data_quality: '"high" | "medium" | "low"',
        },
      },
      null,
      2
    ),
  });
}

interface InsightContext {
  clientName: string;
  healthScore: number;
  emailCount: number;
  periodDays: number;
  lastContactDays: number;
  scoreComponents: {
    engagement: number;
    sentiment: number;
    resolution: number;
    lifecycle: number;
  };
  recentActivity: string;
  scoreHistory: Array<{ date: string; score: number }>;
  keyConcerns: string[];
}

function getScoreLabel(score: number): string {
  if (score < 50) return 'At Risk';
  if (score < 80) return 'Stable';
  return 'Healthy';
}
```

---

### 4.3.4 Utilisation dans Jobs

```tsx
*// inngest/functions/analyze-client.ts*

import { inngest } from '../client';
import { 
  buildSentimentPrompt, 
  SentimentAnalysisSchema,
  buildInsightsPrompt,
  InsightsSchema,
} from '@/lib/prompts';
import { callClaudeParsed } from '@/lib/claude-parser';

export const analyzeClient = inngest.createFunction(
  { 
    id: 'analyze-client',
    retries: 3,
  },
  { event: 'client.analyze' },
  async ({ event, step }) => {
    const { clientId } = event.data;
    
    *// Step 1: Fetch emails*
    const emails = await step.run('fetch-emails', async () => {
      return await db.email.findMany({
        where: { client_id: clientId },
        orderBy: { sent_at: 'desc' },
        take: 20,
        include: { client: true },
      });
    });
    
    if (emails.length === 0) {
      return { error: 'No emails found' };
    }
    
    *// Step 2: Sentiment analysis (BATCH INVARIANT)*
    const sentimentResult = await step.run('analyze-sentiment', async () => {
      const prompt = buildSentimentPrompt(
        emails.map(e => ({
          client_name: e.client.name,
          is_from_client: e.is_from_client,
          sent_at: e.sent_at,
          body_preview: e.body_preview,
        }))
      );
      
      *// Fallback si échec*
      const fallback: z.infer<typeof SentimentAnalysisSchema> = {
        sentiments: emails.map((_, i) => ({
          email_id: i + 1,
          score: '0',
          confidence: 0,
        })),
        trend: 'stable',
        key_concerns: [],
        metadata: {
          total_analyzed: emails.length,
          avg_sentiment: 0,
        },
      };
      
      return await callClaudeParsed(
        prompt,
        SentimentAnalysisSchema,
        {
          temperature: 0, *// Déterministe*
          maxTokens: 1500,
          fallback,
        }
      );
    });
    
    *// Step 3: Calculate health score*
    const healthScore = await step.run('calculate-score', async () => {
      return calculateHealthScore(
        clientId,
        emails,
        sentimentResult
      );
    });
    
    *// Step 4: Generate insights (BATCH INVARIANT)*
    const insights = await step.run('generate-insights', async () => {
      const client = emails[0].client;
      
      const context: InsightContext = {
        clientName: client.name,
        healthScore,
        emailCount: emails.length,
        periodDays: 30,
        lastContactDays: Math.floor(
          (Date.now() - emails[0].sent_at.getTime()) / (86400 * 1000)
        ),
        scoreComponents: {
          engagement: 20, *// TODO: calculate from real data*
          sentiment: Math.round(sentimentResult.metadata.avg_sentiment * 30),
          resolution: 15,
          lifecycle: 8,
        },
        recentActivity: summarizeActivity(emails.slice(0, 5)),
        scoreHistory: await getScoreHistory(clientId),
        keyConcerns: sentimentResult.key_concerns,
      };
      
      const prompt = buildInsightsPrompt(context);
      
      const fallback: z.infer<typeof InsightsSchema> = {
        insights: [{
          type: 'info',
          text: 'Analysis in progress',
          priority: 1,
          evidence: 'Insufficient data',
        }],
        actions: [{
          text: 'Retry analysis in 1 hour',
          urgency: 'this_week',
        }],
        summary: 'Analysis incomplete',
        metadata: {
          confidence: 0,
          data_quality: 'low',
        },
      };
      
      return await callClaudeParsed(
        prompt,
        InsightsSchema,
        {
          temperature: 0,
          maxTokens: 2000,
          fallback,
        }
      );
    });
    
    *// Step 5: Persist results*
    await step.run('save-results', async () => {
      await db.$transaction([
        *// Update client*
        db.client.update({
          where: { id: clientId },
          data: {
            health_score: healthScore,
            last_analyzed_at: new Date(),
            analysis_status: 'completed',
          },
        }),
        
        *// Save insights*
        db.clientInsight.create({
          data: {
            client_id: clientId,
            insights_json: insights,
          },
        }),
        
        *// Create alerts if needed*
        ...(healthScore < 50 ? [
          db.alert.create({
            data: {
              user_id: emails[0].client.user_id,
              client_id: clientId,
              type: 'at_risk',
              severity: 'high',
              title: `${emails[0].client.name} à risque`,
              message: insights.summary,
            },
          }),
        ] : []),
      ]);
    });
    
    return {
      clientId,
      healthScore,
      insightsCount: insights.insights.length,
      confidence: insights.metadata.confidence,
    };
  }
);
```

---

## 4.4 Tests Batch Invariance

```tsx
*// tests/batch-invariance.test.ts*

import { describe, it, expect } from 'vitest';
import { 
  buildSentimentPrompt, 
  SentimentAnalysisSchema,
} from '@/lib/prompts/sentiment-analysis';
import { callClaudeParsed } from '@/lib/claude-parser';

describe('Batch Invariance', () => {
  const mockEmails = [
    {
      client_name: 'Test Client',
      is_from_client: true,
      sent_at: new Date('2025-01-15'),
      body_preview: 'Merci pour votre aide, tout fonctionne bien maintenant.',
    },
    {
      client_name: 'Test Client',
      is_from_client: false,
      sent_at: new Date('2025-01-14'),
      body_preview: 'Ravi que ça fonctionne ! N\'hésitez pas si besoin.',
    },
  ];
  
  it('should return same result for same input (3 runs)', async () => {
    const prompt = buildSentimentPrompt(mockEmails);
    
    const results = await Promise.all([
      callClaudeParsed(prompt, SentimentAnalysisSchema, { temperature: 0 }),
      callClaudeParsed(prompt, SentimentAnalysisSchema, { temperature: 0 }),
      callClaudeParsed(prompt, SentimentAnalysisSchema, { temperature: 0 }),
    ]);
    
    *// Vérifier structure identique*
    expect(results[0].sentiments.length).toBe(results[1].sentiments.length);
    expect(results[0].sentiments.length).toBe(results[2].sentiments.length);
    
    *// Vérifier scores identiques (ou très proches)*
    results[0].sentiments.forEach((s, i) => {
      expect(s.score).toBe(results[1].sentiments[i].score);
      expect(s.score).toBe(results[2].sentiments[i].score);
    });
    
    *// Trend doit être identique*
    expect(results[0].trend).toBe(results[1].trend);
    expect(results[0].trend).toBe(results[2].trend);
    
  }, { timeout: 30000 }); *// 30s timeout pour 3 API calls*
  
  it('should validate output against schema', async () => {
    const prompt = buildSentimentPrompt(mockEmails);
    
    const result = await callClaudeParsed(
      prompt,
      SentimentAnalysisSchema,
      { temperature: 0 }
    );
    
    *// Si ça ne throw pas, la validation Zod a réussi*
    expect(result.sentiments).toHaveLength(2);
    expect(result.metadata.total_analyzed).toBe(2);
    expect(['improving', 'stable', 'degrading']).toContain(result.trend);
  });
  
  it('should handle parsing edge cases', async () => {
    const edgeCases = [
      '```json\n{"sentiments": [], "trend": "stable", "key_concerns": [], "metadata": {"total_analyzed": 0, "avg_sentiment": 0}}\n```',
      '{"sentiments": [], "trend": "stable", "key_concerns": [], "metadata": {"total_analyzed": 0, "avg_sentiment": 0}}',
      'Here is the result: {"sentiments": [], "trend": "stable", "key_concerns": [], "metadata": {"total_analyzed": 0, "avg_sentiment": 0}}',
    ];
    
    for (const text of edgeCases) {
      const result = await parseClaudeJSON(
        text,
        SentimentAnalysisSchema,
        { fallback: undefined }
      );
      
      expect(result.trend).toBe('stable');
    }
  });
});
```

---

## 4.5 Monitoring Déterminisme

```tsx
*// lib/ai-monitoring.ts (ajout)/***
 * Test périodique de batch invariance
 * Alerte si dérive détectée
 **/*
export async function monitorBatchInvariance() {
  const testPrompt = buildSentimentPrompt([
    {
      client_name: 'Canary Test',
      is_from_client: true,
      sent_at: new Date(),
      body_preview: 'Test message for monitoring',
    },
  ]);
  
  *// 3 appels identiques*
  const results = await Promise.all([
    callClaudeParsed(testPrompt, SentimentAnalysisSchema, { temperature: 0 }),
    callClaudeParsed(testPrompt, SentimentAnalysisSchema, { temperature: 0 }),
    callClaudeParsed(testPrompt, SentimentAnalysisSchema, { temperature: 0 }),
  ]);
  
  *// Comparer*
  const allEqual = 
    results[0].sentiments[0].score === results[1].sentiments[0].score &&
    results[1].sentiments[0].score === results[2].sentiments[0].score &&
    results[0].trend === results[1].trend &&
    results[1].trend === results[2].trend;
  
  if (!allEqual) {
    await sendAlert({
      type: 'batch_invariance_violation',
      severity: 'critical',
      message: 'Claude API returned different results for identical prompts',
      data: { results },
    });
  }
  
  *// Log*
  await db.batchInvarianceLog.create({
    data: {
      test_prompt_hash: hashPrompt(testPrompt),
      passed: allEqual,
      results_json: results,
      tested_at: new Date(),
    },
  });
  
  return allEqual;
}

*// Cron : tester 1x/jour// SELECT cron.schedule('test-batch-invariance', '0 3 * * *', $$//   SELECT monitor_batch_invariance()// $$);*
```

# 5️⃣ ROADMAP, BUDGET & PITCH

## **5.1 Plan de Développement (12 mois)**

### **Vue d'ensemble Timeline**

```tsx
┌──────────────────────────────────────────────────────────────────┐
│                    ANNÉE 1 - Norva                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  M1-M2     M3-M4      M5-M6      M7-M8      M9-M10    M11-M12    │
│  ┌───┐     ┌──┐      ┌──┐       ┌─────┐     ┌────┐     ┌───┐     │
│  │MVP│ →   │V1│  →   │V2│   →   │Scale│  →  │Team│ →   │MRR│     │
│  └───┘     └──┘      └──┘       └─────┘     └────┘     └───┘     │
│    │         │         │           │           │         │       │
│    │         │         │           │           │         │       │
│   Dev      Beta    GA Launch     Growth    Iteration  Profitable │
│  Solo    5 users    20 users    50 users   100 users  Break-even │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Phase 1 : MVP Development (M1-M2) - 8 semaines

**Objectif** : POC fonctionnel avec 5 beta testers.

### Semaine 1-2 : Setup & Infrastructure

```tsx
*// Checklist technique*
const setupTasks = {
  infrastructure: [
    '✓ Créer comptes : Supabase EU, Vercel, Clerk, Nylas, Stripe',
    '✓ Setup repo GitHub + CI/CD',
    '✓ Init Next.js 15 + shadcn/ui',
    '✓ Config Tailwind (palette minimaliste)',
    '✓ Setup tRPC + Prisma',
  ],
  
  boilerplate: [
    '✓ Auth flow (Clerk)',
    '✓ DB schema (Supabase)',
    '✓ Layout de base (navbar, footer)',
    '✓ Design system (composants UI)',
  ],
  
  deliverable: 'Landing page + Auth',
};
```

**Checklist détaillée S1-S2** :

- [ ]  Landing page responsive (Claude-style)
- [ ]  Sign up / Login (Clerk)
- [ ]  `/dashboard` vide (skeleton)
- [ ]  Design system validé (couleurs, typo, composants)
- [ ]  Deploy Vercel staging

**Effort** : 40h (5j × 8h)

**Risques** : Setup Nylas (OAuth complexe) → Prévoir 1j buffer

---

### Semaine 3-4 : Onboarding Flow

```tsx
const onboardingTasks = {
  pages: [
    '✓ /onboarding - Connexion Outlook (Nylas OAuth)',
    '✓ /onboarding/periode - Sélection 7/30/90 jours',
    '✓ /onboarding/clients - Détection + validation',
  ],
  
  backend: [
    '✓ Nylas integration (fetch emails)',
    '✓ Client detection algorithm',
    '✓ Background job: initial analysis (Inngest)',
  ],
  
  deliverable: 'Onboarding complet end-to-end',
};
```

**Checklist S3-S4** :

- [ ]  OAuth Outlook fonctionnel (test avec vrai compte)
- [ ]  Détection clients >80% précision (test 100 emails)
- [ ]  Job analyse initiale <5min pour 20 clients
- [ ]  UI responsive + loading states

**Effort** : 60h (7.5j)

**Risques** :

- Nylas API rate limits → Implémenter retry logic
- Détection clients imprécise → A/B test algorithmes

---

### Semaine 5-6 : Dashboard & Analyse IA

```tsx
const analysisTasks = {
  prompts: [
    '✓ Prompt sentiment analysis (batch invariant)',
    '✓ Prompt insights generation',
    '✓ Tests validation Zod',
  ],
  
  dashboard: [
    '✓ Liste clients avec scores',
    '✓ Filtres (à risque, stables, sains)',
    '✓ Search bar',
  ],
  
  backend: [
    '✓ Calculate health score (4 composantes)',
    '✓ Claude API integration',
    '✓ Caching Redis (avoid re-analysis)',
  ],
  
  deliverable: 'Dashboard fonctionnel avec scores',
};
```

**Checklist S5-S6** :

- [ ]  Prompts Claude validés (batch invariance tests)
- [ ]  Dashboard affiche 20 clients en <500ms
- [ ]  Scores cohérents (pas de variations aléatoires)
- [ ]  Coût IA <$1 par user pour analyse initiale

**Effort** : 50h (6j)

**Risques** : Prompts instables → Investir temps en tests

---

### Semaine 7-8 : Fiche Client & Polish

```tsx
const clientDetailTasks = {
  pages: [
    '✓ /client/[slug] - Fiche détaillée',
    '✓ Score evolution chart (Recharts)',
    '✓ AI Insights section',
    '✓ Email threads accordion',
  ],
  
  features: [
    '✓ Refresh analysis (rate limited)',
    '✓ Alertes (clients à risque)',
    '✓ Settings (profil, reconnect email)',
  ],
  
  polish: [
    '✓ Loading states partout',
    '✓ Error handling gracieux',
    '✓ Animations micro-interactions',
    '✓ Tests E2E (Playwright)',
  ],
  
  deliverable: 'MVP production-ready',
};
```

**Checklist S7-S8** :

- [ ]  Fiche client complète et rapide (<300ms)
- [ ]  Chart évolution score fonctionnel
- [ ]  0 bug critique (Sentry monitoring)
- [ ]  Tests E2E couvrent happy path
- [ ]  Performance Lighthouse >90

**Effort** : 50h (6j)

**MVP COMPLET** ✅

---

### Phase 2 : Beta Testing (M3) - 4 semaines

**Objectif** : Valider product-market fit avec 5 beta users.

### Semaine 9-10 : Recrutement Beta

```tsx
Actions :
1. Identifier 10 candidats (réseau associé Head of CS)
2. Calls individuels (30min) pour présenter
3. Sélectionner 5 profils variés :
   - 2 CSM solo (freelance)
   - 2 CSM en ESN (5-20 personnes)
   - 1 Head of CS (team de 3-4)

Critères sélection :
✓ Utilise Outlook quotidiennement
✓ Gère 15-50 clients actifs
✓ Disponible pour feedback hebdo (30min call)
✓ Motivé par la problématique churn

Incentive :
- Accès gratuit 6 mois
- Credits pour influencer roadmap
- Mention "Founding user" (si accord)
```

### Semaine 11-12 : Feedback Loop

```tsx
Rituels hebdo :
┌─────────────────────────────────────┐
│ Lundi : Check-in async (Slack)     │
│ Mercredi : Office hours (30min)    │
│ Vendredi : NPS survey + bugs       │
└─────────────────────────────────────┘

Métriques à tracker :
- Taux de complétion onboarding
- Temps pour premier "aha moment"
- Fréquence d'usage (daily active ?)
- Features les plus/moins utilisées
- Bugs reportés (criticité)

Objectif fin M3 :
✓ 5/5 beta users ont complété onboarding
✓ 3/5 se connectent quotidiennement
✓ NPS >40
✓ 0 bug bloquant
✓ 2-3 features requests prioritaires identifiées
```

**Décision Go/No-Go M4** :

- Si NPS <30 → Pivot ou itération majeure
- Si NPS 30-50 → Itérer features avant GA
- Si NPS >50 → GO pour General Availability

---

### Phase 3 : V1 Launch (M4-M5) - 8 semaines

**Objectif** : Lancer publiquement avec pricing activé. Target 20 paying users.

### Semaine 13-16 : Pre-launch

```tsx
const preLaunchTasks = {
  product: [
    '✓ Billing (Stripe Checkout + webhooks)',
    '✓ Plans (Gratuit / Starter 49€ / Pro 99€)',
    '✓ Onboarding guidé amélioré (tooltips)',
    '✓ Page /pricing',
    '✓ Help center basique (FAQ)',
  ],
  
  marketing: [
    '✓ Landing page optimisée conversion',
    '✓ Case studies (2 beta users)',
    '✓ Product Hunt launch prep',
    '✓ LinkedIn posts (associé)',
    '✓ Demo video (2min)',
  ],
  
  legal: [
    '✓ CGV/CGU validées (avocat)',
    '✓ Politique confidentialité (RGPD)',
    '✓ Mentions légales',
  ],
};
```

### Semaine 17-20 : Launch Campaign

```tsx
Timeline lancement :

J-7  : Teasing LinkedIn (associé)
       "Something is coming... 🧭"
       
J-3  : Product Hunt scheduling
       Beta users prêts à upvoter

J-0  : 🚀 LAUNCH
       ├─ Product Hunt (6am PST)
       ├─ LinkedIn post (associé + vous)
       ├─ Email beta users (ask testimonial)
       ├─ Posts communautés CS
       │  (CSM Practice, Customer Success Forum)
       └─ Outreach direct (50 CSM qualifiés)

J+1  : Monitoring + support réactif
       Répondre tous les comments PH <1h

J+7  : Recap launch (metrics transparentes)
       Partager learnings LinkedIn

J+30 : Retrospective
       ARR, CAC, Churn, NPS
```

**Objectif M5** :

- 100 sign-ups
- 20 paying users (mix Starter/Pro)
- ARR : ~1,200€/mois (20 × 60€ avg)
- CAC <100€ (organique majoritairement)

---

### Phase 4 : Growth & Iteration (M6-M8) - 12 semaines

**Objectif** : Atteindre 50 paying users, MRR 3k€.

### Features V1.5 (Quick wins)

```tsx
const quickWinsV15 = {
  *// Based on beta feedback*
  features: [
    '✓ Export client report (PDF)',
    '✓ Email notifications (daily digest)',
    '✓ Slack integration (alerts)',
    '✓ Bulk actions (mark clients as "handled")',
    '✓ Custom tags clients',
  ],
  
  improvements: [
    '✓ Onboarding <3min (vs 5min)',
    '✓ Dashboard loading <200ms',
    '✓ Mobile responsive optimisé',
    '✓ Multilangue (EN) si demand international',
  ],
};
```

### Growth Levers

```tsx
Channels acquisition (M6-M8) :

1. CONTENT MARKETING (Inbound)
   - Blog : "10 signaux de churn invisibles"
   - LinkedIn : Posts hebdo (associé)
   - SEO : "logiciel customer success", "outil csm"
   
2. PARTNERSHIPS
   - Intégrations : Salesforce, HubSpot (roadmap)
   - Resellers : Agences CS (commission 20%)
   - Communautés : Sponsoring Customer Success meetups
   
3. REFERRAL PROGRAM
   - Parrainer 1 client → 1 mois offert
   - Display in-app : "Invite teammates"
   
4. SALES DIRECT (Associé)
   - Outreach LinkedIn (200 CSM/mois)
   - Demos sur-mesure (15min calls)
   - Target : ESN 10-50 personnes
```

**Objectif M8** :

- 50 paying users
- MRR : 3,000€ (mix plans)
- Churn <5% (retention excellent)
- CAC <150€ (avec paid ads)

---

### Phase 5 : Team Features (M9-M10) - 8 semaines

**Objectif** : Activer Persona 3 (Rémi, Head of CS). Target team plans.

### Epic Team Dashboard

```tsx
const teamFeatures = {
  views: [
    '✓ /team - Vue agrégée portfolio équipe',
    '✓ Leaderboard CSM (par health score moyen)',
    '✓ Clients non assignés (pool commun)',
    '✓ Analytics équipe (temps réponse, volume)',
  ],
  
  collaboration: [
    '✓ Assigner clients à CSM',
    '✓ Commentaires internes (notes clients)',
    '✓ Guidelines équipe (SLA, tone of voice)',
    '✓ Activity feed ("Sarah a contacté ACME")',
  ],
  
  pricing: [
    '✓ Plan Team : 39€/user/mois (min 3 users)',
    '✓ Seat-based billing (add/remove users)',
  ],
};
```

**Impact business** :

- ACV (Annual Contract Value) × 3
    - Solo : 49€ × 12 = 588€/an
    - Team (5 users) : 39€ × 5 × 12 = 2,340€/an
- Churn réduit (switching cost élevé)
- Upsell naturel (add seats)

**Objectif M10** :

- 10 team accounts (avg 4 users = 40 seats)
- MRR : 5,000€
- Logo clients notables (1-2 scale-ups)

---

### Phase 6 : Profitability (M11-M12) - 8 semaines

**Objectif** : Break-even. MRR > Coûts mensuels.

### Optimisations Coûts

```tsx
const costOptimizations = {
  infrastructure: [
    'Négocier tarif Nylas (volume discount)',
    'Optimiser Claude API (cache agressif)',
    'Supabase : passer plan Pro (meilleur ratio)',
  ],
  
  product: [
    'Self-serve onboarding (moins de support)',
    'Knowledge base (deflect tickets)',
    'Automated email sequences (nurture)',
  ],
  
  growth: [
    'Focus SEO (organique)',
    'Referral program (CAC = 0)',
    'Community building (Slack gratuit)',
  ],
};
```

### Budget Mensuel M12

```tsx
REVENUS (100 users payants)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
60 × Starter (49€)      = 2,940€
30 × Pro (99€)          = 2,970€
10 × Team (39€ × 4)     = 1,560€
                        ────────
TOTAL MRR               = 7,470€
ARR                     = 89,640€

COÛTS FIXES
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Infrastructure :
- Supabase Pro           150€
- Vercel Pro             20€
- Nylas (100 mailbox)    800€ (négocié à 8€/user)
- Upstash/Inngest        50€
- Monitoring (Sentry)    30€
- Stripe fees (2.9%)     220€
Subtotal infra          1,270€

Software :
- Anthropic Claude API   800€ (~100 users × 8€)
- Misc (Figma, tools)    50€
Subtotal software        850€

Admin :
- Comptabilité           100€
- Assurances             80€
- Legal (amortized)      50€
Subtotal admin           230€
                        ────────
TOTAL COÛTS FIXES       2,350€

MARGE BRUTE             5,120€ (69%)
                        ════════

SALAIRE FONDATEUR       3,000€/mois (modeste)
                        ────────
PROFIT NET              2,120€/mois
                        ════════
```

**Break-even atteint à ~40 paying users** (mix plans)

## 5.2 Budget Détaillé 12 Mois

### Investissement Initial (M0)

```tsx
SETUP INITIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Juridique :
- Création société (SAS)     500€
- CGV/CGU (avocat spécialisé) 800€
- DPA RGPD template          150€
Subtotal                    1,450€

Outils dev (one-time) :
- Domaine (Norva.com)       15€
- Logo/branding (Fiverr)     150€
- Notion/tools               0€ (free tiers)
Subtotal                     165€

Buffer imprévu               385€
                            ──────
TOTAL INITIAL               2,000€
```

### Coûts Mensuels Récurrents

```tsx
PHASE         M1-3   M4-6   M7-9   M10-12
Users         0      10     30     80
────────────────────────────────────────
Infra         100€   200€   500€   1,200€
AI (Claude)   50€    100€   300€   700€
Nylas         50€    100€   250€   650€
Admin         150€   150€   150€   200€
────────────────────────────────────────
TOTAL/mois    350€   550€   1,200€ 2,750€
```

### Budget Total Année 1

```tsx
POSTES                   MONTANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Setup initial            2,000€
Infra M1-M12            12,000€
Legal & admin            2,000€
Marketing (ads M6-M12)   3,000€
                        ────────
TOTAL INVESTISSEMENT    19,000€

REVENUS M4-M12          45,000€ (cumulé)
                        ════════
RÉSULTAT NET            +26,000€
                        ════════
```

**Avec budget 5k€ initial** :

- Couverture : M1-M6 (avant revenus significatifs)
- M7+ : Auto-financé par revenus
- Pas besoin de lever fonds
- Rentable dès M8-M9

---

## 5.3 Métriques Clés (KPIs)

### Dashboard Founder (à suivre hebdo)

```tsx
const founderKPIs = {
  // North Star Metric
  weeklyActiveUsers: {
    definition: 'Users qui se connectent 3+/semaine',
    target: {
      M3: 5,
      M6: 20,
      M9: 50,
      M12: 100,
    },
  },
  
  // Revenue
  mrr: {
    definition: 'Monthly Recurring Revenue',
    target: {
      M4: 500,
      M6: 1500,
      M9: 4000,
      M12: 7500,
    },
    unit: '€',
  },
  
  // Growth
  signups: {
    definition: 'New accounts créés/semaine',
    target: {
      M4: 10,
      M6: 20,
      M9: 30,
      M12: 40,
    },
  },
  
  conversionRate: {
    definition: 'Signup → Paying (within 14 days)',
    target: '20%', // Industry standard SaaS B2B
    benchmark: {
      excellent: '>30%',
      good: '15-30%',
      poor: '<15%',
    },
  },
  
  // Retention
  churnRate: {
    definition: 'Users qui cancel/mois',
    target: '<5%',
    acceptable: '<10%',
    critical: '>15%',
  },
  
  // Health
  nps: {
    definition: 'Net Promoter Score',
    target: {
      M3: 40,
      M6: 50,
      M12: 60,
    },
    calculation: '% Promoters (9-10) - % Detractors (0-6)',
  },
  
  // Efficiency
  cac: {
    definition: 'Customer Acquisition Cost',
    calculation: 'Marketing spend / New customers',
    target: '<100€',
    acceptable: '<200€',
    ltv_cac_ratio: '>3', // LTV should be 3× CAC minimum
  },
  
  // Product
  timeToValue: {
    definition: 'Temps signup → premier insight utile',
    target: '<10min',
    measured: 'Analytics + User interviews',
  },
};
```

### Red Flags (À surveiller)

```tsx
🚨 ALERTS CRITIQUES

Churn >10% pendant 2 mois
→ Action : User interviews urgentes
→ Peut indiquer : Product-market fit faible

Conversion <10%
→ Action : Analyser funnel onboarding
→ Peut indiquer : Onboarding trop complexe

CAC >LTV
→ Action : Stopper paid ads, focus organique
→ Peut indiquer : Pricing trop bas

NPS <30
→ Action : Pivot features ou positionnement
→ Peut indiquer : Mauvais fit users/produit

Coût IA >40% MRR
→ Action : Optimiser prompts, cache
→ Peut indiquer : Pricing non viable
```

---

## 5.4 Pitch Deck (Structure)

### Slide 1 : Couverture

```tsx
┌─────────────────────────────────────┐
│                                     │
│            🧭 Norva               │
│                                     │
│   Your Customer Success Copilot     │
│                                     │
│   Détectez les clients à risque     │
│   avant qu'il ne soit trop tard     │
│                                     │
│   [Votre Nom] & [Associé]           │
│   contact@Norva.fr                │
│                                     │
└─────────────────────────────────────┘
```

### Slide 2 : Problème

```tsx
LE PROBLÈME

Les CSM perdent 40% de leur temps à trier 
leurs emails et ratent les signaux de churn.

📊 Faits :
- 80% des signaux de churn sont dans les emails
- Temps moyen par CSM : 2h/jour de tri manuel
- 67% des churn auraient pu être évités
  (Gartner, 2024)

💡 Insight :
Les outils actuels (Salesforce, Gainsight) 
analysent le CRM, pas les vraies conversations.
```

### Slide 3 : Solution

```tsx
Norva = L'IA QUI LIT VOS EMAILS CLIENTS

┌──────────────────────────────────────────┐
│ 1. Connectez Outlook      (2 min)       │
│ 2. IA analyse automatique (5 min)       │
│ 3. Dashboard intelligent  (quotidien)   │
└──────────────────────────────────────────┘

✨ Bénéfices :
- Détection churn 2× plus rapide
- 2h/jour économisées par CSM
- -30% churn client (early data)

[Screenshot dashboard avec score 32 → alerte]
```

### Slide 4 : Produit (Demo)

```tsx
COMMENT ÇA MARCHE

[Vidéo 90 secondes ou GIF animé]

1. Connexion Outlook OAuth
2. Détection automatique clients
3. Analyse IA (sentiment, patterns)
4. Score santé 0-100 par client
5. Insights actionnables

Exemple insight :
"⚠️ ACME Corp - Score 32
Temps de réponse dégradé : 4h → 2 jours
Action : Appeler aujourd'hui"
```

### Slide 5 : Marché

```tsx
MARCHÉ & OPPORTUNITÉ

TAM (Total Addressable Market)
├─ 150k CSM en France (LinkedIn data)
├─ 1M CSM en Europe
└─ 5M CSM worldwide

SAM (Serviceable Available)
├─ CSM en agence/conseil : 30k (France)
├─ ARPU : 600€/an
└─ SAM = 18M€/an (France seule)

SOM (Serviceable Obtainable - Year 3)
├─ 1% market share
├─ 300 clients × 4 users × 450€/an
└─ SOM = 540k€ ARR
```

### Slide 6 : Concurrence

```tsx
POSITIONNEMENT

                Prix
                 ↑
                 │
    Gainsight •  │  • Salesforce Einstein
    (Lourd)      │     (Complexe)
                 │
    Vitally •    │
                 │
                 │    🧭 Norva
                 │    (Simple, AI-first)
Custify •        │
(Basique)        │
                 │
                 └──────────────────→
              Simplicité

DIFFÉRENCIATION :
✓ Email-native (pas CRM-dependent)
✓ Setup <5min (vs jours pour Gainsight)
✓ Prix accessible (49€ vs 10k€/an)
✓ IA qualitative (pas que metrics)
```

### Slide 7 : Business Model

```tsx
MODÈLE ÉCONOMIQUE

Plans SaaS :
┌──────────────────────────────────────┐
│ Gratuit    Starter    Pro    Team   │
│ 0€         49€/mois   99€     39€/u  │
│ 5 clients  20         50      Unlimited│
└──────────────────────────────────────┘

Unit Economics (Starter) :
- ARPU : 588€/an
- CAC : 80€ (organique)
- Churn : 5%/mois → LTV = 1,100€
- LTV/CAC : 13.75× ✅

Monetization levers :
1. Upsell (Starter → Pro)
2. Expansion (add users)
3. Add-ons (API access, custom integrations)
```

### Slide 8 : Traction

```tsx
TRACTION EARLY (M3)

📊 Métriques :
- 5 beta users actifs
- NPS : 62 (excellent)
- Retention : 100% (M1-M3)
- Time to value : 7min avg

💬 Testimonials :
"J'ai détecté 2 clients à risque que 
j'aurais ratés sans Norva"
— Sarah M., CSM Freelance

"Gagné 1.5h/jour de tri manuel"
— Marc D., ESN 20 personnes

🎯 Pipeline M4 :
- 15 demos planifiées
- 3 LOI (Letter of Intent) signées
```

### Slide 9 : Roadmap

```tsx
ROADMAP PRODUIT

2025 Q1-Q2 : MVP + Beta
├─ ✅ Outlook integration
├─ ✅ Health scoring
├─ ✅ Dashboard
└─ ⏳ Billing (Stripe)

2025 Q3 : Team Features
├─ Multi-user accounts
├─ Team dashboard
├─ Collaboration tools
└─ Slack integration

2025 Q4 : Expansion
├─ Gmail support
├─ Salesforce integration
├─ Mobile app
└─ API publique

2026 : Scale
├─ Multi-langue (EN, ES, DE)
├─ Enterprise features (SSO, etc.)
└─ Predictive churn ML model
```

### Slide 10 : Équipe

```tsx
L'ÉQUIPE

┌────────────────────────────────────┐
│ [VOUS]                             │
│ Co-founder & CEO                   │
│                                    │
│ • 5 ans Product Management        │
│ • Ex-[Company notable]            │
│ • Expert SaaS B2B                 │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ [ASSOCIÉ]                          │
│ Co-founder & Head of Sales        │
│                                    │
│ • Head of CS chez [Company]       │
│ • 8 ans Customer Success          │
│ • Réseau 500+ CSM                 │
└────────────────────────────────────┘

Advisors (si applicable) :
- [Expert IA / SaaS / Growth]
```

### Slide 11 : Financials

```tsx
PROJECTIONS FINANCIÈRES

       M6      M12     M24     M36
Users  20      100     400     1,000
────────────────────────────────────
MRR    1.5k€   7.5k€   30k€    80k€
ARR    18k€    90k€    360k€   960k€

Profitability :
├─ Break-even : M8 (40 users)
├─ Profitable : M9+
└─ No fundraising needed (bootstrap)

Use of funds (si levée) :
- 60% Growth (Marketing, Sales)
- 25% Product (Features, Infra)
- 15% Operations (Legal, Admin)
```

### Slide 12 : Ask

```tsx
CE QUE NOUS CHERCHONS

🎯 AUJOURD'HUI (M3) :
- Early customers (beta → paying)
- Strategic advisors (CS domain)
- Potential partners (integrations)

💰 OPTION LEVÉE (M6-M9) :
- 150k€ seed round
- Valuation : 1.5M€ (10% dilution)
- Use : Accélérer growth (ads, sales)

📈 OBJECTIF :
- M12 : 100 paying users
- M24 : 400 users, 30k€ MRR
- M36 : Profitable, exit options

┌────────────────────────────────────┐
│   REJOIGNEZ-NOUS                   │
│   contact@Norva.fr               │
│   Norva.fr/demo                  │
└────────────────────────────────────┘
```

---

## 5.5 Stratégie Go-to-Market

### Acquisition Channels (Priorité)

```tsx
const gtmStrategy = {
  *// Tier 1 : Lancement (M1-M6)*
  tier1: {
    channels: [
      {
        name: 'Réseau direct (Associé)',
        effort: 'Low',
        cost: '0€',
        cac: '0€',
        volume: '5-10 users/mois',
        priority: '🔥 Critique',
      },
      {
        name: 'Product Hunt',
        effort: 'Medium',
        cost: '0€',
        cac: '0€',
        volume: '20-50 sign-ups (one-time)',
        priority: '⭐ Important',
      },
      {
        name: 'LinkedIn Organic (Associé)',
        effort: 'Low',
        cost: '0€',
        cac: '0€',
        volume: '3-5 users/mois',
        priority: '⭐ Important',
      },
    ],
    totalCost: '0€/mois',
    expectedUsers: '10-20/mois',
  },
  
  *// Tier 2 : Growth (M7-M12)*
  tier2: {
    channels: [
      {
        name: 'LinkedIn Ads',
        effort: 'Medium',
        cost: '500€/mois',
        cac: '100€',
        volume: '5 users/mois',
        priority: '⭐ Test & Learn',
      },
      {
        name: 'Content Marketing (Blog SEO)',
        effort: 'High',
        cost: '200€/mois (freelance writer)',
        cac: '50€',
        volume: '4 users/mois',
        priority: '⭐⭐ Long-term',
      },
      {
        name: 'Referral Program',
        effort: 'Low',
        cost: '0€ (1 mois offert)',
        cac: '40€',
        volume: '2-3 users/mois',
        priority: '⭐ Quick win',
      },
      {
        name: 'Partnerships (Agences CS)',
        effort: 'High',
        cost: '0€ (commission 20%)',
        cac: '120€ (commission)',
        volume: '5-10 users/mois',
        priority: '⭐⭐ Strategic',
      },
    ],
    totalCost: '700€/mois',
    expectedUsers: '15-25/mois',
  },
  
  *// Tier 3 : Scale (M13+)*
  tier3: {
    channels: [
      'Google Ads (Search)',
      'Webinars (Lead gen)',
      'Events (Sponsoring CS conferences)',
      'Outbound Sales (SDR)',
      'Affiliates',
    ],
  },
};
```

---

## 5.6 Risques & Mitigation

```tsx
const risks = {
  technical: [
    {
      risk: 'Nylas API instable ou rate limits',
      impact: 'High',
      probability: 'Medium',
      mitigation: [
        'Implémenter retry logic robuste',
        'Cache agressif (Redis)',
        'Plan B : Développer OAuth direct (M12)',
      ],
    },
    {
      risk: 'Claude API coûts explosent',
      impact: 'High',
      probability: 'Low',
      mitigation: [
        'Monitoring quotidien des coûts',
        'Alert si >$50/jour',
        'Optimiser prompts (batch processing)',
        'Cache résultats 24h',
      ],
    },
    {
      risk: 'Performance dashboard <500ms',
      impact: 'Medium',
      probability: 'Medium',
      mitigation: [
        'Redis caching',
        'Pagination aggressive',
        'Lazy loading composants',
        'CDN (Vercel Edge)',
      ],
    },
  ],
  
  business: [
    {
      risk: 'Product-market fit faible (NPS <30)',
      impact: 'Critical',
      probability: 'Medium',
      mitigation: [
        'Beta testing rigoureux (M3)',
        'User interviews hebdo',
        'Pivot rapide si signaux négatifs',
        'Budget préservé pour itération',
      ],
    },
    {
      risk: 'Churn >15%',
      impact: 'High',
      probability: 'Medium',
      mitigation: [
        'Onboarding guidé (reduce time-to-value)',
        'Success check-ins (J7, J30)',
        'Feature usage analytics',
        'Win-back campaigns',
      ],
    },
    {
      risk: 'CAC >LTV',
      impact: 'High',
      probability: 'Low',
      mitigation: [
        'Focus organique (M1-M6)',
        'Tester paid ads petit budget (M7)',
        'Referral program (CAC = 0)',
        'Pricing ajusté si nécessaire',
      ],
    },
  ],
  
  legal: [
    {
      risk: 'Violation RGPD',
      impact: 'Critical',
      probability: 'Low',
      mitigation: [
        'Audit RGPD par avocat (M4)',
        'Privacy by design (RLS, encryption)',
        'DPA signé avec sous-traitants',
        'Logs accès (audit trail)',
      ],
    },
    {
      risk: 'Nylas/Anthropic TOS change',
      impact: 'Medium',
      probability: 'Low',
      mitigation: [
        'Veille contractuelle',
        'Plan B providers identifiés',
        'Architecture découplée (easy swap)',
      ],
    },
  ],
};
```

---

## 5.7 Prochaines Étapes Immédiates

### Checklist Pre-Dev (Semaine 0)

```tsx
## AVANT DE CODER

### Validation Marché
- [ ] 10 interviews CSM (valider pain points)
- [ ] Identifier 5 beta testers engagés
- [ ] Analyser 3 concurrents (features, pricing, reviews)
- [ ] Valider willingness to pay (49€ acceptable ?)

### Setup Business
- [ ] Créer structure juridique (SAS ou micro ?)
- [ ] Ouvrir compte bancaire pro
- [ ] Setup compta (Indy, Pennylane)
- [ ] Souscrire RC Pro (assurance)

### Setup Tech
- [ ] Acheter domaine Norva.fr
- [ ] Créer comptes :
  - [ ] GitHub Organization
  - [ ] Vercel
  - [ ] Supabase EU
  - [ ] Clerk
  - [ ] Nylas
  - [ ] Anthropic
  - [ ] Stripe
- [ ] Setup monitoring (Sentry)

### Legal RGPD
- [ ] Rédiger politique confidentialité
- [ ] CGV/CGU (template + review avocat)
- [ ] DPA avec Nylas, Anthropic, Supabase
- [ ] Registre traitement données (CNIL)

### Design
- [ ] Moodboard (Claude.ai, Linear, Vercel)
- [ ] Logo simple (Figma ou Fiverr)
- [ ] Wireframes landing + dashboard (Figma)

### Communication
- [ ] Créer page LinkedIn Norva
- [ ] Setup email (contact@Norva.fr)
- [ ] Préparer teasing posts

TOTAL TIME : ~2 semaines avant code
```

# Stack

Namecheap : https://ap.www.namecheap.com/domains/domaincontrolpanel/norva.io/domain

Git : https://github.com/Norva-io/norva-app

https://vercel.com/norvas-projects

https://supabase.com/dashboard/project/wqdpqxugbfixfytsnyot

- [https://wqdpqxugbfixfytsnyot.supabase.co](https://wqdpqxugbfixfytsnyot.supabase.co/)

https://dashboard.clerk.com/apps/app_35hcHiIeUCT4M8TdPzELzbpCkKd/instances/ins_35hcHcqrIsvzUQvSd5QOOJFUvuk