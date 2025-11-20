-- Add OAuth email fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_grant_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS email_connected_at TIMESTAMPTZ;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email_grant_id ON users(email_grant_id);

-- Add comment for documentation
COMMENT ON COLUMN users.email_grant_id IS 'Nylas grant ID for accessing user email via OAuth';
COMMENT ON COLUMN users.email_connected_at IS 'Timestamp when user connected their email account';