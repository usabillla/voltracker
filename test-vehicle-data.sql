-- Test Vehicle Data Setup for gehucka+test@gmail.com
-- This script creates a test vehicle with realistic Tesla data for testing the vehicle management interface

-- First, create a test user UUID that we can reference
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Try to find existing user first
    SELECT id INTO test_user_id FROM public.users WHERE email = 'gehucka+test@gmail.com';
    
    -- If user doesn't exist, create them
    IF test_user_id IS NULL THEN
        test_user_id := gen_random_uuid();
        INSERT INTO public.users (id, email, created_at, updated_at)
        VALUES (test_user_id, 'gehucka+test@gmail.com', NOW(), NOW());
        RAISE NOTICE 'Created new test user with ID: %', test_user_id;
    ELSE
        RAISE NOTICE 'Using existing test user with ID: %', test_user_id;
    END IF;
    
    -- Insert test vehicles for this user
    INSERT INTO public.vehicles (
      id,
      user_id,
      tesla_id,
      vin,
      display_name,
      model,
      year,
      color,
      tesla_tokens,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      test_user_id,
      '1234567890123',
      '5YJYGDEE8MF123456',
      'Test Model Y',
      'Model Y',
      2023,
      'Pearl White Multi-Coat',
      '{
        "access_token": "test_access_token_12345",
        "refresh_token": "test_refresh_token_67890",
        "expires_at": "2025-12-31T23:59:59.000Z"
      }',
      true,
      NOW(),
      NOW()
    ), (
      gen_random_uuid(),
      test_user_id,
      '1234567890124',
      '5YJSA1E26JF987654',
      'Test Model S',
      'Model S',
      2022,
      'Midnight Silver Metallic',
      '{
        "access_token": "test_access_token_54321",
        "refresh_token": "test_refresh_token_09876",
        "expires_at": "2025-12-31T23:59:59.000Z"
      }',
      true,
      NOW(),
      NOW()
    ) ON CONFLICT (tesla_id) 
    DO UPDATE SET 
      display_name = EXCLUDED.display_name,
      updated_at = NOW();
    
    RAISE NOTICE 'Test vehicle data successfully created for user: gehucka+test@gmail.com';
    RAISE NOTICE 'Created vehicles: Test Model Y (2023) and Test Model S (2022)';
    RAISE NOTICE 'Both vehicles have test tokens and are marked as active';
END $$;

-- Verify the data was inserted
SELECT 
  v.display_name,
  v.model,
  v.year,
  v.color,
  v.vin,
  v.tesla_id,
  v.is_active,
  v.created_at,
  u.email
FROM public.vehicles v
JOIN public.users u ON v.user_id = u.id
WHERE u.email = 'gehucka+test@gmail.com'
ORDER BY v.created_at;