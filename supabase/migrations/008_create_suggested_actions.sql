-- Migration: Create suggested_actions table
-- This will store AI-generated action suggestions for clients

-- Create suggested_actions table
CREATE TABLE IF NOT EXISTS suggested_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_suggested_actions_client_id ON suggested_actions(client_id);
CREATE INDEX IF NOT EXISTS idx_suggested_actions_completed ON suggested_actions(completed);
CREATE INDEX IF NOT EXISTS idx_suggested_actions_priority ON suggested_actions(priority);

-- Add RLS policies
ALTER TABLE suggested_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see actions for their own clients
CREATE POLICY "Users can view their own client actions"
  ON suggested_actions
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
      )
    )
  );

-- Policy: Users can insert actions for their own clients
CREATE POLICY "Users can create actions for their clients"
  ON suggested_actions
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
      )
    )
  );

-- Policy: Users can update actions for their own clients
CREATE POLICY "Users can update their client actions"
  ON suggested_actions
  FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
      )
    )
  );

-- Policy: Users can delete actions for their own clients
CREATE POLICY "Users can delete their client actions"
  ON suggested_actions
  FOR DELETE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
      )
    )
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_suggested_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_suggested_actions_updated_at
  BEFORE UPDATE ON suggested_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_suggested_actions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE suggested_actions IS 'AI-generated action suggestions for client management';
COMMENT ON COLUMN suggested_actions.title IS 'Brief action title (e.g., "Répondre à la demande de devis")';
COMMENT ON COLUMN suggested_actions.description IS 'Optional detailed description or context';
COMMENT ON COLUMN suggested_actions.priority IS 'Action priority: high (urgent), medium (important), low (soon)';
COMMENT ON COLUMN suggested_actions.completed IS 'Whether the action has been completed';
COMMENT ON COLUMN suggested_actions.completed_at IS 'When the action was marked as completed';
COMMENT ON COLUMN suggested_actions.due_date IS 'Optional due date for the action';
