import { createClient } from '@supabase/supabase-js';
import { platformSelect } from '../utils/platform';
import { storage } from '../utils/storage';

// Environment variables - these will need to be set
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Platform-specific storage configuration
const supabaseOptions = {
  auth: {
    storage: undefined, // Use default localStorage for now
    autoRefreshToken: true,
    persistSession: true,
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Database types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  tesla_id: string;
  vin: string;
  display_name: string;
  model: string;
  year: number;
  color: string;
  tesla_tokens: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  vehicle_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  start_address?: string;
  end_address?: string;
  distance_miles: number;
  duration_minutes: number;
  classification: 'business' | 'personal' | 'unclassified';
  business_purpose?: string;
  tesla_drive_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Classification {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_business: boolean;
  created_at: string;
}
