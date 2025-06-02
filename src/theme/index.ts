import { useColorScheme } from 'react-native';
import { TextStyle } from 'react-native';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    white: string;
    black: string;
  };
  typography: {
    heading1: TextStyle;
    heading2: TextStyle;
    body: TextStyle;
    caption: TextStyle;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}

const lightTheme: Theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#000000',
    textSecondary: '#666666',
    border: '#dddddd',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    white: '#ffffff',
    black: '#000000',
  },
  typography: {
    heading1: {
      fontSize: 28,
      fontWeight: 'bold',
      lineHeight: 36,
    },
    heading2: {
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 20,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
};

const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    background: '#000000',
    surface: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#cccccc',
    border: '#333333',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    white: '#ffffff',
    black: '#000000',
  },
};

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}