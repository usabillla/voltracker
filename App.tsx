import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { platformSelect } from './src/utils/platform';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
  };

  const platformTitle = platformSelect({
    web: 'VolTracker Web',
    ios: 'VolTracker iOS',
    android: 'VolTracker Android',
    default: 'VolTracker',
  });

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
            Welcome to {platformTitle}
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Multi-platform Tesla mileage tracking
          </Text>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              🚀 Getting Started
            </Text>
            <Text style={[styles.sectionText, { color: isDarkMode ? '#ccc' : '#666' }]}>
              This is the foundation for VolTracker - a cross-platform Tesla mileage tracking application.
            </Text>
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              🔧 Development Ready
            </Text>
            <Text style={[styles.sectionText, { color: isDarkMode ? '#ccc' : '#666' }]}>
              React Native with TypeScript, Web support, and multi-platform project structure configured.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  section: {
    width: '100%',
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default App;