import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export const DashboardScreen: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const isDark = useColorScheme() === 'dark';

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', error);
            }
          },
        },
      ],
    );
  };

  const styles = getStyles(isDark);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VolTracker Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.email}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚗 Quick Stats</Text>
          <Text style={styles.cardText}>
            Your Tesla vehicles and trip data will appear here once you connect your account.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 This Month</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Business Miles:</Text>
            <Text style={styles.statValue}>- -</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Personal Miles:</Text>
            <Text style={styles.statValue}>- -</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Tax Savings:</Text>
            <Text style={styles.statValue}>$- -</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔧 Next Steps</Text>
          <Text style={styles.cardText}>
            1. Connect your Tesla account{'\n'}
            2. Start tracking trips automatically{'\n'}
            3. Classify trips for tax purposes{'\n'}
            4. Export reports for filing
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.connectButton]}
          onPress={() => Alert.alert('Coming Soon', 'Tesla integration will be available soon!')}
        >
          <Text style={styles.buttonText}>Connect Tesla Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signOutButton]}
          onPress={handleSignOut}
          disabled={loading}
        >
          <Text style={[styles.buttonText, styles.signOutText]}>
            {loading ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000' : '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: isDark ? '#fff' : '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: isDark ? '#ccc' : '#666',
  },
  content: {
    padding: 24,
  },
  card: {
    backgroundColor: isDark ? '#1a1a1a' : '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#e1e5e9',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#fff' : '#000',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: isDark ? '#ccc' : '#666',
    lineHeight: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: isDark ? '#ccc' : '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#fff' : '#000',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  connectButton: {
    backgroundColor: '#007bff',
    marginTop: 8,
  },
  signOutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signOutText: {
    color: '#dc3545',
  },
});
