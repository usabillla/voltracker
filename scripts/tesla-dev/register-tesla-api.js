// Tesla Fleet API Registration Script
// Run this after configuring the Tesla API Dashboard

const jwt = require('jsonwebtoken');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Your Tesla API credentials - loaded from environment
const CLIENT_ID = process.env.REACT_APP_TESLA_CLIENT_ID || process.env.EXPO_PUBLIC_TESLA_CLIENT_ID;
const CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET;
const DOMAIN = process.env.REACT_APP_DOMAIN || process.env.EXPO_PUBLIC_DOMAIN || 'www.voltracker.com';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing required environment variables:');
  console.error('   TESLA_CLIENT_ID:', CLIENT_ID ? '✓' : '✗');
  console.error('   TESLA_CLIENT_SECRET:', CLIENT_SECRET ? '✓' : '✗');
  console.error('\nPlease set these in your .env file');
  process.exit(1);
}

// Step 1: Generate Partner Authentication Token
function generatePartnerToken() {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = require('crypto').randomBytes(16).toString('hex');
  
  // Read private key
  const privateKey = fs.readFileSync('private-key.pem', 'utf8');
  
  // Create JWT payload
  const payload = {
    iss: CLIENT_ID,
    sub: CLIENT_ID,
    aud: 'https://fleet-api.prd.na.vn.cloud.tesla.com',
    iat: timestamp,
    exp: timestamp + 300, // 5 minutes
    nonce: nonce
  };
  
  // Sign JWT with ES256 algorithm
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: {
      kid: 'tesla-fleet-api-key'
    }
  });
  
  return token;
}

// Step 2: Register with Tesla Fleet API
async function registerWithTesla() {
  try {
    const partnerToken = generatePartnerToken();
    console.log('Generated token length:', partnerToken.length);
    console.log('Token starts with:', partnerToken.substring(0, 50) + '...');
    
    const registerData = {
      domain: DOMAIN
    };
    
    console.log('Registering domain:', DOMAIN);
    console.log('Request data:', JSON.stringify(registerData, null, 2));
    
    const response = await fetch('https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/partner_accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${partnerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Registration failed: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    console.log('✅ Tesla Fleet API Registration Successful!');
    console.log('Response:', JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    throw error;
  }
}

// Step 3: Verify domain and public key
async function verifyDomain() {
  try {
    const publicKeyUrl = `https://${DOMAIN}/.well-known/appspecific/com.tesla.3p.public-key.pem`;
    console.log(`🔍 Checking public key at: ${publicKeyUrl}`);
    
    const response = await fetch(publicKeyUrl);
    
    if (!response.ok) {
      throw new Error(`Public key not accessible: ${response.status}`);
    }
    
    const publicKeyContent = await response.text();
    console.log('✅ Public key accessible');
    console.log('Public key content:');
    console.log(publicKeyContent);
    
    return true;
    
  } catch (error) {
    console.error('❌ Domain verification failed:', error.message);
    console.log('\n📋 Make sure to upload the public key to your domain:');
    console.log(`   ${DOMAIN}/.well-known/appspecific/com.tesla.3p.public-key.pem`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Tesla Fleet API Registration Process');
  console.log('=====================================');
  
  console.log('\n1. Verifying domain setup...');
  const domainValid = await verifyDomain();
  
  if (!domainValid) {
    console.log('\n⚠️  Please upload the public key to your domain first.');
    console.log('   Then run this script again.');
    return;
  }
  
  console.log('\n2. Registering with Tesla Fleet API...');
  await registerWithTesla();
  
  console.log('\n🎉 Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Test OAuth flow on your live domain');
  console.log('2. Users can now connect their Tesla accounts');
  console.log('3. Start building trip tracking features');
}

// JWT token generation now handled by jsonwebtoken library

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generatePartnerToken, registerWithTesla, verifyDomain };