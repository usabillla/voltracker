---
title: "Cross-Platform Security Implementation"
type: "task"
sprint: "S02_M01_Authentication_Tesla_Integration"
priority: "high"
estimated_hours: 16
dependencies: ["T01_S02_Environment_Configuration", "T02_S02_Database_Schema"]
tags: ["security", "authentication", "cross-platform", "encryption"]
assignee: "developer"
status: "completed"
created: "2025-01-06"
due_date: "2025-01-13"
---

# T04_S02_Cross_Platform_Security

## Task Overview
Implement comprehensive security measures for authentication tokens, sensitive data storage, and API communications across iOS, Android, and Web platforms. Ensure secure credential storage, proper session management, and protection against common security vulnerabilities.

## Current State Analysis

### Existing Security Infrastructure
Current security measures in VolTracker:
- **Environment Variables**: Platform-specific env config in `/src/utils/env.ts` with validation
- **Supabase RLS**: Row Level Security for database access with auto token refresh
- **Platform Utilities**: Cross-platform storage abstraction in `/src/utils/storage.ts` and `/src/utils/platform.ts`
- **Basic Token Storage**: Tesla tokens stored in database with expiration tracking
- **HTTPS Enforcement**: Supabase and Tesla API use HTTPS
- **AsyncStorage Integration**: React Native AsyncStorage for mobile, localStorage for web

### Security Gaps
- No encryption for stored Tesla tokens (currently plain text in database)
- No client-side secure storage with encryption
- No input validation and sanitization utilities
- No rate limiting for authentication attempts
- No comprehensive audit logging for security events
- Tesla client secret exposed in client code (needs server-side implementation)
- No account lockout protection against brute force attacks

## Technical Implementation

### Phase 1: Secure Token Storage

#### Install Required Security Dependencies
```bash
npm install crypto-js dompurify @types/crypto-js
```

#### Enhanced Secure Storage Service (`src/services/secureStorage.ts`)
Builds on existing `/src/utils/storage.ts` and `/src/utils/platform.ts` patterns:

```typescript
import { storage } from '../utils/storage';
import { platformSelect } from '../utils/platform';
import { getEnvConfig } from '../utils/env';
import CryptoJS from 'crypto-js';

interface StorageOptions {
  encrypt?: boolean;
  expirationTime?: number; // milliseconds
}

interface StoredData<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'voltracker_secure_key';

  // Generate device-specific encryption key
  private static getEncryptionKey(): string {
    const config = getEnvConfig();
    const deviceId = platformSelect({
      web: () => this.getWebDeviceId(),
      mobile: () => this.getMobileDeviceId(), // Uses existing platform detection
      default: () => this.getMobileDeviceId(),
    })();
    
    // Combine app secrets with device-specific data for encryption key
    return CryptoJS.SHA256(`${config.supabaseAnonKey}_${deviceId}_${this.ENCRYPTION_KEY}`).toString();
  }

  private static getWebDeviceId(): string {
    // For web, use a combination of user agent and screen properties
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Device fingerprint', 2, 2);
    
    return CryptoJS.SHA256(
      navigator.userAgent + 
      screen.width + 
      screen.height + 
      canvas.toDataURL()
    ).toString().slice(0, 16);
  }

  private static getMobileDeviceId(): string {
    // For mobile, we'll use a stored UUID that persists
    // This would ideally be replaced with a more secure device identifier
    return 'mobile_device_id'; // Placeholder - implement proper device ID
  }

  // Encrypt data
  private static encrypt(data: string): string {
    const key = this.getEncryptionKey();
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  // Decrypt data
  private static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt stored data');
    }
  }

  // Store data securely
  static async store<T>(
    key: string, 
    value: T, 
    options: StorageOptions = {}
  ): Promise<void> {
    try {
      const storedData: StoredData<T> = {
        data: value,
        timestamp: Date.now(),
        expiresAt: options.expirationTime ? Date.now() + options.expirationTime : undefined,
      };

      let dataToStore = JSON.stringify(storedData);
      
      if (options.encrypt !== false) {
        dataToStore = this.encrypt(dataToStore);
      }

      await storage.setItem(key, dataToStore); // Uses existing unified storage interface

      this.logSecurityEvent('DATA_STORED', { key, encrypted: options.encrypt !== false });
    } catch (error) {
      this.logSecurityEvent('STORAGE_ERROR', { key, error: error.message });
      throw new Error(`Failed to store data: ${error.message}`);
    }
  }

  // Retrieve data securely
  static async retrieve<T>(key: string): Promise<T | null> {
    try {
      const rawData = await storage.getItem(key); // Uses existing unified storage interface

      if (!rawData) {
        return null;
      }

      let dataString = rawData;
      
      // Try to decrypt (if data was encrypted)
      try {
        dataString = this.decrypt(rawData);
      } catch {
        // If decryption fails, assume data wasn't encrypted
        dataString = rawData;
      }

      const storedData: StoredData<T> = JSON.parse(dataString);
      
      // Check expiration
      if (storedData.expiresAt && Date.now() > storedData.expiresAt) {
        await this.remove(key);
        this.logSecurityEvent('DATA_EXPIRED', { key });
        return null;
      }

      this.logSecurityEvent('DATA_RETRIEVED', { key });
      return storedData.data;
    } catch (error) {
      this.logSecurityEvent('RETRIEVAL_ERROR', { key, error: error.message });
      console.error(`Failed to retrieve data for key ${key}:`, error);
      return null;
    }
  }

  // Remove data
  static async remove(key: string): Promise<void> {
    try {
      await storage.removeItem(key); // Uses existing unified storage interface

      this.logSecurityEvent('DATA_REMOVED', { key });
    } catch (error) {
      this.logSecurityEvent('REMOVAL_ERROR', { key, error: error.message });
      throw new Error(`Failed to remove data: ${error.message}`);
    }
  }

  // Clear all application data
  static async clearAll(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith('voltracker_'));
      
      await Promise.all(appKeys.map(key => this.remove(key)));
      
      this.logSecurityEvent('ALL_DATA_CLEARED', { keyCount: appKeys.length });
    } catch (error) {
      this.logSecurityEvent('CLEAR_ALL_ERROR', { error: error.message });
      throw new Error(`Failed to clear all data: ${error.message}`);
    }
  }

  // Get all storage keys (extends existing storage utility)
  private static async getAllKeys(): Promise<string[]> {
    return platformSelect({
      web: () => Object.keys(localStorage),
      mobile: async () => {
        const { getStorage } = await import('../utils/storage');
        return getStorage().getAllKeys();
      },
      default: () => [],
    })() || [];
  }

  // Security event logging
  private static logSecurityEvent(event: string, metadata: any = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      platform: platformSelect({
        web: 'web',
        mobile: platformSelect({ ios: 'ios', android: 'android', default: 'mobile' }),
        default: 'unknown',
      }),
      metadata,
    };

    // In development, log to console
    if (getEnvConfig().isDevelopment) {
      console.log('Security Event:', logEntry);
    }

    // In production, send to monitoring service
    // TODO: Implement secure logging service
  }
}

// Storage keys enum for type safety
export const STORAGE_KEYS = {
  TESLA_TOKENS: 'voltracker_tesla_tokens',
  TESLA_SELECTED_VEHICLE: 'voltracker_tesla_selected_vehicle',
  USER_PREFERENCES: 'voltracker_user_preferences',
  SECURITY_METADATA: 'voltracker_security_metadata',
} as const;
```

### Phase 2: Enhanced Authentication Storage

#### Secure Authentication Storage (`src/services/authStorage.ts`)
```typescript
import { SecureStorage, STORAGE_KEYS } from './secureStorage';
import { TeslaTokens } from './tesla';
import { getEnvConfig } from '../utils/env';
import { supabase } from './supabase'; // Import existing Supabase client

export interface SecurityMetadata {
  lastLoginTime: number;
  lastTokenRefresh: number;
  loginAttempts: number;
  lockoutUntil?: number;
  deviceFingerprint: string;
}

export class AuthStorage {
  // Token expiration times (in milliseconds)
  private static readonly TESLA_TOKEN_EXPIRY = 8 * 60 * 60 * 1000; // 8 hours
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  // Store Tesla tokens with encryption and expiration
  static async storeTeslaTokens(tokens: TeslaTokens & { created_at?: number }): Promise<void> {
    // Add created_at timestamp for token validation
    const tokensWithTimestamp = {
      ...tokens,
      created_at: tokens.created_at || Date.now(),
    };
    
    await SecureStorage.store(STORAGE_KEYS.TESLA_TOKENS, tokensWithTimestamp, {
      encrypt: true,
      expirationTime: this.TESLA_TOKEN_EXPIRY,
    });

    await this.updateSecurityMetadata({ lastTokenRefresh: Date.now() });
  }

  // Retrieve Tesla tokens with validation
  static async getTeslaTokens(): Promise<TeslaTokens | null> {
    const tokens = await SecureStorage.retrieve<TeslaTokens>(STORAGE_KEYS.TESLA_TOKENS);
    
    if (tokens) {
      // Validate token structure
      if (!this.validateTeslaTokens(tokens)) {
        await this.clearTeslaTokens();
        throw new Error('Invalid token structure detected');
      }
    }

    return tokens;
  }

  // Clear Tesla tokens securely
  static async clearTeslaTokens(): Promise<void> {
    await SecureStorage.remove(STORAGE_KEYS.TESLA_TOKENS);
  }

  // Validate Tesla token structure (matches existing TeslaTokens interface)
  private static validateTeslaTokens(tokens: TeslaTokens & { created_at?: number }): boolean {
    return (
      typeof tokens.access_token === 'string' &&
      typeof tokens.refresh_token === 'string' &&
      typeof tokens.id_token === 'string' &&
      typeof tokens.expires_in === 'number' &&
      typeof tokens.token_type === 'string' &&
      tokens.access_token.length > 0 &&
      tokens.refresh_token.length > 0
    );
  }

  // Vehicle selection storage
  static async storeSelectedVehicle(vehicleId: number): Promise<void> {
    await SecureStorage.store(STORAGE_KEYS.TESLA_SELECTED_VEHICLE, vehicleId, {
      encrypt: false, // Vehicle ID is not sensitive
    });
  }

  static async getSelectedVehicle(): Promise<number | null> {
    return SecureStorage.retrieve<number>(STORAGE_KEYS.TESLA_SELECTED_VEHICLE);
  }

  static async clearSelectedVehicle(): Promise<void> {
    await SecureStorage.remove(STORAGE_KEYS.TESLA_SELECTED_VEHICLE);
  }

  // Security metadata management
  static async updateSecurityMetadata(updates: Partial<SecurityMetadata>): Promise<void> {
    const existing = await this.getSecurityMetadata();
    const updated: SecurityMetadata = {
      ...existing,
      ...updates,
    };

    await SecureStorage.store(STORAGE_KEYS.SECURITY_METADATA, updated, {
      encrypt: true,
    });
  }

  static async getSecurityMetadata(): Promise<SecurityMetadata> {
    const metadata = await SecureStorage.retrieve<SecurityMetadata>(STORAGE_KEYS.SECURITY_METADATA);
    
    if (!metadata) {
      // Initialize default metadata
      const defaultMetadata: SecurityMetadata = {
        lastLoginTime: 0,
        lastTokenRefresh: 0,
        loginAttempts: 0,
        deviceFingerprint: await this.generateDeviceFingerprint(),
      };
      
      await this.updateSecurityMetadata(defaultMetadata);
      return defaultMetadata;
    }

    return metadata;
  }

  // Account lockout management
  static async recordLoginAttempt(successful: boolean): Promise<void> {
    const metadata = await this.getSecurityMetadata();
    
    if (successful) {
      await this.updateSecurityMetadata({
        lastLoginTime: Date.now(),
        loginAttempts: 0,
        lockoutUntil: undefined,
      });
    } else {
      const newAttempts = metadata.loginAttempts + 1;
      const updates: Partial<SecurityMetadata> = { loginAttempts: newAttempts };
      
      if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        updates.lockoutUntil = Date.now() + this.LOCKOUT_DURATION;
      }
      
      await this.updateSecurityMetadata(updates);
    }
  }

  static async isAccountLocked(): Promise<boolean> {
    const metadata = await this.getSecurityMetadata();
    
    if (!metadata.lockoutUntil) {
      return false;
    }
    
    if (Date.now() > metadata.lockoutUntil) {
      // Lockout expired, clear it
      await this.updateSecurityMetadata({ lockoutUntil: undefined, loginAttempts: 0 });
      return false;
    }
    
    return true;
  }

  // Device fingerprinting for security
  private static async generateDeviceFingerprint(): Promise<string> {
    // This is a simplified fingerprint - in production you'd want more sophisticated fingerprinting
    const config = getEnvConfig();
    const timestamp = Date.now();
    const random = Math.random().toString(36);
    
    return `${config.domain}_${timestamp}_${random}`;
  }

  // Complete security cleanup
  static async performSecurityCleanup(): Promise<void> {
    await Promise.all([
      this.clearTeslaTokens(),
      this.clearSelectedVehicle(),
      SecureStorage.remove(STORAGE_KEYS.SECURITY_METADATA),
      SecureStorage.remove(STORAGE_KEYS.USER_PREFERENCES),
    ]);
  }
}
```

### Phase 3: API Security Middleware

#### Create API Security Service (`src/services/apiSecurity.ts`)
Enhances existing Tesla API calls in `/src/services/tesla.ts` and Supabase client:

```typescript
import { getEnvConfig } from '../utils/env';
import { AuthStorage } from './authStorage';
import { supabase } from './supabase'; // Use existing Supabase client

export interface ApiRequestConfig {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
  retryAttempts?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export class ApiSecurity {
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RATE_LIMIT_DELAY = 1000; // 1 second

  // Secure API request with automatic retries and security headers
  static async secureRequest<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const requestConfig = await this.prepareSecureRequest(config);
    
    for (let attempt = 1; attempt <= (config.retryAttempts || this.MAX_RETRY_ATTEMPTS); attempt++) {
      try {
        const response = await this.executeRequest<T>(requestConfig);
        
        // Log successful API call
        this.logApiCall(config.url, config.method, response.status, attempt);
        
        return response;
      } catch (error) {
        this.logApiError(config.url, config.method, error, attempt);
        
        if (attempt === (config.retryAttempts || this.MAX_RETRY_ATTEMPTS)) {
          throw error;
        }
        
        // Wait before retry with exponential backoff
        await this.delay(this.RATE_LIMIT_DELAY * Math.pow(2, attempt - 1));
      }
    }
    
    throw new Error('Request failed after all retry attempts');
  }

  // Prepare request with security headers and authentication
  private static async prepareSecureRequest(config: ApiRequestConfig): Promise<RequestInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': await this.generateSecureUserAgent(),
      'X-Request-ID': this.generateRequestId(),
      ...config.headers,
    };

    // Add authentication headers if required
    if (config.requiresAuth) {
      const authHeader = await this.getAuthHeader(config.url);
      if (authHeader) {
        headers.Authorization = authHeader;
      }
    }

    // Add security headers
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';

    return {
      method: config.method,
      headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
      // Add timeout and other security configurations
    };
  }

  // Execute the actual request
  private static async executeRequest<T>(config: RequestInit): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT);

    try {
      const response = await fetch(config.url as string, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Validate response
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        data,
        status: response.status,
        headers: this.extractHeaders(response.headers),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  // Get appropriate authentication header
  private static async getAuthHeader(url: string): Promise<string | null> {
    const config = getEnvConfig();
    
    if (url.includes(config.supabaseUrl)) {
      // Supabase requests - get session token from existing auth
      const { data } = await supabase.auth.getSession();
      return data.session ? `Bearer ${data.session.access_token}` : `Bearer ${config.supabaseAnonKey}`;
    }
    
    if (url.includes('tesla') || url.includes('fleet-api')) {
      // Tesla requests use stored access tokens
      const tokens = await AuthStorage.getTeslaTokens();
      return tokens ? `Bearer ${tokens.access_token}` : null;
    }
    
    return null;
  }

  // Generate secure user agent
  private static async generateSecureUserAgent(): Promise<string> {
    const config = getEnvConfig();
    return `VolTracker/${config.appVersion} (${config.domain})`;
  }

  // Generate unique request ID for tracking
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Extract relevant headers from response
  private static extractHeaders(headers: Headers): Record<string, string> {
    const extracted: Record<string, string> = {};
    
    // Extract important headers
    const importantHeaders = ['content-type', 'x-ratelimit-remaining', 'x-ratelimit-reset'];
    
    importantHeaders.forEach(header => {
      const value = headers.get(header);
      if (value) {
        extracted[header] = value;
      }
    });
    
    return extracted;
  }

  // Delay utility for retries
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Security event logging
  private static logApiCall(url: string, method: string, status: number, attempt: number): void {
    if (getEnvConfig().isDevelopment) {
      console.log(`API Call: ${method} ${url} - ${status} (attempt ${attempt})`);
    }
    
    // TODO: Send to monitoring service in production
  }

  private static logApiError(url: string, method: string, error: any, attempt: number): void {
    if (getEnvConfig().isDevelopment) {
      console.error(`API Error: ${method} ${url} - ${error.message} (attempt ${attempt})`);
    }
    
    // TODO: Send to error monitoring service in production
  }
}
```

### Phase 4: Input Validation and Sanitization

#### Create Validation Utilities (`src/utils/security.ts`)
Extends existing utilities in `/src/utils/` directory:

```typescript
import DOMPurify from 'dompurify';
import { getEnvConfig } from './env'; // Use existing env utilities

export class SecurityValidator {
  // Email validation with security checks
  static validateEmail(email: string): { isValid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];
    let sanitized = email.trim().toLowerCase();

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      errors.push('Invalid email format');
    }

    // Check for suspicious patterns
    if (sanitized.includes('<script') || sanitized.includes('javascript:')) {
      errors.push('Email contains suspicious content');
      sanitized = this.sanitizeInput(sanitized);
    }

    // Length validation
    if (sanitized.length > 254) {
      errors.push('Email too long');
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
    };
  }

  // Password validation with security requirements
  static validatePassword(password: string): { isValid: boolean; strength: string; errors: string[] } {
    const errors: string[] = [];
    let strength = 'weak';

    // Basic requirements
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain numbers');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain special characters');
    }

    // Common password checks
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password contains common patterns');
    }

    // Strength calculation
    let strengthScore = 0;
    if (password.length >= 12) strengthScore++;
    if (/[a-z]/.test(password)) strengthScore++;
    if (/[A-Z]/.test(password)) strengthScore++;
    if (/\d/.test(password)) strengthScore++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strengthScore++;
    if (password.length >= 16) strengthScore++;

    if (strengthScore >= 5) strength = 'strong';
    else if (strengthScore >= 3) strength = 'medium';

    return {
      isValid: errors.length === 0,
      strength,
      errors,
    };
  }

  // General input sanitization
  static sanitizeInput(input: string): string {
    // Remove HTML tags and dangerous content
    const sanitized = DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    // Additional sanitization
    return sanitized
      .replace(/[<>]/g, '') // Remove remaining angle brackets
      .replace(/javascript:/gi, '') // Remove JavaScript URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  // VIN validation for Tesla vehicles
  static validateVin(vin: string): { isValid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];
    let sanitized = vin.trim().toUpperCase();

    // VIN format validation
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    if (!vinRegex.test(sanitized)) {
      errors.push('Invalid VIN format');
    }

    // Tesla VIN check (should start with 5YJ for most Tesla models)
    if (sanitized.length === 17 && !sanitized.startsWith('5YJ') && !sanitized.startsWith('7SA')) {
      errors.push('VIN does not appear to be from a Tesla vehicle');
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
    };
  }

  // URL validation for redirects
  static validateRedirectUrl(url: string): { isValid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];
    let sanitized = url.trim();

    try {
      const urlObj = new URL(sanitized);
      
      // Only allow HTTPS
      if (urlObj.protocol !== 'https:') {
        errors.push('Only HTTPS URLs are allowed');
      }

      // Check allowed domains (uses environment config)
      const config = getEnvConfig();
      const allowedDomains = [
        config.domain,
        'auth.tesla.com',
        'fleet-api.prd.na.vn.cloud.tesla.com',
        'localhost',
        '127.0.0.1'
      ];
      const domain = urlObj.hostname;
      
      if (!allowedDomains.some(allowed => domain === allowed || domain.endsWith(`.${allowed}`))) {
        errors.push('URL domain not allowed');
      }

    } catch (error) {
      errors.push('Invalid URL format');
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
    };
  }
}

// Rate limiting utilities
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();

  static isRateLimited(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this identifier
    const existingRequests = this.requests.get(identifier) || [];
    
    // Filter out requests outside the window
    const recentRequests = existingRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if rate limited
    if (recentRequests.length >= maxRequests) {
      return true;
    }
    
    // Record this request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return false;
  }

  static clearExpiredRequests(): void {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    this.requests.forEach((timestamps, identifier) => {
      const recent = timestamps.filter(timestamp => timestamp > oneHourAgo);
      if (recent.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recent);
      }
    });
  }
}
```

## Technical Guidance

### Platform-Specific Security Patterns

#### Web Platform Security
- **Secure Storage**: Use localStorage with client-side encryption for sensitive data
- **CSP Headers**: Implement Content Security Policy for XSS prevention
- **HTTPS Only**: Enforce HTTPS in production with secure cookies
- **Session Storage**: Use sessionStorage for temporary data that shouldn't persist

#### Mobile Platform Security (iOS/Android)
- **Keychain/Keystore**: Use platform-specific secure storage (future enhancement)
- **App Transport Security**: Configure ATS for iOS to enforce secure connections
- **Network Security Config**: Configure Android network security for API calls
- **Background App Security**: Clear sensitive data when app goes to background

#### Cross-Platform Considerations
- **Token Synchronization**: Ensure tokens are consistently encrypted across platforms
- **Platform Detection**: Use existing `platformSelect` utility for security features
- **Storage Abstraction**: Leverage existing `storage.ts` abstraction for unified interface

### Implementation Notes

#### Secure Token Storage Integration
```typescript
// Update existing useTesla.ts hook to use secure storage
import { AuthStorage } from '../services/authStorage';

// In exchangeCodeForTokens function:
const tokens = await TeslaService.exchangeCodeForTokens(code);
if (tokens) {
  // Store securely on client-side
  await AuthStorage.storeTeslaTokens(tokens);
  
  // Still save to database but without sensitive tokens
  await supabase.from('vehicles').upsert({
    // ... vehicle data without tokens
    last_token_refresh: new Date().toISOString(),
  });
}
```

#### Environment Variable Security
```typescript
// Extend existing env.ts validation
export function validateSecurityConfig(): void {
  const config = getEnvConfig();
  
  if (config.isDevelopment) {
    console.warn('Development mode - enhanced security features disabled');
  }
  
  // Validate security-critical environment variables
  if (!config.supabaseUrl.startsWith('https://')) {
    throw new Error('Supabase URL must use HTTPS in production');
  }
}
```

## Concrete Subtasks

### 1. Client-Side Secure Storage (4 hours)
- [ ] Create `src/services/secureStorage.ts` with encryption utilities
- [ ] Implement device-specific encryption key generation
- [ ] Add expiration and validation for stored data
- [ ] Create storage keys enum for type safety
- [ ] Write unit tests for encryption/decryption

### 2. Authentication Storage Service (3 hours)
- [ ] Create `src/services/authStorage.ts` extending secureStorage
- [ ] Implement Tesla token storage with validation
- [ ] Add security metadata tracking (login attempts, lockouts)
- [ ] Implement account lockout protection
- [ ] Create device fingerprinting utilities

### 3. API Security Middleware (4 hours)
- [ ] Create `src/services/apiSecurity.ts` for secure API calls
- [ ] Implement automatic retry with exponential backoff
- [ ] Add request/response security headers
- [ ] Create secure user agent generation
- [ ] Add API call logging and error tracking

### 4. Input Validation & Sanitization (3 hours)
- [ ] Create `src/utils/security.ts` validation utilities
- [ ] Implement email, password, and VIN validation
- [ ] Add input sanitization for user inputs
- [ ] Create URL validation for redirects
- [ ] Implement rate limiting utilities

### 5. Integration with Existing Services (2 hours)
- [ ] Update `src/hooks/useTesla.ts` to use secure storage
- [ ] Modify `src/services/tesla.ts` to use API security middleware
- [ ] Update `src/hooks/useAuth.ts` for enhanced security
- [ ] Add security validation to existing forms
- [ ] Create security event logging integration

## Testing Strategy

### Security Testing
- Token encryption/decryption validation
- Cross-platform storage security
- Input sanitization effectiveness
- Rate limiting functionality
- Account lockout mechanism

### Integration Testing
- Tesla API integration with secure storage
- Supabase authentication with enhanced security
- Cross-platform storage consistency
- Environment configuration validation

### Penetration Testing
- XSS prevention validation
- Token manipulation attempts
- Session hijacking prevention
- API abuse protection

## Security Monitoring

### Audit Logging
- Authentication events
- Token refresh events
- Security violations
- Failed login attempts

### Threat Detection
- Suspicious login patterns
- Multiple failed attempts
- Token manipulation attempts
- Unusual API usage patterns

## Success Criteria

### Core Security Features
- [ ] All Tesla tokens encrypted at rest using client-side encryption
- [ ] Authentication tokens securely stored per platform using existing storage abstraction
- [ ] Input validation prevents injection attacks across all user inputs
- [ ] Rate limiting prevents authentication abuse and API overuse
- [ ] Account lockout protects against brute force attacks (5 attempts, 15-minute lockout)
- [ ] Security event logging tracks all authentication and token operations

### Cross-Platform Integration
- [ ] Security services integrate with existing `/src/utils/platform.ts` utilities
- [ ] Secure storage works consistently across web (localStorage) and mobile (AsyncStorage)
- [ ] API security middleware enhances existing Tesla and Supabase API calls
- [ ] Environment configuration extends existing `/src/utils/env.ts` validation

### Code Quality & Testing
- [ ] TypeScript types for all security interfaces and services
- [ ] Unit tests for encryption, validation, and rate limiting
- [ ] Integration tests with existing `useAuth` and `useTesla` hooks
- [ ] Security vulnerability testing (XSS, token manipulation, session hijacking)

### Production Readiness
- [ ] No sensitive data logged in production environments
- [ ] Security headers properly configured for API requests
- [ ] Device fingerprinting implemented for fraud detection
- [ ] Compliance with security best practices and data protection regulations

## Dependencies

### External Dependencies
- `crypto-js` for encryption (new dependency)
- `dompurify` for input sanitization (new dependency)
- `@types/crypto-js` for TypeScript support (new dependency)

### Internal Dependencies
- `/src/utils/platform.ts` - Platform detection utilities
- `/src/utils/storage.ts` - Cross-platform storage abstraction
- `/src/utils/env.ts` - Environment configuration with validation
- `/src/services/supabase.ts` - Supabase client and types
- `/src/services/tesla.ts` - Tesla API service
- `/src/hooks/useAuth.ts` - Authentication state management
- `/src/hooks/useTesla.ts` - Tesla integration hooks

### Future Dependencies
- React Native Keychain (for mobile secure storage enhancement)
- Sentry or similar error tracking service
- Security monitoring service integration

## Risk Mitigation

### Data Breaches
- **Client-side encryption** of all sensitive tokens before storage
- **Device-specific encryption keys** prevent cross-device token access
- **Token expiration** with automatic cleanup of expired data
- **Security event logging** for audit trails and incident response

### Token Compromise
- **Automatic token refresh** with existing Tesla API integration
- **Token validation** before each API call
- **Secure token invalidation** on logout or security events
- **Device fingerprinting** to detect suspicious access patterns

### Platform Security Risks
- **Consistent security model** across web and mobile platforms
- **Environment-specific configurations** for development vs production
- **Input sanitization** prevents code injection across platforms
- **Rate limiting** prevents API abuse and brute force attacks

## Implementation Priority

1. **High Priority (Week 1)**: 
   - Client-side secure storage with encryption
   - Tesla token storage integration with existing `useTesla.ts`
   - Input validation and sanitization utilities

2. **Medium Priority (Week 2)**:
   - API security middleware for existing Tesla/Supabase calls
   - Account lockout and rate limiting
   - Security event logging integration

3. **Future Enhancements**:
   - Advanced threat detection and monitoring
   - Native mobile secure storage (Keychain/Keystore)
   - Compliance reporting and documentation