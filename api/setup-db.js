// Database setup endpoint - run once to create the beta_signups table
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rtglyzhjqksbgcaeklbq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create the beta_signups table using SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS beta_signups (
          id BIGSERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          ev_model VARCHAR(100) NOT NULL,
          use_case VARCHAR(100) NOT NULL,
          source VARCHAR(50) DEFAULT 'landing_page',
          ip_address INET,
          user_agent TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          beta_access_granted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_beta_signups_email ON beta_signups(email);
        CREATE INDEX IF NOT EXISTS idx_beta_signups_created_at ON beta_signups(created_at);
        CREATE INDEX IF NOT EXISTS idx_beta_signups_ev_model ON beta_signups(ev_model);
        CREATE INDEX IF NOT EXISTS idx_beta_signups_use_case ON beta_signups(use_case);
      `
    });

    if (error) {
      // If RPC doesn't work, try direct table creation
      console.log('RPC failed, trying direct approach:', error);
      
      // Insert a test record to ensure table exists
      const { data: testData, error: testError } = await supabase
        .from('beta_signups')
        .insert([{
          email: 'test@voltracker.com',
          name: 'Test User',
          ev_model: 'model_3',
          use_case: 'testing'
        }])
        .select();

      if (testError && testError.code === '42P01') {
        // Table doesn't exist
        return res.status(500).json({ 
          error: 'Database table not found. Please create the beta_signups table manually in Supabase.',
          details: 'Go to Supabase SQL Editor and run the SQL from /sql/create_beta_signups.sql'
        });
      }

      // Delete test record if it was created
      if (testData && testData.length > 0) {
        await supabase
          .from('beta_signups')
          .delete()
          .eq('email', 'test@voltracker.com');
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Database setup completed successfully',
      data: data
    });

  } catch (error) {
    console.error('Database setup error:', error);
    return res.status(500).json({ 
      error: 'Database setup failed',
      message: error.message,
      hint: 'You may need to create the table manually in Supabase SQL Editor'
    });
  }
}