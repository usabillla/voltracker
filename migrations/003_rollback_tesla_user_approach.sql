-- Rollback migration: Remove tesla_user_id approach and tesla_accounts table
-- This migration fixes the incorrect implementation that conflicts with the task specification

-- Drop tesla_accounts table if it exists (not part of the spec)
DROP TABLE IF EXISTS tesla_accounts CASCADE;

-- Remove tesla_user_id column from users table (not part of the spec)
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'tesla_user_id'
    ) THEN
        ALTER TABLE users DROP COLUMN tesla_user_id;
    END IF;
END $$;

-- Drop any related indexes
DROP INDEX IF EXISTS idx_users_tesla_user_id;
DROP INDEX IF EXISTS idx_tesla_accounts_user_id;

COMMENT ON SCHEMA public IS 'Rollback completed: Removed tesla_user_id and tesla_accounts table to align with task specification';