import React from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  style?: ViewStyle;
  inputTextStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  style,
  inputTextStyle,
  ...props
}) => {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    marginBottom: theme.spacing.md,
  };

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

  const labelStyle: TextStyle = {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  };

  const errorStyle: TextStyle = {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  };

  return (
    <View style={[containerStyle, style]}>
      {label && (
        <Text style={labelStyle}>{label}</Text>
      )}
      <TextInput
        style={[inputStyle, textStyle, inputTextStyle]}
        placeholderTextColor={theme.colors.textSecondary}
        selectionColor={theme.colors.primary}
        {...props}
      />
      {error && error.trim() && (
        <Text style={errorStyle}>{error}</Text>
      )}
    </View>
  );
};