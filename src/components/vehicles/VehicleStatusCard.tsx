import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../shared';
import { TeslaVehicle } from '../../services/tesla';
import { useTheme } from '../../theme';

interface VehicleStatusCardProps {
  vehicle: TeslaVehicle;
  vehicleData?: any;
}

export const VehicleStatusCard: React.FC<VehicleStatusCardProps> = ({
  vehicle,
  vehicleData,
}) => {
  const theme = useTheme();

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'online':
        return theme.colors.success;
      case 'asleep':
        return theme.colors.warning;
      case 'offline':
        return theme.colors.error;
      default:
        return theme.colors.secondary;
    }
  };

  const formatLocation = (driveState?: any) => {
    if (!driveState || (!driveState.latitude && !driveState.longitude)) {
      return 'Location unavailable';
    }
    
    return `${driveState.latitude?.toFixed(4)}, ${driveState.longitude?.toFixed(4)}`;
  };

  const formatOdometer = (odometer?: number) => {
    if (!odometer) return 'N/A';
    return `${Math.round(odometer).toLocaleString()} miles`;
  };

  const formatBatteryLevel = (chargeState?: any) => {
    if (!chargeState?.battery_level) return 'N/A';
    return `${chargeState.battery_level}%`;
  };

  const formatRange = (chargeState?: any) => {
    if (!chargeState?.battery_range) return 'N/A';
    return `${Math.round(chargeState.battery_range)} miles`;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      margin: 16,
      marginBottom: theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: theme.spacing.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    lastRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(vehicle.state) },
          ]}
        />
        <Text variant="h2">Vehicle Status</Text>
      </View>

      <View style={styles.row}>
        <Text variant="body" color="secondary">Connection</Text>
        <Text variant="body" style={{ textTransform: 'capitalize' }}>
          {vehicle.state}
        </Text>
      </View>

      <View style={styles.row}>
        <Text variant="body" color="secondary">Battery Level</Text>
        <Text variant="body">
          {formatBatteryLevel(vehicleData?.charge_state)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text variant="body" color="secondary">Range</Text>
        <Text variant="body">
          {formatRange(vehicleData?.charge_state)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text variant="body" color="secondary">Odometer</Text>
        <Text variant="body">
          {formatOdometer(vehicleData?.vehicle_state?.odometer)}
        </Text>
      </View>

      <View style={styles.lastRow}>
        <Text variant="body" color="secondary">Location</Text>
        <Text variant="body" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
          {formatLocation(vehicleData?.drive_state)}
        </Text>
      </View>
    </View>
  );
};