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
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Tesla token refresh
    const tokenResponse = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.TESLA_CLIENT_ID,
        refresh_token,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Tesla token refresh failed:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'token_refresh_failed', error_description: errorText };
      }
      
      return res.status(tokenResponse.status).json({
        error: errorData.error || 'token_refresh_failed',
        error_description: errorData.error_description || 'Failed to refresh access token'
      });
    }

    const tokens = await tokenResponse.json();
    
    // Return refreshed tokens to client
    res.status(200).json(tokens);
    
  } catch (error) {
    console.error('Server error during token refresh:', error);
    res.status(500).json({ 
      error: 'server_error', 
      error_description: 'Internal server error during token refresh' 
    });
  }
}