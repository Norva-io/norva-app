-- Migration: Add body column to emails table
-- This will store the full email body for AI analysis

-- Add body column (text format, can be HTML or plain text)
ALTER TABLE emails ADD COLUMN IF NOT EXISTS body TEXT;

-- Add comment for documentation
COMMENT ON COLUMN emails.body IS 'Full email body content (HTML or plain text) for AI analysis';
