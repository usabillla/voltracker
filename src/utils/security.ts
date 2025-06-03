import { platformSelect } from './platform';

/**
 * Security utilities for input validation, sanitization, and protection
 */

// Input validation patterns
const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  safeString: /^[a-zA-Z0-9\s\-_.]+$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
} as const;

// Common dangerous patterns to filter
const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
] as const;

/**
 * Sanitize string input by removing potentially dangerous content
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove dangerous patterns
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize HTML content for safe display
 */
export function sanitizeHTML(html: string): string {
  const sanitized = sanitizeString(html);
  
  // For web environments, we could use DOMPurify if available
  return platformSelect({
    web: () => {
      // Basic HTML sanitization - in production, use DOMPurify
      return sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    },
    default: () => sanitized,
  })();
}

/**
 * Validate input against common patterns
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateInput(input: string, type: keyof typeof VALIDATION_PATTERNS): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Input is required' };
  }

  const sanitized = sanitizeString(input);
  if (sanitized !== input) {
    return { isValid: false, error: 'Input contains invalid characters' };
  }

  const pattern = VALIDATION_PATTERNS[type];
  if (!pattern.test(sanitized)) {
    return { isValid: false, error: `Invalid ${type} format` };
  }

  return { isValid: true };
}

/**
 * Validate email address
 */
export function validateEmailSecurity(email: string): ValidationResult {
  const result = validateInput(email, 'email');
  if (!result.isValid) {
    return result;
  }

  // Additional email security checks
  const sanitizedEmail = sanitizeString(email);
  
  // Check for suspicious patterns
  if (sanitizedEmail.includes('..') || sanitizedEmail.startsWith('.') || sanitizedEmail.endsWith('.')) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Check length limits
  if (sanitizedEmail.length > 254) {
    return { isValid: false, error: 'Email address too long' };
  }

  return { isValid: true };
}

/**
 * Validate URL for security
 */
export function validateURL(url: string): ValidationResult {
  const result = validateInput(url, 'url');
  if (!result.isValid) {
    return result;
  }

  const sanitizedUrl = sanitizeString(url);
  
  // Only allow HTTPS URLs for external resources
  if (!sanitizedUrl.startsWith('https://')) {
    return { isValid: false, error: 'Only HTTPS URLs are allowed' };
  }

  return { isValid: true };
}

/**
 * Rate limiting helper (simple in-memory implementation)
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string, 
  maxAttempts: number = 5, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remainingAttempts: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // First attempt or window expired
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, newEntry);
    
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime: newEntry.resetTime,
    };
  }

  if (entry.count >= maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remainingAttempts: maxAttempts - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Generate secure random string
 */
export function generateSecureRandom(length: number = 32): string {
  const array = new Uint8Array(length);
  
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else if (typeof global !== 'undefined' && global.crypto) {
    global.crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Secure data comparison (constant time)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (!data || data.length <= visibleChars) {
    return '***';
  }

  const masked = '*'.repeat(data.length - visibleChars);
  return data.slice(0, visibleChars) + masked;
}

/**
 * Security headers for API requests
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
  };
}

/**
 * Log security events (basic implementation)
 */
export function logSecurityEvent(event: string, details: Record<string, any>): void {
  const securityLog = {
    timestamp: new Date().toISOString(),
    event,
    details: {
      ...details,
      // Mask sensitive fields
      email: details.email ? maskSensitiveData(details.email, 3) : undefined,
      token: details.token ? maskSensitiveData(details.token, 8) : undefined,
      password: details.password ? '***' : undefined,
    },
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    platform: platformSelect({
      web: 'web',
      ios: 'ios',
      android: 'android',
      default: 'unknown',
    }),
  };

  // In production, send to security monitoring service
  console.warn('[SECURITY]', securityLog);
}

/**
 * Simple encryption/decryption for client-side token storage
 * Note: This is basic obfuscation, not cryptographically secure
 * For production, use proper encryption libraries
 */
function simpleEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const textChar = text.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    result += String.fromCharCode(textChar ^ keyChar);
  }
  return btoa(result);
}

function simpleDecrypt(encryptedText: string, key: string): string {
  try {
    const encrypted = atob(encryptedText);
    let result = '';
    for (let i = 0; i < encrypted.length; i++) {
      const encryptedChar = encrypted.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(encryptedChar ^ keyChar);
    }
    return result;
  } catch {
    throw new Error('Failed to decrypt token data');
  }
}

/**
 * Generate encryption key based on device/browser characteristics
 */
function generateDeviceKey(): string {
  const userAgent = platformSelect({
    web: () => {
      if (typeof navigator !== 'undefined' && navigator.userAgent) {
        return navigator.userAgent.slice(0, 20);
      }
      return 'web_unknown';
    },
    default: () => 'mobile_app',
  });

  const hostname = platformSelect({
    web: () => {
      if (typeof window !== 'undefined' && window.location) {
        return window.location.hostname;
      }
      return 'localhost';
    },
    default: () => 'voltracker_mobile',
  });

  const components = [
    userAgent,
    hostname,
    'voltracker_secure_key',
    new Date().getFullYear().toString(),
  ];
  
  return components.join('_').slice(0, 32);
}

/**
 * Encrypt sensitive data for storage
 */
export function encryptForStorage(data: string): string {
  const key = generateDeviceKey();
  return simpleEncrypt(data, key);
}

/**
 * Decrypt sensitive data from storage
 */
export function decryptFromStorage(encryptedData: string): string {
  const key = generateDeviceKey();
  return simpleDecrypt(encryptedData, key);
}

/**
 * Validate Tesla token structure for security
 */
export function validateTeslaToken(token: any): ValidationResult {
  if (!token || typeof token !== 'object') {
    return { isValid: false, error: 'Invalid token format' };
  }

  const requiredFields = ['access_token', 'token_type', 'expires_in'];
  for (const field of requiredFields) {
    if (!token[field]) {
      return { isValid: false, error: `Missing required field: ${field}` };
    }
  }

  // Validate access token format (basic check)
  if (typeof token.access_token !== 'string' || token.access_token.length < 10) {
    return { isValid: false, error: 'Invalid access token format' };
  }

  // Validate expiry
  if (typeof token.expires_in !== 'number' || token.expires_in <= 0) {
    return { isValid: false, error: 'Invalid token expiry' };
  }

  return { isValid: true };
}

/**
 * Enhanced CSRF state validation
 */
export function validateOAuthState(receivedState: string, storedState: string | null): ValidationResult {
  if (!receivedState) {
    return { isValid: false, error: 'No state parameter received' };
  }

  if (!storedState) {
    return { isValid: false, error: 'No stored state found for validation' };
  }

  if (!secureCompare(receivedState, storedState)) {
    logSecurityEvent('oauth_state_mismatch', { 
      receivedLength: receivedState.length,
      storedLength: storedState.length 
    });
    return { isValid: false, error: 'State parameter validation failed' };
  }

  return { isValid: true };
}