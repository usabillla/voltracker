# Database Setup Instructions

You're getting a "Database error saving new user" because the database schema hasn't been set up yet. Here's how to fix it:

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Click on your project: `rtglyzhjqksbgcaeklbq`
3. Go to **SQL Editor** in the left sidebar
4. Click **"New query"**

## Step 2: Run the Database Schema

Copy and paste the entire contents of `database.sql` into the SQL editor and click **"Run"**.

Alternatively, you can run this simplified version first to get user registration working:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 3: Verify Setup

After running the SQL:

1. Go to **Table Editor** in Supabase
2. You should see a `users` table
3. Try creating a new user in VolTracker again

## Step 4: Complete Setup (Optional)

If you want the full VolTracker functionality (vehicles, trips, etc.), run the complete `database.sql` file after the basic user setup works.

## Troubleshooting

If you still get errors:

1. **Check RLS**: Make sure Row Level Security is enabled and policies are created
2. **Check Trigger**: Verify the `handle_new_user` function and trigger exist
3. **Check Logs**: In Supabase, go to **Logs** > **Auth** to see detailed error messages
4. **Test in SQL Editor**: Try manually inserting a user to test the setup

## Quick Test

You can test the setup by running this in the SQL Editor:

```sql
-- Check if trigger function exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if users table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public';
```

Once you've run the database setup, user registration should work properly!