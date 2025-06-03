// Vercel serverless function for beta signup
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (you'll need to set these as environment variables)
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rtglyzhjqksbgcaeklbq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Set CORS headers for all requests
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, ev_model, use_case } = req.body;

    // Validate required fields
    if (!email || !name || !ev_model || !use_case) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'name', 'ev_model', 'use_case']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('beta_signups')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already registered',
        message: 'You\'re already on our beta list! Check your email for updates.' 
      });
    }

    // Insert new beta signup
    const { data, error } = await supabase
      .from('beta_signups')
      .insert([
        {
          email,
          name,
          ev_model,
          use_case,
          source: 'landing_page',
          ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          user_agent: req.headers['user-agent'],
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to save signup. Please try again.' 
      });
    }

    // Send welcome email (optional - you can integrate with SendGrid, Mailgun, etc.)
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

    // Log analytics event
    console.log('Beta signup:', { email, ev_model, use_case, timestamp: new Date().toISOString() });

    return res.status(201).json({
      success: true,
      message: 'Successfully joined beta! Check your email for next steps.',
      data: {
        id: data[0].id,
        email: data[0].email,
        position: await getBetaPosition(data[0].id)
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Something went wrong. Please try again.' 
    });
  }
}

// Helper function to get beta position
async function getBetaPosition(userId) {
  try {
    const { count } = await supabase
      .from('beta_signups')
      .select('*', { count: 'exact', head: true })
      .lte('id', userId);
    
    return count || 0;
  } catch (error) {
    return null;
  }
}

// Helper function to send welcome email
async function sendWelcomeEmail(email, name) {
  // Example with SendGrid (you'd need to install @sendgrid/mail)
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  // const msg = {
  //   to: email,
  //   from: 'welcome@voltracker.com',
  //   subject: 'Welcome to VoltTracker Beta!',
  //   html: getWelcomeEmailTemplate(name)
  // };
  
  // return sgMail.send(msg);
  
  // For now, just log
  console.log(`Would send welcome email to ${email} (${name})`);
}

// Welcome email template
function getWelcomeEmailTemplate(name) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF385C; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to VoltTracker Beta!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Thanks for joining the VoltTracker beta! You're now part of an exclusive group of EV owners who will get first access to automated mileage tracking.</p>
          
          <h3>What's Next?</h3>
          <ul>
            <li>🚗 We'll notify you when beta access is ready</li>
            <li>📱 Download the app and connect your EV</li>
            <li>💰 Start tracking and saving on taxes automatically</li>
          </ul>
          
          <p>Questions? Just reply to this email - we'd love to hear from you!</p>
          
          <p>Best regards,<br>The VoltTracker Team</p>
        </div>
        <div class="footer">
          <p>VoltTracker - Smart Mileage Tracking for Electric Vehicle Owners</p>
        </div>
      </div>
    </body>
    </html>
  `;
}