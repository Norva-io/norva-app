-- ============================================
-- Migration 006: Add UX Improvements Fields
-- ============================================
-- Purpose: Add missing fields for new dashboard UX
-- - Risk levels for clients
-- - Suggested actions
-- - Enhanced insights
-- - Email analysis metadata

-- ============================================
-- 1. Enhance CLIENTS table
-- ============================================

-- Add risk_level column (derived from health_score)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS risk_level TEXT
  CHECK (risk_level IN ('urgent', 'high', 'normal'));

-- Add last_interaction_at for tracking
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ;

-- Add emails_analyzed_count
ALTER TABLE clients ADD COLUMN IF NOT EXISTS emails_analyzed_count INTEGER DEFAULT 0;

-- Function to auto-calculate risk_level from health_score
CREATE OR REPLACE FUNCTION update_client_risk_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Map health_score to risk_level
  -- urgent: <40, high: 40-70, normal: >70
  IF NEW.health_score < 40 THEN
    NEW.risk_level = 'urgent';
  ELSIF NEW.health_score >= 40 AND NEW.health_score < 70 THEN
    NEW.risk_level = 'high';
  ELSE
    NEW.risk_level = 'normal';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update risk_level
CREATE TRIGGER trigger_update_client_risk_level
BEFORE INSERT OR UPDATE OF health_score ON clients
FOR EACH ROW EXECUTE FUNCTION update_client_risk_level();

-- ============================================
-- 2. Enhance CLIENT_INSIGHTS table
-- ============================================

-- Add suggested_action column
ALTER TABLE client_insights ADD COLUMN IF NOT EXISTS suggested_action TEXT;

-- Add dismissed_at for hiding insights
ALTER TABLE client_insights ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

-- Rename insight_type values to match new spec (warning → urgent, info → high, success → normal)
-- Add new priority_level column
ALTER TABLE client_insights ADD COLUMN IF NOT EXISTS priority_level TEXT
  CHECK (priority_level IN ('urgent', 'high', 'normal'));

-- ============================================
-- 3. Create SUGGESTED_ACTIONS table
-- ============================================

CREATE TABLE IF NOT EXISTS suggested_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  insight_id UUID REFERENCES client_insights(id) ON DELETE SET NULL,

  -- Action details
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('urgent', 'high', 'normal')),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'snoozed')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_actions_client_id ON suggested_actions(client_id);
CREATE INDEX idx_actions_status ON suggested_actions(status);
CREATE INDEX idx_actions_priority ON suggested_actions(priority);

-- Trigger for updated_at
CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON suggested_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policy
ALTER TABLE suggested_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggested actions for own clients" ON suggested_actions
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Users can update suggested actions for own clients" ON suggested_actions
  FOR UPDATE USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.uid()::text
      )
    )
  );

-- ============================================
-- 4. Enhance EMAILS table
-- ============================================

-- Add analysis metadata
ALTER TABLE emails ADD COLUMN IF NOT EXISTS is_question BOOLEAN DEFAULT false;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS urgency_level INTEGER CHECK (urgency_level >= 0 AND urgency_level <= 10);
ALTER TABLE emails ADD COLUMN IF NOT EXISTS response_time_hours INTEGER;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS has_response BOOLEAN DEFAULT false;

-- ============================================
-- 5. Update existing data
-- ============================================

-- Set default risk_level for existing clients based on health_score
UPDATE clients
SET risk_level = CASE
  WHEN health_score < 40 THEN 'urgent'
  WHEN health_score >= 40 AND health_score < 70 THEN 'high'
  ELSE 'normal'
END
WHERE risk_level IS NULL AND health_score IS NOT NULL;

-- Set default risk_level to 'normal' for clients without health_score
UPDATE clients
SET risk_level = 'normal'
WHERE risk_level IS NULL;

-- Set priority_level for existing insights based on insight_type
UPDATE client_insights
SET priority_level = CASE
  WHEN insight_type = 'warning' THEN 'urgent'
  WHEN insight_type = 'info' THEN 'high'
  WHEN insight_type = 'success' THEN 'normal'
  ELSE 'normal'
END
WHERE priority_level IS NULL;

-- ============================================
-- 6. Create view for dashboard stats
-- ============================================

CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  u.id as user_id,
  COUNT(DISTINCT c.id) as total_clients,
  COUNT(DISTINCT e.id) as emails_analyzed,
  COUNT(DISTINCT CASE WHEN c.risk_level = 'urgent' OR c.risk_level = 'high' THEN c.id END) as at_risk_clients,
  AVG(c.health_score) as avg_health_score,
  COUNT(DISTINCT sa.id) FILTER (WHERE sa.status = 'pending') as pending_actions
FROM users u
LEFT JOIN clients c ON c.user_id = u.id
LEFT JOIN emails e ON e.client_id = c.id AND e.received_at > NOW() - INTERVAL '48 hours'
LEFT JOIN suggested_actions sa ON sa.client_id = c.id
GROUP BY u.id;

-- Grant access to view
ALTER VIEW dashboard_stats OWNER TO postgres;

-- ============================================
-- 7. Add helpful indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_risk_level ON clients(risk_level);
CREATE INDEX IF NOT EXISTS idx_clients_last_interaction ON clients(last_interaction_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_priority_level ON client_insights(priority_level);
CREATE INDEX IF NOT EXISTS idx_emails_urgency ON emails(urgency_level DESC);
