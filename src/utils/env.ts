import { platformSelect } from './platform';

/**
 * Environment variable utilities with platform-specific support and validation
 */

interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  teslaClientId: string;
  teslaRedirectUri: string;
  appVersion: string;
  isDevelopment: boolean;
  isDebug: boolean;
  domain: string;
}

/**
 * Get environment variable with platform-specific fallback
 */
function getEnvVar(key: string): string | undefined {
  return platformSelect({
    web: process.env[`REACT_APP_${key}`],
    default: process.env[`EXPO_PUBLIC_${key}`] || process.env[`REACT_APP_${key}`],
  });
}

/**
 * Get required environment variable with validation
 */
function getRequiredEnvVar(key: string, description?: string): string {
  const value = getEnvVar(key);
  if (!value) {
    const errorMessage = `Missing required environment variable: ${key}${
      description ? ` (${description})` : ''
    }`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  return value;
}

/**
 * Validate all required environment variables
 */
export function validateEnvironment(): EnvConfig {
  try {
    const config: EnvConfig = {
      supabaseUrl: getRequiredEnvVar('SUPABASE_URL', 'Supabase project URL'),
      supabaseAnonKey: getRequiredEnvVar('SUPABASE_ANON_KEY', 'Supabase anon key'),
      teslaClientId: getRequiredEnvVar('TESLA_CLIENT_ID', 'Tesla Fleet API client ID'),
      teslaRedirectUri: getRequiredEnvVar('TESLA_REDIRECT_URI', 'Tesla OAuth redirect URI'),
      appVersion: getEnvVar('VERSION') || '0.0.1',
      isDevelopment: process.env.NODE_ENV === 'development',
      isDebug: getEnvVar('DEBUG') === 'true',
      domain: getEnvVar('DOMAIN') || 'localhost',
    };

    // Validate URL formats
    if (!config.supabaseUrl.startsWith('https://')) {
      throw new Error('SUPABASE_URL must be a valid HTTPS URL');
    }

    // Allow localhost for development, require HTTPS for production
    const isLocalhost = config.teslaRedirectUri.includes('localhost') || config.teslaRedirectUri.includes('127.0.0.1');
    const isHttps = config.teslaRedirectUri.startsWith('https://');
    const isHttpLocalhost = config.teslaRedirectUri.startsWith('http://') && isLocalhost;
    
    if (!isHttps && !isHttpLocalhost) {
      throw new Error('TESLA_REDIRECT_URI must be a valid HTTPS URL (or HTTP localhost for development)');
    }

    // Log configuration in development (without sensitive data)
    if (config.isDevelopment && config.isDebug) {
      console.log('Environment configuration loaded:', {
        supabaseUrl: config.supabaseUrl,
        teslaClientId: config.teslaClientId,
        teslaRedirectUri: config.teslaRedirectUri,
        appVersion: config.appVersion,
        domain: config.domain,
        platform: platformSelect({
          web: 'web',
          ios: 'ios',
          android: 'android',
          default: 'unknown',
        }),
      });
    }

    return config;
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
}

/**
 * Get environment configuration (cached)
 */
let cachedConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnvironment();
  }
  return cachedConfig;
}

/**
 * Get specific environment variable (legacy support)
 */
export function getEnv(key: string, fallback?: string): string {
  return getEnvVar(key) || fallback || '';
}

/**
 * Check if we're in a specific environment
 */
export const env = {
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
  isTest: () => process.env.NODE_ENV === 'test',
  isDebug: () => getEnvVar('DEBUG') === 'true',
};