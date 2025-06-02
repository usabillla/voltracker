import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../shared';
import { TeslaVehicle } from '../../services/tesla';
import { useTheme } from '../../theme';

interface VehicleInfoCardProps {
  vehicle: TeslaVehicle;
  vehicleData?: any;
}

export const VehicleInfoCard: React.FC<VehicleInfoCardProps> = ({
  vehicle,
  vehicleData,
}) => {
  const theme = useTheme();

  const getModelName = (optionCodes: string) => {
    if (optionCodes.includes('MS')) return 'Model S';
    if (optionCodes.includes('MX')) return 'Model X';
    if (optionCodes.includes('M3')) return 'Model 3';
    if (optionCodes.includes('MY')) return 'Model Y';
    return 'Tesla';
  };

  const formatSoftwareVersion = (version?: string) => {
    if (!version) return 'Unknown';
    return version;
  };

  const getCarType = (vehicleConfig?: any) => {
    if (!vehicleConfig?.car_type) return 'N/A';
    return vehicleConfig.car_type.charAt(0).toUpperCase() + vehicleConfig.car_type.slice(1);
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      margin: 16,
      marginBottom: theme.spacing.md,
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
      <Text variant="h2" style={{ marginBottom: theme.spacing.lg }}>
        Vehicle Information
      </Text>

      <View style={styles.row}>
        <Text variant="body" color="secondary">Model</Text>
        <Text variant="body">
          {getModelName(vehicle.option_codes)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text variant="body" color="secondary">VIN</Text>
        <Text variant="body">{vehicle.vin}</Text>
      </View>

      {vehicle.color && (
        <View style={styles.row}>
          <Text variant="body" color="secondary">Color</Text>
          <Text variant="body">{vehicle.color}</Text>
        </View>
      )}

      <View style={styles.row}>
        <Text variant="body" color="secondary">Type</Text>
        <Text variant="body">
          {getCarType(vehicleData?.vehicle_config)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text variant="body" color="secondary">Software</Text>
        <Text variant="body">
          {formatSoftwareVersion(vehicleData?.vehicle_state?.car_version)}
        </Text>
      </View>

      <View style={styles.lastRow}>
        <Text variant="body" color="secondary">API Version</Text>
        <Text variant="body">{vehicle.api_version}</Text>
      </View>
    </View>
  );
};