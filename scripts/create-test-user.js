#!/usr/bin/env node
/**
 * Create a test user for development/testing
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  const testEmail = 'test@voltracker.com';
  const testPassword = 'TestPassword123!';
  
  console.log('🧪 Creating test user for development...');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
  
  // Try to sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      emailRedirectTo: undefined, // Skip email confirmation for admin users
    }
  });

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      console.log('ℹ️  User already exists, trying to sign in...');
      
      // Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) {
        console.error('❌ Sign in failed:', signInError.message);
        console.log('\n🔧 Troubleshooting steps:');
        console.log('1. Check Supabase Dashboard > Authentication > Settings');
        console.log('2. Disable "Enable email confirmations" for development');
        console.log('3. Or manually confirm the user in Authentication > Users');
        return false;
      } else {
        console.log('✅ Successfully signed in!');
        console.log('   User ID:', signInData.user?.id);
        console.log('   Email confirmed:', signInData.user?.email_confirmed_at ? 'Yes' : 'No');
        return true;
      }
    } else {
      console.error('❌ Sign up failed:', signUpError.message);
      return false;
    }
  } else {
    console.log('✅ Test user created!');
    console.log('   User ID:', signUpData.user?.id);
    console.log('   Email confirmation required:', !signUpData.user?.email_confirmed_at);
    
    if (!signUpData.user?.email_confirmed_at) {
      console.log('\n⚠️  Email confirmation is enabled.');
      console.log('   For development, consider disabling email confirmations in Supabase dashboard.');
    }
    return true;
  }
}

createTestUser().then(success => {
  if (success) {
    console.log('\n🎉 Test user ready! You can now use these credentials to test the app:');
    console.log('   Email: test@voltracker.com');
    console.log('   Password: TestPassword123!');
  }
}).catch(console.error);