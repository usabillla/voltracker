import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
  centered?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({ 
  children, 
  style, 
  padding = false,
  centered = false 
}) => {
  const theme = useTheme();

  const backgroundStyle: ViewStyle = {
    backgroundColor: theme.colors.background,
  };

  const paddingStyle: ViewStyle = padding ? {
    padding: theme.spacing.lg,
  } : {};

  const centeredStyle: ViewStyle = centered ? {
    justifyContent: 'center',
    alignItems: 'center',
  } : {};

  return (
    <SafeAreaView style={[
      styles.container, 
      backgroundStyle, 
      paddingStyle, 
      centeredStyle, 
      style
    ]}>
      <StatusBar
        barStyle={theme.colors.background === '#000000' ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});