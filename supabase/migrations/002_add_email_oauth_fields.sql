-- Add UNIQUE constraint and index to email_grant_id
-- (Migration 001 already created the column, this adds constraints)
ALTER TABLE users ADD CONSTRAINT users_email_grant_id_key UNIQUE (email_grant_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email_grant_id ON users(email_grant_id);

-- Add comments for documentation
COMMENT ON COLUMN users.email_grant_id IS 'Nylas grant ID for accessing user email via OAuth';
COMMENT ON COLUMN users.email_connected_at IS 'Timestamp when user connected their email account';