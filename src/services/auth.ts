import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {throw error;}
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Signup failed' };
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {throw error;}
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Sign in failed' };
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {throw error;}
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Sign out failed' };
    }
  }

  // Get current user
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {throw error;}
      return { user, error: null };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Failed to get user' };
    }
  }

  // Send password reset email
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {throw error;}
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Password reset failed' };
    }
  }

  // Update password
  static async updatePassword(password: string) {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {throw error;}
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Password update failed' };
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  }
}
