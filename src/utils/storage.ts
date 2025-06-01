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

// Get platform-appropriate storage
export const getStorage = () => {
  return platformSelect({
    web: webStorage,
    mobile: async () => {
      // Dynamically import AsyncStorage only on mobile
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      return AsyncStorage.default;
    },
    default: webStorage,
  });
};

// Unified storage interface
export const storage = {
  async getItem(key: string): Promise<string | null> {
    const store = await getStorage();
    return store.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    const store = await getStorage();
    return store.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    const store = await getStorage();
    return store.removeItem(key);
  },

  async clear(): Promise<void> {
    const store = await getStorage();
    return store.clear();
  },
};
