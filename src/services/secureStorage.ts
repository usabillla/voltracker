import { platformSelect } from '../utils/platform';
import { storage } from '../utils/storage';
import { encryptForStorage, decryptFromStorage, logSecurityEvent } from '../utils/security';
import type { TeslaTokens } from './tesla';

// Storage keys
const STORAGE_KEYS = {
  TESLA_TOKENS: 'voltracker_tesla_tokens',
  TESLA_SELECTED_VEHICLE: 'voltracker_tesla_selected_vehicle',
  TESLA_OAUTH_STATE: 'voltracker_tesla_oauth_state',
} as const;

export interface StoredTeslaTokens extends TeslaTokens {
  created_at: number;
  user_id: string;
}

export class SecureStorage {
  // Tesla token storage with encryption support
  static async storeTeslaTokens(tokens: TeslaTokens, userId: string): Promise<void> {
    try {
      const tokenData: StoredTeslaTokens = {
        ...tokens,
        created_at: Date.now(),
        user_id: userId,
      };
      
      const tokenString = JSON.stringify(tokenData);
      
      // Encrypt tokens before storage for security
      const encryptedTokens = encryptForStorage(tokenString);
      
      await storage.setItem(STORAGE_KEYS.TESLA_TOKENS, encryptedTokens);
      
      logSecurityEvent('tesla_tokens_stored', { userId, hasRefreshToken: !!tokens.refresh_token });
    } catch (error) {
      console.error('Failed to store Tesla tokens:', error);
      logSecurityEvent('tesla_tokens_store_failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to store Tesla authentication tokens');
    }
  }

  static async getTeslaTokens(): Promise<StoredTeslaTokens | null> {
    try {
      const encryptedTokenString = await storage.getItem(STORAGE_KEYS.TESLA_TOKENS);
      
      if (!encryptedTokenString) {
        return null;
      }
      
      // Decrypt tokens
      const tokenString = decryptFromStorage(encryptedTokenString);
      const tokenData = JSON.parse(tokenString) as StoredTeslaTokens;
      
      // Validate token structure
      if (!tokenData.access_token || !tokenData.user_id) {
        console.warn('Invalid stored Tesla token structure');
        logSecurityEvent('tesla_tokens_invalid_structure', {});
        await this.clearTeslaTokens();
        return null;
      }
      
      return tokenData;
    } catch (error) {
      console.error('Failed to retrieve Tesla tokens:', error);
      logSecurityEvent('tesla_tokens_retrieve_failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      await this.clearTeslaTokens(); // Clear corrupted tokens
      return null;
    }
  }

  static async clearTeslaTokens(): Promise<void> {
    try {
      await storage.removeItem(STORAGE_KEYS.TESLA_TOKENS);
      await storage.removeItem(STORAGE_KEYS.TESLA_SELECTED_VEHICLE);
    } catch (error) {
      console.error('Failed to clear Tesla tokens:', error);
    }
  }

  // Selected vehicle storage
  static async storeSelectedVehicle(vehicleId: number): Promise<void> {
    try {
      await storage.setItem(STORAGE_KEYS.TESLA_SELECTED_VEHICLE, vehicleId.toString());
    } catch (error) {
      console.error('Failed to store selected vehicle:', error);
    }
  }

  static async getSelectedVehicle(): Promise<number | null> {
    try {
      const vehicleId = await storage.getItem(STORAGE_KEYS.TESLA_SELECTED_VEHICLE);
      return vehicleId ? parseInt(vehicleId, 10) : null;
    } catch (error) {
      console.error('Failed to retrieve selected vehicle:', error);
      return null;
    }
  }

  static async clearSelectedVehicle(): Promise<void> {
    try {
      await storage.removeItem(STORAGE_KEYS.TESLA_SELECTED_VEHICLE);
    } catch (error) {
      console.error('Failed to clear selected vehicle:', error);
    }
  }

  // OAuth state storage for CSRF protection
  static async storeOAuthState(state: string): Promise<void> {
    try {
      const storePromise = platformSelect({
        web: async () => {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.setItem(STORAGE_KEYS.TESLA_OAUTH_STATE, state);
          }
        },
        default: () => storage.setItem(STORAGE_KEYS.TESLA_OAUTH_STATE, state),
      });
      
      await storePromise();
    } catch (error) {
      console.error('Failed to store OAuth state:', error);
    }
  }

  static async getOAuthState(): Promise<string | null> {
    try {
      const getPromise = platformSelect({
        web: async () => {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            return window.sessionStorage.getItem(STORAGE_KEYS.TESLA_OAUTH_STATE);
          }
          return null;
        },
        default: () => storage.getItem(STORAGE_KEYS.TESLA_OAUTH_STATE),
      });
      
      return await getPromise();
    } catch (error) {
      console.error('Failed to retrieve OAuth state:', error);
      return null;
    }
  }

  static async clearOAuthState(): Promise<void> {
    try {
      const clearPromise = platformSelect({
        web: async () => {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.removeItem(STORAGE_KEYS.TESLA_OAUTH_STATE);
          }
        },
        default: () => storage.removeItem(STORAGE_KEYS.TESLA_OAUTH_STATE),
      });
      
      await clearPromise();
    } catch (error) {
      console.error('Failed to clear OAuth state:', error);
    }
  }

  // Token validation helpers
  static isTokenExpired(tokens: StoredTeslaTokens): boolean {
    if (!tokens.expires_in || !tokens.created_at) {
      return true;
    }
    
    const expiresAt = tokens.created_at + (tokens.expires_in * 1000);
    const now = Date.now();
    
    // Consider token expired 5 minutes before actual expiry
    const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return now >= (expiresAt - buffer);
  }

  static async getValidAccessToken(): Promise<string | null> {
    const tokens = await this.getTeslaTokens();
    
    if (!tokens) {
      return null;
    }
    
    if (this.isTokenExpired(tokens)) {
      // Token is expired, caller should refresh
      return null;
    }
    
    return tokens.access_token;
  }

  // Clear all stored data (for logout)
  static async clearAllData(): Promise<void> {
    await Promise.all([
      this.clearTeslaTokens(),
      this.clearSelectedVehicle(),
      this.clearOAuthState(),
    ]);
  }
}