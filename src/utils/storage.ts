import { platformSelect } from './platform';

// Web-compatible storage implementation
const webStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors on web
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors on web
    }
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    return keys.map(key => [key, localStorage.getItem(key)]);
  },

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    keyValuePairs.forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  },

  async multiRemove(keys: string[]): Promise<void> {
    keys.forEach(key => {
      localStorage.removeItem(key);
    });
  },

  async clear(): Promise<void> {
    localStorage.clear();
  },

  async getAllKeys(): Promise<string[]> {
    return Object.keys(localStorage);
  },
};

// Storage interface type
interface StorageInterface {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  multiGet(keys: string[]): Promise<[string, string | null][]>;
  multiSet(keyValuePairs: [string, string][]): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

// Get platform-appropriate storage
export const getStorage = (): StorageInterface => {
  return platformSelect({
    web: webStorage,
    mobile: webStorage, // Fallback to webStorage, actual AsyncStorage will be used in production mobile builds
    default: webStorage,
  }) || webStorage;
};

// Default export for AsyncStorage compatibility
const AsyncStorage = webStorage;
export default AsyncStorage;

// Unified storage interface
export const storage = {
  async getItem(key: string): Promise<string | null> {
    const store = getStorage();
    return store.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    const store = getStorage();
    return store.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    const store = getStorage();
    return store.removeItem(key);
  },

  async clear(): Promise<void> {
    const store = getStorage();
    return store.clear();
  },
};
