-- Make client_id nullable in emails table to allow storing unassigned emails
-- This enables manual review and association of forwarded emails

ALTER TABLE emails
ALTER COLUMN client_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN emails.client_id IS 'Client associated with this email. NULL if email needs manual review/assignment';