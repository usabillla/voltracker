// Tesla Fleet API Registration Script
// Run this after configuring the Tesla API Dashboard

const crypto = require('crypto');
const fs = require('fs');

// Your Tesla API credentials
const CLIENT_ID = 'd1155240-a0c2-4133-8ae4-b2d7005fa484';
const CLIENT_SECRET = 'ta-secret._cuz0%wuS&L0OnvH';
const DOMAIN = 'www.voltracker.com';

// Step 1: Generate Partner Authentication Token
function generatePartnerToken() {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  
  // Read private key
  const privateKey = fs.readFileSync('private-key.pem', 'utf8');
  
  // Create JWT header
  const header = {
    alg: 'ES256',
    typ: 'JWT',
    kid: 'tesla-fleet-api-key'
  };
  
  // Create JWT payload
  const payload = {
    iss: CLIENT_ID,
    sub: CLIENT_ID,
    aud: 'https://fleet-api.prd.na.vn.cloud.tesla.com',
    iat: timestamp,
    exp: timestamp + 300, // 5 minutes
    nonce: nonce
  };
  
  // Encode JWT
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const message = `${encodedHeader}.${encodedPayload}`;
  
  // Sign with private key
  const sign = crypto.createSign('sha256');
  sign.update(message);
  const signature = sign.sign(privateKey, 'base64url');
  
  return `${message}.${signature}`;
}

// Step 2: Register with Tesla Fleet API
async function registerWithTesla() {
  try {
    const partnerToken = generatePartnerToken();
    
    const registerData = {
      domain: DOMAIN
    };
    
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

// Add Buffer.from base64url support for older Node.js versions
if (!Buffer.prototype.toString.toString().includes('base64url')) {
  const originalToString = Buffer.prototype.toString;
  Buffer.prototype.toString = function(encoding, ...args) {
    if (encoding === 'base64url') {
      return originalToString.call(this, 'base64', ...args)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    }
    return originalToString.call(this, encoding, ...args);
  };
  
  const originalFrom = Buffer.from;
  Buffer.from = function(data, encoding, ...args) {
    if (encoding === 'base64url') {
      const base64 = data.toString()
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const padding = base64.length % 4;
      const paddedBase64 = base64 + '='.repeat(padding ? 4 - padding : 0);
      return originalFrom.call(this, paddedBase64, 'base64', ...args);
    }
    return originalFrom.call(this, data, encoding, ...args);
  };
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generatePartnerToken, registerWithTesla, verifyDomain };