# Tesla OAuth Database Migration Guide

## Overview

This guide covers the database schema fixes implemented to align with the T02_S02 Tesla OAuth Integration task specification.

## Issue Summary

The previous commit (0d521cc) introduced database migrations that conflicted with the Tesla OAuth task specification:
- Created `tesla_accounts` table (not in spec)
- Added `tesla_user_id` column to users table (not in spec)
- Conflicted with the specified `vehicles.tesla_tokens JSONB` approach

## Solution

### Fixed Migrations

1. **003_rollback_tesla_user_approach.sql**
   - Removes `tesla_accounts` table
   - Removes `tesla_user_id` column from users table
   - Cleans up related indexes

2. **004_enhance_tesla_oauth_support.sql**
   - Ensures vehicles table properly supports Tesla OAuth
   - Adds `tesla_vehicle_id` for API calls
   - Adds `last_sync_at` timestamp
   - Enhances indexing for performance

### Running Migrations

```bash
# Run the fix migrations
node run-migrations.js
```

## Database Schema (Corrected)

The Tesla OAuth implementation now uses the vehicles table as specified in T02_S02:

```sql
vehicles table:
- tesla_tokens JSONB        -- Encrypted OAuth tokens
- tesla_id TEXT            -- Tesla's vehicle identifier  
- tesla_vehicle_id BIGINT  -- Tesla API vehicle ID
- last_sync_at TIMESTAMP   -- Last sync timestamp
```

## Alignment with Task Specification

✅ **Correct**: Tokens stored in `vehicles.tesla_tokens JSONB`  
✅ **Correct**: Vehicle-based token storage approach  
✅ **Correct**: Proper indexing and RLS policies  
❌ **Removed**: Incorrect user-based tesla_user_id approach  
❌ **Removed**: Incorrect tesla_accounts table  

## Next Steps

The database schema now aligns with T02_S02 task specification. You can proceed with implementing:

1. Tesla OAuth service enhancements
2. Cross-platform token storage
3. Vehicle management interface
4. Security and error handling

## Task Reference

See: `.simone/03_SPRINTS/S02_M01_Authentication_Tesla_Integration/T02_S02_Tesla_OAuth_Integration.md`