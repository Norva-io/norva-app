-- Migration: Remplacer full_name par first_name/last_name + ajouter avatar_url
-- Date: 2025-01-20
-- Raison: Meilleure structure pour B2B SaaS (personnalisation, tri, export)

-- Supprimer l'ancienne colonne full_name
ALTER TABLE users DROP COLUMN IF EXISTS full_name;

-- Ajouter les nouvelles colonnes
ALTER TABLE users
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN avatar_url TEXT;

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN users.first_name IS 'User first name from Clerk';
COMMENT ON COLUMN users.last_name IS 'User last name from Clerk';
COMMENT ON COLUMN users.avatar_url IS 'User profile picture URL from Clerk';