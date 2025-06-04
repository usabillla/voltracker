module.exports = {
  setupFiles: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^../services/secureStorage$': '<rootDir>/__mocks__/secureStorage.js'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-web|@supabase)/)'
  ]
};