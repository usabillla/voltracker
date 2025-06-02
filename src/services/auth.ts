import { supabase } from './supabase';
import { AuthError, User, Session } from '@supabase/supabase-js';
import { validateEmailSecurity, checkRateLimit, logSecurityEvent, sanitizeString } from '../utils/security';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export class AuthService {
  // Sign up new user with security checks
  static async signUp(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      // Sanitize inputs
      const email = sanitizeString(credentials.email).toLowerCase();
      const password = credentials.password; // Don't sanitize passwords

      // Validate email security
      const emailValidation = validateEmailSecurity(email);
      if (!emailValidation.isValid) {
        logSecurityEvent('signup_failed_email_validation', { email, reason: emailValidation.error });
        return {
          user: null,
          session: null,
          error: { message: emailValidation.error } as AuthError,
        };
      }

      // Rate limiting
      const rateLimit = checkRateLimit(`signup_${email}`, 3, 60 * 60 * 1000); // 3 attempts per hour
      if (!rateLimit.allowed) {
        logSecurityEvent('signup_rate_limited', { email });
        return {
          user: null,
          session: null,
          error: { message: 'Too many signup attempts. Please try again later.' } as AuthError,
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        logSecurityEvent('signup_failed', { 
          email, 
          error: error.message,
          status: error.status,
          details: JSON.stringify(error)
        });
      } else {
        logSecurityEvent('signup_success', { email });
      }
      
      return {
        user: data.user,
        session: data.session,
        error: error,
      };
    } catch (error) {
      logSecurityEvent('signup_error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        user: null,
        session: null,
        error: { message: 'An unexpected error occurred' } as AuthError,
      };
    }
  }

  // Sign in existing user with security checks
  static async signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      // Sanitize inputs
      const email = sanitizeString(credentials.email).toLowerCase();
      const password = credentials.password; // Don't sanitize passwords

      // Validate email security
      const emailValidation = validateEmailSecurity(email);
      if (!emailValidation.isValid) {
        logSecurityEvent('signin_failed_email_validation', { email, reason: emailValidation.error });
        return {
          user: null,
          session: null,
          error: { message: emailValidation.error } as AuthError,
        };
      }

      // Rate limiting - more restrictive for sign in
      const rateLimit = checkRateLimit(`signin_${email}`, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
      if (!rateLimit.allowed) {
        logSecurityEvent('signin_rate_limited', { email });
        return {
          user: null,
          session: null,
          error: { message: 'Too many login attempts. Please try again later.' } as AuthError,
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logSecurityEvent('signin_failed', { email, error: error.message });
      } else {
        logSecurityEvent('signin_success', { email });
      }
      
      return {
        user: data.user,
        session: data.session,
        error: error,
      };
    } catch (error) {
      logSecurityEvent('signin_error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        user: null,
        session: null,
        error: { message: 'An unexpected error occurred' } as AuthError,
      };
    }
  }

  // Sign out user
  static async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  // Reset password with security checks
  static async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      // Sanitize email
      const sanitizedEmail = sanitizeString(email).toLowerCase();

      // Validate email security
      const emailValidation = validateEmailSecurity(sanitizedEmail);
      if (!emailValidation.isValid) {
        logSecurityEvent('password_reset_failed_email_validation', { email: sanitizedEmail, reason: emailValidation.error });
        return { error: { message: emailValidation.error } as AuthError };
      }

      // Rate limiting for password reset
      const rateLimit = checkRateLimit(`reset_${sanitizedEmail}`, 3, 60 * 60 * 1000); // 3 attempts per hour
      if (!rateLimit.allowed) {
        logSecurityEvent('password_reset_rate_limited', { email: sanitizedEmail });
        return { error: { message: 'Too many password reset attempts. Please try again later.' } as AuthError };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        logSecurityEvent('password_reset_failed', { email: sanitizedEmail, error: error.message });
      } else {
        logSecurityEvent('password_reset_requested', { email: sanitizedEmail });
      }

      return { error };
    } catch (error) {
      logSecurityEvent('password_reset_error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { error: { message: 'An unexpected error occurred' } as AuthError };
    }
  }

  // Get current session
  static async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  }

  // Get current user
  static async getUser(): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error };
  }
}
