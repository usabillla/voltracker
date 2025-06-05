#!/usr/bin/env node
/**
 * Test sign in with existing user
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignIn() {
  const testEmail = 'test@voltracker.com';
  const testPassword = 'TestPassword123!';
  
  console.log('🔐 Testing sign in...');
  console.log('Email:', testEmail);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (error) {
    console.error('❌ Sign in failed:', error.message);
    console.log('Status:', error.status);
    
    if (error.message.includes('Invalid login credentials')) {
      console.log('\n🔧 This usually means:');
      console.log('1. User needs to confirm their email first');
      console.log('2. Wrong password');
      console.log('3. User doesn\'t exist');
      console.log('\n💡 Solution: Go to Supabase Dashboard > Authentication > Users');
      console.log('   Find the user and click "Confirm email" manually for testing');
    }
    return false;
  } else {
    console.log('✅ Sign in successful!');
    console.log('   User ID:', data.user?.id);
    console.log('   Email:', data.user?.email);
    console.log('   Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    console.log('   Session:', data.session ? 'Active' : 'None');
    return true;
  }
}

testSignIn().catch(console.error);