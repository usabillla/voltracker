// Test Tesla OAuth parameters
// Run this with: node test-tesla-oauth-debug.js

const clientId = 'd1155240-a0c2-4133-8ae4-b2d7005fa484';
const redirectUri = 'http://localhost:3000/auth/callback';

// Test different OAuth parameter combinations
const testUrls = [
  // Basic Fleet API pattern
  `https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid&state=test123`,
  
  // Without state
  `https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid`,
  
  // With vehicle scope
  `https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20vehicle_device_data&state=test123`,
  
  // Production redirect URI
  `https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent('https://www.voltracker.com/auth/callback')}&scope=openid&state=test123`,
];

console.log('Test these URLs one by one:');
console.log('================================');
testUrls.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
  console.log('');
});

console.log('Instructions:');
console.log('1. Copy each URL and paste into browser');
console.log('2. Note which ones give 400 vs which ones work');
console.log('3. This will help identify the exact issue');