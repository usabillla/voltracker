import React from 'react';
import {
  Text as RNText,
  TextStyle,
  TextProps as RNTextProps,
} from 'react-native';
import { useTheme } from '../../theme';

interface TextProps extends RNTextProps {
  variant?: 'heading1' | 'heading2' | 'body' | 'caption';
  color?: 'primary' | 'secondary' | 'text' | 'textSecondary' | 'error' | 'success' | 'warning';
  style?: TextStyle;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'text',
  style,
  children,
  ...props
}) => {
  const theme = useTheme();

  const getTextStyle = (): TextStyle => {
    const variantStyles = {
      heading1: theme.typography.heading1,
      heading2: theme.typography.heading2,
      body: theme.typography.body,
      caption: theme.typography.caption,
    };

    const colorValue = theme.colors[color] || theme.colors.text;

    return {
      ...variantStyles[variant],
      color: colorValue,
    };
  };

  return (
    <RNText style={[getTextStyle(), style]} {...props}>
      {children}
    </RNText>
  );
};