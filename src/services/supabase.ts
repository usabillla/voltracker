import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { platformSelect } from '../utils/platform';
import { getEnvConfig } from '../utils/env';

// Get validated environment configuration
const envConfig = getEnvConfig();

// Platform-specific storage configuration
const supabaseOptions = {
  auth: {
    storage: platformSelect({
      web: undefined, // Uses localStorage by default
      default: AsyncStorage, // Uses AsyncStorage for mobile
    }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
};

export const supabase = createClient(envConfig.supabaseUrl, envConfig.supabaseAnonKey, supabaseOptions);

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
