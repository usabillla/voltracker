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
import { useTesla } from '../../hooks/useTesla';
import { useNavigation } from '../../navigation/NavigationContext';

export const DashboardScreen: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const { connectTesla, isConnected, vehicles, selectedVehicle, loading: teslaLoading } = useTesla();
  const { navigate } = useNavigation();
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
            try {
              console.log('Sign out initiated from dashboard');
              await signOut();
              console.log('Sign out completed');
              // Navigate to login after successful sign out
              navigate('login');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
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
          <Text style={styles.cardTitle}>🚗 Active Vehicle</Text>
          {selectedVehicle ? (
            <View>
              <Text style={styles.vehicleText}>
                {selectedVehicle.display_name}
              </Text>
              <Text style={styles.cardText}>
                Status: {selectedVehicle.state} • VIN: ...{selectedVehicle.vin.slice(-6)}
              </Text>
            </View>
          ) : isConnected ? (
            <Text style={styles.cardText}>
              No vehicle selected. Go to Vehicle Management to select your active vehicle.
            </Text>
          ) : (
            <Text style={styles.cardText}>
              Connect your Tesla account to see your vehicles here.
            </Text>
          )}
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

        {!isConnected ? (
          <TouchableOpacity
            style={[styles.button, styles.connectButton]}
            onPress={connectTesla}
            disabled={teslaLoading}
          >
            <Text style={styles.buttonText}>
              {teslaLoading ? 'Connecting...' : 'Connect Tesla Account'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚗 Connected Vehicles</Text>
            {vehicles.map((vehicle) => (
              <Text key={vehicle.id} style={styles.vehicleText}>
                {vehicle.display_name} ({vehicle.vin.slice(-6)})
              </Text>
            ))}
            <TouchableOpacity
              style={[styles.button, styles.reconnectButton]}
              onPress={connectTesla}
              disabled={teslaLoading}
            >
              <Text style={styles.buttonText}>
                {teslaLoading ? 'Connecting...' : 'Reconnect Tesla Account'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.vehiclesButton]}
              onPress={() => navigate('vehicles')}
            >
              <Text style={styles.buttonText}>
                View Vehicle Details
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
  reconnectButton: {
    backgroundColor: '#28a745',
    marginTop: 12,
  },
  vehiclesButton: {
    backgroundColor: '#6f42c1',
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
  vehicleText: {
    fontSize: 14,
    color: isDark ? '#ccc' : '#666',
    marginBottom: 4,
  },
});
