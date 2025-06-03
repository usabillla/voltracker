// Analytics dashboard for beta signups
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rtglyzhjqksbgcaeklbq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic authentication (you should use proper auth in production)
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.ANALYTICS_API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get basic signup stats
    const { count: totalSignups, error: totalError } = await supabase
      .from('beta_signups')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get signups by EV model
    const { data: evModelStats, error: evError } = await supabase
      .from('beta_signups')
      .select('ev_model')
      .then(({ data, error }) => {
        if (error) throw error;
        
        const counts = {};
        data.forEach(row => {
          counts[row.ev_model] = (counts[row.ev_model] || 0) + 1;
        });
        
        return { data: counts, error: null };
      });

    if (evError) throw evError;

    // Get signups by use case
    const { data: useCaseStats, error: useCaseError } = await supabase
      .from('beta_signups')
      .select('use_case')
      .then(({ data, error }) => {
        if (error) throw error;
        
        const counts = {};
        data.forEach(row => {
          counts[row.use_case] = (counts[row.use_case] || 0) + 1;
        });
        
        return { data: counts, error: null };
      });

    if (useCaseError) throw useCaseError;

    // Get daily signups for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: dailySignups, error: dailyError } = await supabase
      .from('beta_signups')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .then(({ data, error }) => {
        if (error) throw error;
        
        const daily = {};
        data.forEach(row => {
          const date = new Date(row.created_at).toISOString().split('T')[0];
          daily[date] = (daily[date] || 0) + 1;
        });
        
        return { data: daily, error: null };
      });

    if (dailyError) throw dailyError;

    // Get recent signups
    const { data: recentSignups, error: recentError } = await supabase
      .from('beta_signups')
      .select('name, email, ev_model, use_case, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    return res.status(200).json({
      summary: {
        totalSignups: totalSignups || 0,
        todaySignups: dailySignups[new Date().toISOString().split('T')[0]] || 0,
        averageDailySignups: Object.values(dailySignups).length > 0 ? Object.values(dailySignups).reduce((a, b) => a + b, 0) / 30 : 0
      },
      evModels: evModelStats || {},
      useCases: useCaseStats || {},
      dailySignups: dailySignups || {},
      recentSignups: (recentSignups || []).map(signup => ({
        ...signup,
        email: signup.email.replace(/(.{3}).*(@.*)/, '$1***$2') // Mask email for privacy
      }))
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: error.message 
    });
  }
}