#!/usr/bin/env node
/**
 * Create a fresh test user after disabling email confirmations
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFreshUser() {
  const testEmail = 'dev@voltracker.com';
  const testPassword = 'DevPassword123!';
  
  console.log('🆕 Creating fresh test user (email confirmations disabled)...');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
  
  // Try to sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      console.log('ℹ️  User already exists, trying to sign in...');
    } else {
      console.error('❌ Sign up failed:', signUpError.message);
      return false;
    }
  } else {
    console.log('✅ User created successfully!');
    console.log('   User ID:', signUpData.user?.id);
    console.log('   Email confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No');
  }

  // Test sign in
  console.log('\n🔐 Testing sign in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.error('❌ Sign in failed:', signInError.message);
    return false;
  } else {
    console.log('✅ Sign in successful!');
    console.log('   User ID:', signInData.user?.id);
    console.log('   Email:', signInData.user?.email);
    console.log('   Session active:', !!signInData.session);
    return true;
  }
}

createFreshUser().then(success => {
  if (success) {
    console.log('\n🎉 Authentication is working! Use these credentials in your app:');
    console.log('   Email: dev@voltracker.com');
    console.log('   Password: DevPassword123!');
  }
}).catch(console.error);