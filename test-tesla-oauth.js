// Test Tesla OAuth URL generation (no API call required)
const CLIENT_ID = 'd1155240-a0c2-4133-8ae4-b2d7005fa484';
const REDIRECT_URI = 'https://www.voltracker.com/auth/callback';

function generateOAuthURL() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    locale: 'en-US',
    prompt: 'login',
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email offline_access',
    state: Math.random().toString(36).substring(2), // Generate random state
  });

  const authUrl = `https://auth.tesla.com/oauth2/v3/authorize?${params.toString()}`;
  
  console.log('🚀 Tesla OAuth URL Generated Successfully!');
  console.log('📋 Test this URL in your browser:');
  console.log('\n' + authUrl);
  console.log('\n✅ If this URL loads Tesla login page, your app configuration is working!');
  console.log('✅ After login, it should redirect to: https://www.voltracker.com/auth/callback?code=...');
  
  return authUrl;
}

// Test OAuth URL generation
generateOAuthURL();