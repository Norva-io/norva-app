-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║                    NETTOYAGE DE LA BASE DE DONNÉES                    ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- À exécuter dans Supabase SQL Editor après avoir lu le rapport d'audit

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ATTENTION : Ce script modifie les données. Vérifier avant d'exécuter !
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. SUPPRIMER LES CLIENTS DUPLIQUÉS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- D'abord, vérifier les doublons
SELECT
  domain,
  COUNT(*) as count,
  STRING_AGG(id::text || ' (' || name || ')', ', ') as clients
FROM clients
GROUP BY domain
HAVING COUNT(*) > 1;

-- Exemple : Si vous avez 2 clients "Supervizor" avec le même domaine
-- Choisissez MANUELLEMENT celui à garder et supprimez l'autre

-- OPTION A : Garder le plus ancien et supprimer le plus récent
/*
WITH duplicates AS (
  SELECT
    id,
    domain,
    ROW_NUMBER() OVER (PARTITION BY domain ORDER BY created_at ASC) as rn
  FROM clients
)
DELETE FROM clients
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
*/

-- OPTION B : Fusionner les emails avant de supprimer
-- 1. Identifier les doublons
-- 2. Réattribuer tous les emails du doublon au client principal
-- 3. Supprimer le doublon

-- Exemple pour supervizor.com (ADAPTER LES IDs):
/*
-- 1. Trouver les IDs
SELECT id, name, created_at FROM clients WHERE domain = 'supervizor.com' ORDER BY created_at;

-- 2. Réattribuer les emails (remplacer ID_DOUBLON et ID_PRINCIPAL)
UPDATE emails
SET client_id = 'ID_PRINCIPAL'
WHERE client_id = 'ID_DOUBLON';

-- 3. Mettre à jour les compteurs
UPDATE clients
SET total_emails_count = (
  SELECT COUNT(*) FROM emails WHERE client_id = clients.id
)
WHERE id = 'ID_PRINCIPAL';

-- 4. Supprimer le doublon
DELETE FROM clients WHERE id = 'ID_DOUBLON';
*/

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. METTRE À JOUR LES COMPTEURS D'EMAILS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Recalculer total_emails_count pour tous les clients
UPDATE clients
SET total_emails_count = (
  SELECT COUNT(*)
  FROM emails
  WHERE emails.client_id = clients.id
);

-- Vérifier le résultat
SELECT
  c.name,
  c.domain,
  c.total_emails_count as count_in_table,
  COUNT(e.id) as actual_count,
  CASE
    WHEN c.total_emails_count = COUNT(e.id) THEN '✅ OK'
    ELSE '❌ Incohérent'
  END as status
FROM clients c
LEFT JOIN emails e ON e.client_id = c.id
GROUP BY c.id, c.name, c.domain, c.total_emails_count
ORDER BY c.name;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. NETTOYER LES EMAILS SANS BODY (OPTIONNEL - RECOMMANDÉ)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Option A : Supprimer les emails sans body
/*
DELETE FROM emails
WHERE body IS NULL OR body = '';
*/

-- Option B : Les garder mais les marquer pour resync
-- (Pas de colonne pour ça actuellement)

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. CORRIGER LES DOMAINES INVALIDES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Trouver les domaines avec @ au début
SELECT id, name, domain
FROM clients
WHERE domain LIKE '@%';

-- Corriger en enlevant le @
UPDATE clients
SET domain = LTRIM(domain, '@')
WHERE domain LIKE '@%';

-- Trouver les domaines avec @ au milieu (emails complets)
SELECT id, name, domain
FROM clients
WHERE domain LIKE '%@%';

-- Extraire le domaine (partie après @)
UPDATE clients
SET domain = SUBSTRING(domain FROM POSITION('@' IN domain) + 1)
WHERE domain LIKE '%@%';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. NETTOYER LES DONNÉES INVALIDES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Supprimer les emails sans from_email (invalides)
DELETE FROM emails
WHERE from_email IS NULL OR from_email = '';

-- Supprimer les insights sans texte (invalides)
DELETE FROM client_insights
WHERE insight_text IS NULL OR insight_text = '';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. OPTIMISATION : VACUUM ET ANALYZE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Récupérer l'espace disque et mettre à jour les statistiques
VACUUM ANALYZE clients;
VACUUM ANALYZE emails;
VACUUM ANALYZE client_insights;
VACUUM ANALYZE suggested_actions;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. VÉRIFICATION FINALE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Compter les lignes par table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'emails', COUNT(*) FROM emails
UNION ALL
SELECT 'client_insights', COUNT(*) FROM client_insights
UNION ALL
SELECT 'suggested_actions', COUNT(*) FROM suggested_actions;

-- Vérifier qu'il n'y a plus de doublons
SELECT domain, COUNT(*) as count
FROM clients
GROUP BY domain
HAVING COUNT(*) > 1;

-- Vérifier que tous les emails ont un client_id
SELECT COUNT(*) as orphan_count
FROM emails
WHERE client_id IS NULL;

-- Vérifier que tous les domaines sont valides
SELECT id, name, domain
FROM clients
WHERE domain IS NULL
   OR domain = ''
   OR domain LIKE '@%'
   OR domain LIKE '%@%';
