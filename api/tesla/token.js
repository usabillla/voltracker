export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Tesla token exchange
    const tokenResponse = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.TESLA_CLIENT_ID,
        client_secret: process.env.TESLA_CLIENT_SECRET,
        code,
        redirect_uri: redirect_uri || process.env.TESLA_REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Tesla token exchange failed:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'token_exchange_failed', error_description: errorText };
      }
      
      return res.status(tokenResponse.status).json({
        error: errorData.error || 'token_exchange_failed',
        error_description: errorData.error_description || 'Failed to exchange authorization code for tokens'
      });
    }

    const tokens = await tokenResponse.json();
    
    // Return tokens to client
    res.status(200).json(tokens);
    
  } catch (error) {
    console.error('Server error during token exchange:', error);
    res.status(500).json({ 
      error: 'server_error', 
      error_description: 'Internal server error during token exchange' 
    });
  }
}