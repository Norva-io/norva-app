-- ============================================
-- NORVA - Micro-MVP Database Schema
-- ============================================
-- Author: Claude Code
-- Date: 2025-01-20
-- Purpose: Initial schema for Norva MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- ============================================
-- Stores user accounts (sync with Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL, -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,

  -- OAuth & Email Integration
  email_grant_id TEXT, -- Nylas grant ID for email access
  email_provider TEXT CHECK (email_provider IN ('outlook', 'gmail')), -- 'outlook' only for MVP
  email_connected_at TIMESTAMPTZ,

  -- Subscription (for later)
  stripe_customer_id TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- TABLE: clients
-- ============================================
-- Stores detected clients from email analysis
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Client Info
  name TEXT NOT NULL, -- Company name (e.g., "ACME Corp")
  domain TEXT NOT NULL, -- Email domain (e.g., "acme.com")
  primary_contact_email TEXT, -- Main contact email

  -- Health Score (0-100)
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  health_status TEXT CHECK (health_status IN ('at_risk', 'stable', 'healthy')),
  -- at_risk: <50, stable: 50-80, healthy: >80

  -- Analysis metadata
  last_analyzed_at TIMESTAMPTZ,
  total_emails_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_domain ON clients(domain);
CREATE INDEX idx_clients_health_score ON clients(health_score);
CREATE UNIQUE INDEX idx_clients_user_domain ON clients(user_id, domain);

-- ============================================
-- TABLE: emails
-- ============================================
-- Stores email metadata (NOT full body for GDPR)
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Email metadata
  external_id TEXT NOT NULL, -- Outlook/Gmail message ID
  subject TEXT,
  from_email TEXT NOT NULL,
  to_emails TEXT[], -- Array of recipients

  -- Timestamps
  sent_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,

  -- Analysis results
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score FLOAT, -- -1 to 1

  -- Email preview (first 300 chars for UI, not full body)
  preview TEXT,

  -- Conversation threading
  thread_id TEXT, -- For grouping conversations

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_emails_client_id ON emails(client_id);
CREATE INDEX idx_emails_sent_at ON emails(sent_at);
CREATE INDEX idx_emails_thread_id ON emails(thread_id);
CREATE UNIQUE INDEX idx_emails_external_id ON emails(external_id);

-- ============================================
-- TABLE: client_health_history
-- ============================================
-- Stores daily snapshots of health scores for charts
CREATE TABLE client_health_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Score snapshot
  health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  snapshot_date DATE NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_health_history_client_id ON client_health_history(client_id);
CREATE INDEX idx_health_history_date ON client_health_history(snapshot_date);
CREATE UNIQUE INDEX idx_health_history_client_date ON client_health_history(client_id, snapshot_date);

-- ============================================
-- TABLE: client_insights
-- ============================================
-- Stores AI-generated insights for each client
CREATE TABLE client_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Insight content
  insight_type TEXT NOT NULL CHECK (insight_type IN ('warning', 'info', 'success')),
  insight_text TEXT NOT NULL, -- e.g., "Temps de réponse dégradé : 4h → 2 jours"
  category TEXT, -- e.g., "engagement", "sentiment", "resolution"

  -- Priority (for sorting)
  priority INTEGER DEFAULT 0, -- Higher = more important

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_insights_client_id ON client_insights(client_id);
CREATE INDEX idx_insights_priority ON client_insights(priority DESC);

-- ============================================
-- TABLE: analysis_jobs
-- ============================================
-- Tracks background analysis jobs (for debugging)
CREATE TABLE analysis_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- Job status
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- Error tracking
  error_message TEXT,

  -- Metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_user_id ON analysis_jobs(user_id);
CREATE INDEX idx_jobs_status ON analysis_jobs(status);

-- ============================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS: Auto-calculate health_status
-- ============================================
CREATE OR REPLACE FUNCTION update_client_health_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-set health_status based on health_score
  IF NEW.health_score < 50 THEN
    NEW.health_status = 'at_risk';
  ELSIF NEW.health_score >= 50 AND NEW.health_score <= 80 THEN
    NEW.health_status = 'stable';
  ELSE
    NEW.health_status = 'healthy';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_health_status
BEFORE INSERT OR UPDATE OF health_score ON clients
FOR EACH ROW EXECUTE FUNCTION update_client_health_status();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_health_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = clerk_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = clerk_id);

-- Policy: Users can only access their own clients
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Policy: Users can only access emails from their clients
CREATE POLICY "Users can view emails from own clients" ON emails
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.uid()::text
      )
    )
  );

-- Policy: Same for health_history
CREATE POLICY "Users can view own client health history" ON client_health_history
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.uid()::text
      )
    )
  );

-- Policy: Same for insights
CREATE POLICY "Users can view own client insights" ON client_insights
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.uid()::text
      )
    )
  );

-- Policy: Users can view own analysis jobs
CREATE POLICY "Users can view own analysis jobs" ON analysis_jobs
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- ============================================
-- SEED DATA (for testing in development)
-- ============================================
-- This will be skipped in production

-- Note: Insert test data manually via Supabase dashboard or separate seed script