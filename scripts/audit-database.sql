-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║                    AUDIT COMPLET DE LA BASE DE DONNÉES                ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- À exécuter dans Supabase SQL Editor pour un audit complet

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. LISTE DES TABLES EXISTANTES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. STRUCTURE COMPLÈTE DE CHAQUE TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Table: users
SELECT
  'users' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Table: clients
SELECT
  'clients' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'clients'
ORDER BY ordinal_position;

-- Table: emails
SELECT
  'emails' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'emails'
ORDER BY ordinal_position;

-- Table: client_insights
SELECT
  'client_insights' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'client_insights'
ORDER BY ordinal_position;

-- Table: suggested_actions (si existe)
SELECT
  'suggested_actions' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'suggested_actions'
ORDER BY ordinal_position;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. INDEXES EXISTANTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. CONTRAINTES (FOREIGN KEYS, UNIQUE, CHECK)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
LEFT JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. RLS POLICIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. FONCTIONS PERSONNALISÉES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8. STATISTIQUES DES DONNÉES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Comptage par table
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'emails', COUNT(*) FROM emails
UNION ALL
SELECT 'client_insights', COUNT(*) FROM client_insights
UNION ALL
SELECT 'suggested_actions', COUNT(*) FROM suggested_actions
ORDER BY table_name;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 9. COHÉRENCE DES DONNÉES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Clients sans domaine ou domaine invalide
SELECT
  id,
  name,
  domain,
  CASE
    WHEN domain IS NULL THEN 'Domaine NULL'
    WHEN domain = '' THEN 'Domaine vide'
    WHEN domain LIKE '@%' THEN 'Commence par @'
    WHEN domain LIKE '%@%' THEN 'Contient @'
    ELSE 'OK'
  END as status
FROM clients
WHERE domain IS NULL
   OR domain = ''
   OR domain LIKE '@%'
   OR domain LIKE '%@%';

-- Emails orphelins (client_id = NULL)
SELECT
  COUNT(*) as orphan_emails_count,
  COUNT(*) FILTER (WHERE body IS NULL OR body = '') as without_body,
  COUNT(*) FILTER (WHERE body IS NOT NULL AND body != '') as with_body
FROM emails
WHERE client_id IS NULL;

-- Emails avec/sans body
SELECT
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE body IS NULL OR body = '') as without_body,
  COUNT(*) FILTER (WHERE body IS NOT NULL AND body != '') as with_body,
  ROUND(100.0 * COUNT(*) FILTER (WHERE body IS NOT NULL AND body != '') / NULLIF(COUNT(*), 0), 2) as percentage_with_body
FROM emails;

-- Distribution des emails par client
SELECT
  c.name,
  c.domain,
  c.total_emails_count as count_in_client_table,
  COUNT(e.id) as actual_email_count,
  CASE
    WHEN c.total_emails_count = COUNT(e.id) THEN '✅ Cohérent'
    ELSE '❌ Incohérent'
  END as status
FROM clients c
LEFT JOIN emails e ON e.client_id = c.id
GROUP BY c.id, c.name, c.domain, c.total_emails_count
ORDER BY c.name;

-- Clients dupliqués (même domaine)
SELECT
  domain,
  COUNT(*) as duplicate_count,
  STRING_AGG(name, ', ') as client_names
FROM clients
GROUP BY domain
HAVING COUNT(*) > 1;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 10. QUALITÉ DES DONNÉES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Emails sans sujet
SELECT COUNT(*) as emails_sans_sujet
FROM emails
WHERE subject IS NULL OR subject = '';

-- Emails sans from_email (invalide)
SELECT COUNT(*) as emails_sans_from
FROM emails
WHERE from_email IS NULL OR from_email = '';

-- Insights sans texte
SELECT COUNT(*) as insights_sans_texte
FROM client_insights
WHERE insight_text IS NULL OR insight_text = '';

-- Clients sans email de contact
SELECT
  COUNT(*) as total_clients,
  COUNT(*) FILTER (WHERE primary_contact_email IS NOT NULL) as with_contact,
  COUNT(*) FILTER (WHERE primary_contact_email IS NULL) as without_contact
FROM clients;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 11. ANALYSE DES PERFORMANCES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Taille des tables
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index inutilisés (nécessite des requêtes historiques)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY tablename, indexname;
