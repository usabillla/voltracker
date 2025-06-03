-- Create beta_signups table for lead capture
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
  beta_access_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_beta_signups_email ON beta_signups(email);
CREATE INDEX IF NOT EXISTS idx_beta_signups_created_at ON beta_signups(created_at);
CREATE INDEX IF NOT EXISTS idx_beta_signups_status ON beta_signups(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_beta_signups_updated_at
    BEFORE UPDATE ON beta_signups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- INSERT INTO beta_signups (email, name, ev_model, use_case) VALUES
-- ('test@example.com', 'Test User', 'model_3', 'sales'),
-- ('demo@voltracker.com', 'Demo User', 'model_y', 'rideshare');

-- Create view for analytics
CREATE OR REPLACE VIEW beta_signup_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as signup_date,
  COUNT(*) as signups_count,
  COUNT(DISTINCT ev_model) as unique_ev_models,
  COUNT(DISTINCT use_case) as unique_use_cases,
  COUNT(CASE WHEN beta_access_granted THEN 1 END) as beta_access_granted_count
FROM beta_signups 
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY signup_date DESC;