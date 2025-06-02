import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Screen, Text, Button, LoadingSpinner } from '../components/shared';
import { VehicleCard } from '../components/VehicleCard';
import { useTheme } from '../theme';
import { useTesla } from '../hooks/useTesla';
import { SecureStorage } from '../services/secureStorage';
import type { TeslaVehicle } from '../services/tesla';

export const VehicleManagementScreen: React.FC = () => {
  const theme = useTheme();
  const { vehicles, loading, error, connectTesla, refreshVehicles, isConnected } = useTesla();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load selected vehicle on mount
  useEffect(() => {
    const loadSelectedVehicle = async () => {
      const storedVehicleId = await SecureStorage.getSelectedVehicle();
      setSelectedVehicleId(storedVehicleId);
    };
    loadSelectedVehicle();
  }, []);

  const handleSelectVehicle = async (vehicle: TeslaVehicle) => {
    try {
      await SecureStorage.storeSelectedVehicle(vehicle.id);
      setSelectedVehicleId(vehicle.id);
      
      Alert.alert(
        'Vehicle Selected',
        `${vehicle.display_name} is now your active vehicle for trip tracking.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to select vehicle. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleViewDetails = (vehicle: TeslaVehicle) => {
    const model = getVehicleModel(vehicle.vin);
    const year = getVehicleYear(vehicle.vin);
    
    Alert.alert(
      `${vehicle.display_name} Details`,
      `Model: ${year} ${model}\n` +
      `VIN: ${vehicle.vin}\n` +
      `Color: ${vehicle.color || 'Unknown'}\n` +
      `Status: ${vehicle.state}\n` +
      `Tesla ID: ${vehicle.id}\n` +
      `API Version: ${vehicle.api_version}`,
      [{ text: 'OK' }]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshVehicles();
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnectTesla = async () => {
    try {
      await connectTesla();
    } catch (error) {
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Tesla. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const getVehicleModel = (vin: string): string => {
    const modelChar = vin.charAt(3);
    switch (modelChar) {
      case 'S': return 'Model S';
      case '3': return 'Model 3';
      case 'X': return 'Model X';
      case 'Y': return 'Model Y';
      default: return 'Tesla';
    }
  };

  const getVehicleYear = (vin: string): number => {
    const yearChar = vin.charAt(9);
    const currentYear = new Date().getFullYear();
    const yearMap: { [key: string]: number } = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
    };
    return yearMap[yearChar] || currentYear;
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const styles = getStyles(theme);

  if (loading && !refreshing) {
    return (
      <Screen centered>
        <LoadingSpinner size="large" />
        <Text variant="body" style={{ marginTop: theme.spacing.md }}>
          Loading vehicles...
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text variant="heading1" style={styles.title}>
          Vehicle Management
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Connect and manage your Tesla vehicles
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text variant="body" color="error" style={styles.errorText}>
            {error}
          </Text>
          <Button
            title="Retry"
            variant="outline"
            onPress={handleRefresh}
            style={styles.retryButton}
          />
        </View>
      )}

      {!isConnected ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text variant="heading2" style={styles.emptyTitle}>
            No Tesla Account Connected
          </Text>
          <Text variant="body" color="secondary" style={styles.emptyText}>
            Connect your Tesla account to view and manage your vehicles for automatic trip tracking.
          </Text>
          <Button
            title="Connect Tesla Account"
            onPress={handleConnectTesla}
            loading={loading}
            style={styles.connectButton}
          />
        </View>
      ) : vehicles.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text variant="heading2" style={styles.emptyTitle}>
            No Vehicles Found
          </Text>
          <Text variant="body" color="secondary" style={styles.emptyText}>
            We couldn't find any vehicles in your Tesla account. Make sure you have vehicles registered.
          </Text>
          <Button
            title="Refresh Vehicles"
            variant="outline"
            onPress={handleRefresh}
            loading={refreshing}
            style={styles.refreshButton}
          />
        </View>
      ) : (
        <View style={styles.content}>
          {selectedVehicle && (
            <View style={styles.selectedSection}>
              <Text variant="heading2" style={styles.sectionTitle}>
                Active Vehicle
              </Text>
              <Text variant="body" color="secondary" style={styles.sectionSubtitle}>
                This vehicle will be used for automatic trip tracking
              </Text>
              <VehicleCard
                vehicle={selectedVehicle}
                isSelected={true}
                onViewDetails={handleViewDetails}
              />
            </View>
          )}

          <View style={styles.allVehiclesSection}>
            <View style={styles.sectionHeader}>
              <Text variant="heading2" style={styles.sectionTitle}>
                All Vehicles ({vehicles.length})
              </Text>
              <Button
                title="Refresh"
                variant="ghost"
                onPress={handleRefresh}
                loading={refreshing}
                style={styles.refreshHeaderButton}
              />
            </View>
            <Text variant="body" color="secondary" style={styles.sectionSubtitle}>
              Tap a vehicle to select it for trip tracking
            </Text>

            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isSelected={vehicle.id === selectedVehicleId}
                onSelect={handleSelectVehicle}
                onViewDetails={handleViewDetails}
              />
            ))}
          </View>

          <View style={styles.footer}>
            <Text variant="caption" color="secondary" style={styles.footerText}>
              Vehicle data is refreshed automatically. Pull down to refresh manually.
            </Text>
          </View>
        </View>
      )}
    </Screen>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  errorText: {
    marginBottom: theme.spacing.sm,
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  connectButton: {
    minWidth: 200,
  },
  refreshButton: {
    minWidth: 200,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  selectedSection: {
    marginBottom: theme.spacing.xl,
  },
  allVehiclesSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    color: theme.colors.text,
    flex: 1,
  },
  sectionSubtitle: {
    marginBottom: theme.spacing.md,
  },
  refreshHeaderButton: {
    padding: 0,
    minHeight: 0,
  },
  footer: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerText: {
    textAlign: 'center',
  },
});