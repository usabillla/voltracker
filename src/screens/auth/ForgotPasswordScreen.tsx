import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';

interface ForgotPasswordScreenProps {
  onNavigateToLogin: () => void;
}

export default function ForgotPasswordScreen({ onNavigateToLogin }: ForgotPasswordScreenProps) {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={styles.container}>
      <Text style={[styles.comingSoonText, { color: isDarkMode ? '#fff' : '#000' }]}>
        Password reset coming soon!
      </Text>
      <Text
        style={styles.backLink}
        onPress={onNavigateToLogin}
      >
        Back to Login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  comingSoonText: {
    fontSize: 18,
    marginBottom: 16,
  },
  backLink: {
    color: '#007bff',
    fontSize: 16,
  },
});