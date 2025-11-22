-- Script de vérification et correction du parsing des emails
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si la table suggested_actions existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'suggested_actions'
) AS suggested_actions_exists;

-- 2. Vérifier si la colonne body existe dans emails
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'emails'
  AND column_name = 'body'
) AS body_column_exists;

-- 3. Compter les emails avec body vide vs body rempli
SELECT
  COUNT(*) FILTER (WHERE body IS NULL OR body = '') AS emails_sans_body,
  COUNT(*) FILTER (WHERE body IS NOT NULL AND body != '') AS emails_avec_body,
  COUNT(*) AS total_emails
FROM emails;

-- 4. Vérifier les emails orphelins (client_id = NULL)
SELECT
  id,
  subject,
  from_email,
  to_emails,
  LENGTH(body) as body_length,
  received_at
FROM emails
WHERE client_id IS NULL
ORDER BY received_at DESC
LIMIT 10;

-- 5. Chercher les emails qui contiennent "cybelesoft" ou "supervizor"
SELECT
  id,
  subject,
  from_email,
  client_id,
  LENGTH(body) as body_length,
  CASE
    WHEN body ILIKE '%cybelesoft%' THEN 'Body contient cybelesoft'
    WHEN body ILIKE '%supervizor%' THEN 'Body contient supervizor'
    ELSE 'Aucune mention'
  END as contains
FROM emails
WHERE
  subject ILIKE '%supervizor%'
  OR subject ILIKE '%cybelesoft%'
  OR from_email ILIKE '%cybelesoft%'
  OR from_email ILIKE '%supervizor%'
ORDER BY received_at DESC
LIMIT 20;

-- 6. Vérifier les clients existants
SELECT
  id,
  name,
  domain,
  total_emails_count,
  last_interaction_at
FROM clients
ORDER BY created_at DESC;
