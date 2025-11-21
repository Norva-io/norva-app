-- Migration pour nettoyer le schéma de la table users
-- Il semble y avoir eu une fusion entre le schéma auth.users et une table users custom

-- Créer une nouvelle table users propre
CREATE TABLE IF NOT EXISTS public.users_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  email_grant_id TEXT UNIQUE,
  email_provider TEXT,
  email_connected_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copier les données existantes si la table users existe déjà
INSERT INTO public.users_new (
  id, clerk_id, email, first_name, last_name, avatar_url,
  email_grant_id, email_provider, email_connected_at,
  stripe_customer_id, plan, created_at, updated_at
)
SELECT
  COALESCE(id, gen_random_uuid()),
  clerk_id,
  COALESCE(email, email::text),
  first_name,
  last_name,
  avatar_url,
  email_grant_id,
  email_provider,
  email_connected_at,
  stripe_customer_id,
  COALESCE(plan, 'free'),
  COALESCE(created_at, NOW()),
  COALESCE(updated_at, NOW())
FROM public.users
WHERE clerk_id IS NOT NULL
ON CONFLICT (clerk_id) DO NOTHING;

-- Supprimer l'ancienne table et renommer la nouvelle
DROP TABLE IF EXISTS public.users CASCADE;
ALTER TABLE public.users_new RENAME TO users;

-- Recréer les index
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email_grant_id ON public.users(email_grant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Recréer la foreign key pour la table clients
-- Note: la table clients a déjà une colonne user_id qui référençait l'ancienne table users
ALTER TABLE public.clients
  ADD CONSTRAINT clients_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre les lectures
CREATE POLICY "Users can read their own data"
  ON public.users
  FOR SELECT
  USING (true);

-- Policy pour permettre les insertions (pour le fallback)
CREATE POLICY "Service role can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Policy pour permettre les mises à jour
CREATE POLICY "Users can update their own data"
  ON public.users
  FOR UPDATE
  USING (true);
