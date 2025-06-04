// Mock implementation of React Native for Jest tests
export * from 'react-native-web';

// Override Platform to support web testing
export const Platform = {
  OS: 'web',
  select: (platforms) => platforms.web || platforms.default,
  isTesting: true,
};

// Mock StyleSheet
export const StyleSheet = {
  create: (styles) => styles,
  compose: (style1, style2) => [style1, style2],
  flatten: (style) => style,
  absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
};

// Mock Dimensions
export const Dimensions = {
  get: () => ({
    width: 375,
    height: 667,
    scale: 2,
    fontScale: 1,
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock other commonly used React Native modules
export const Alert = {
  alert: jest.fn(),
};

export const StatusBar = (props) => null;

export const SafeAreaView = 'SafeAreaView';
export const ScrollView = 'ScrollView';
export const View = 'View';
export const Text = 'Text';
export const Image = 'Image';
export const TouchableOpacity = 'TouchableOpacity';
export const TextInput = 'TextInput';

// Mock Linking
export const Linking = {
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};