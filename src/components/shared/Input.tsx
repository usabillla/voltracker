import React from 'react';
import {
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../../theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  style?: ViewStyle;
  inputTextStyle?: TextStyle;
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({
  style,
  inputTextStyle,
  error = false,
  ...props
}) => {
  const theme = useTheme();

  const inputStyle: ViewStyle = {
    borderWidth: 1,
    borderColor: error ? theme.colors.error : theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  };

  const textStyle: TextStyle = {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  };

  return (
    <TextInput
      style={[inputStyle, textStyle, style, inputTextStyle]}
      placeholderTextColor={theme.colors.textSecondary}
      selectionColor={theme.colors.primary}
      {...props}
    />
  );
};