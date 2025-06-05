#!/usr/bin/env node
/**
 * Test script to verify Supabase authentication setup
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('REACT_APP_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing');
  console.log('REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? '✓ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🔍 Testing Supabase authentication...');
  console.log('URL:', supabaseUrl);
  
  // Test 1: Basic connection
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Failed to connect to Supabase:', error.message);
      return;
    }
    console.log('✅ Successfully connected to Supabase');
  } catch (err) {
    console.error('❌ Network error:', err.message);
    return;
  }

  // Test 2: Try to sign up a test user
  const testEmail = 'test@voltracker.com';
  const testPassword = 'TestPassword123!';
  
  console.log('\n🧪 Testing user registration...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      console.log('ℹ️  Test user already exists');
      
      // Test 3: Try to sign in
      console.log('\n🔐 Testing user sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) {
        console.error('❌ Sign in failed:', signInError.message);
        console.log('   Status:', signInError.status);
        console.log('   This could mean:');
        console.log('   - User exists but wrong password');
        console.log('   - Email confirmation required');
        console.log('   - Supabase Auth disabled');
      } else {
        console.log('✅ Sign in successful!');
        console.log('   User ID:', signInData.user?.id);
        console.log('   Email:', signInData.user?.email);
      }
    } else {
      console.error('❌ Sign up failed:', signUpError.message);
      console.log('   Status:', signUpError.status);
    }
  } else {
    console.log('✅ Test user registered successfully!');
    console.log('   User ID:', signUpData.user?.id);
    console.log('   Email confirmation required:', !signUpData.user?.email_confirmed_at);
  }

  // Test 4: Check auth settings
  console.log('\n⚙️  Checking Supabase project settings...');
  console.log('   If sign in fails, check your Supabase dashboard:');
  console.log('   1. Authentication > Settings');
  console.log('   2. Ensure "Enable email confirmations" is disabled for testing');
  console.log('   3. Check if any auth providers are blocking sign ins');
}

testAuth().catch(console.error);