// Mock implementation of SecureStorage for Jest tests
export const SecureStorage = {
  storeTeslaTokens: jest.fn(() => Promise.resolve()),
  getTeslaTokens: jest.fn(() => Promise.resolve(null)),
  removeTeslaTokens: jest.fn(() => Promise.resolve()),
  storeCredentials: jest.fn(() => Promise.resolve()),
  getCredentials: jest.fn(() => Promise.resolve(null)),
  removeCredentials: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
};