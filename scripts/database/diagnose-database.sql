-- Database Diagnostic Script for VolTracker
-- Run this in Supabase SQL Editor to check current setup

-- 1. Check if users table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- 3. Check existing policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- 4. Check if trigger function exists
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 5. Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 6. Test the trigger function manually (optional)
-- This will show if the function works
-- SELECT public.handle_new_user();

-- 7. Check current users in auth.users
SELECT 
    id, 
    email, 
    created_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. Check current users in public.users
SELECT 
    id, 
    email, 
    created_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;