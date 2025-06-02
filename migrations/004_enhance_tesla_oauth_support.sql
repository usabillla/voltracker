-- Enhanced Tesla OAuth support for vehicles table
-- This migration ensures the vehicles table properly supports the Tesla OAuth implementation
-- as specified in task T02_S02_Tesla_OAuth_Integration

-- Ensure vehicles table has all required fields for Tesla OAuth
-- (Most fields already exist in database.sql, this ensures they're present)

-- Add any missing columns for Tesla OAuth if they don't exist
DO $$ 
BEGIN 
    -- Ensure tesla_id exists and is properly typed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND column_name = 'tesla_id'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN tesla_id TEXT UNIQUE NOT NULL;
    END IF;

    -- Ensure tesla_tokens JSONB exists for storing encrypted tokens
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND column_name = 'tesla_tokens'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN tesla_tokens JSONB NOT NULL DEFAULT '{}';
    END IF;

    -- Add tesla_vehicle_id for API calls (different from our internal ID)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND column_name = 'tesla_vehicle_id'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN tesla_vehicle_id BIGINT;
        COMMENT ON COLUMN vehicles.tesla_vehicle_id IS 'Tesla API vehicle ID for API calls';
    END IF;

    -- Add last_sync timestamp to track when vehicle data was last updated
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND column_name = 'last_sync_at'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN last_sync_at TIMESTAMP WITH TIME ZONE;
        COMMENT ON COLUMN vehicles.last_sync_at IS 'Last time vehicle data was synced from Tesla API';
    END IF;
END $$;

-- Ensure proper indexes for Tesla OAuth operations
CREATE INDEX IF NOT EXISTS idx_vehicles_tesla_id ON vehicles(tesla_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_tesla_vehicle_id ON vehicles(tesla_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id_active ON vehicles(user_id, is_active);

-- Add comments to clarify the Tesla OAuth token storage approach
COMMENT ON COLUMN vehicles.tesla_tokens IS 'Encrypted Tesla OAuth tokens (access_token, refresh_token, expires_in, etc.)';
COMMENT ON TABLE vehicles IS 'Vehicle table with Tesla OAuth token storage as per T02_S02 specification';

-- Ensure the table structure matches the task specification
-- The vehicles table should be the primary storage for Tesla authentication data
-- This aligns with the T02_S02 task which specifies: "Database: Vehicle storage with tesla_tokens JSONB field"