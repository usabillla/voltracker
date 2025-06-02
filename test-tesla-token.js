// Test Tesla JWT token generation
const jwt = require('jsonwebtoken');
const fs = require('fs');

const CLIENT_ID = 'd1155240-a0c2-4133-8ae4-b2d7005fa484';

function generateTestToken() {
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
  
  console.log('JWT Payload:', JSON.stringify(payload, null, 2));
  
  // Sign JWT with ES256 algorithm
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: {
      kid: 'tesla-fleet-api-key'
    }
  });
  
  console.log('Generated JWT token:');
  console.log(token);
  console.log('\nToken parts:');
  const parts = token.split('.');
  console.log('Header:', JSON.parse(Buffer.from(parts[0], 'base64url').toString()));
  console.log('Payload:', JSON.parse(Buffer.from(parts[1], 'base64url').toString()));
  console.log('Signature length:', parts[2].length);
  
  return token;
}

// Test token generation
generateTestToken();