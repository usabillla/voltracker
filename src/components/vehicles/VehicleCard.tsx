import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Button, VehicleImage } from '../shared';
import { TeslaVehicle } from '../../services/tesla';
import { useTheme } from '../../theme';

interface VehicleCardProps {
  vehicle: TeslaVehicle;
  isSelected: boolean;
  onSelect: () => void;
  onViewDetail: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  isSelected,
  onSelect,
  onViewDetail,
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

  const getStatusText = (state: string) => {
    switch (state) {
      case 'online':
        return 'Online';
      case 'asleep':
        return 'Asleep';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getModelName = (optionCodes?: string) => {
    // First try to use the model from the database
    if (vehicle.model) {
      return vehicle.model;
    }
    
    // Fallback to option codes if available
    if (optionCodes && typeof optionCodes === 'string') {
      if (optionCodes.includes('MS')) return 'Model S';
      if (optionCodes.includes('MX')) return 'Model X';
      if (optionCodes.includes('M3')) return 'Model 3';
      if (optionCodes.includes('MY')) return 'Model Y';
    }
    
    return 'Tesla';
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: isSelected ? 2 : 0,
      borderColor: isSelected ? theme.colors.primary : 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 6,
      transform: [{ scale: isSelected ? 0.98 : 1 }],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    vehicleImage: {
      marginRight: 12,
    },
    nameContainer: {
      flex: 1,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    detailsContainer: {
      marginBottom: theme.spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    actionButton: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <VehicleImage
          model={getModelName(vehicle.option_codes)}
          color={vehicle.color}
          size="small"
          style={styles.vehicleImage}
        />
        
        <View style={styles.nameContainer}>
          <Text variant="h3" numberOfLines={1}>
            {vehicle.display_name || `Tesla ${vehicle.vin.slice(-6)}`}
          </Text>
          <Text variant="caption" color="secondary">
            VIN: {vehicle.vin}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(vehicle.state) },
            ]}
          />
          <Text variant="caption" color="secondary">
            {getStatusText(vehicle.state)}
          </Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text variant="body" color="secondary">Model</Text>
          <Text variant="body">
            {getModelName(vehicle.option_codes)}
          </Text>
        </View>
        
        {vehicle.color && (
          <View style={styles.detailRow}>
            <Text variant="body" color="secondary">Color</Text>
            <Text variant="body">{vehicle.color}</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text variant="body" color="secondary">API Version</Text>
          <Text variant="body">{vehicle.api_version}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Button
          title={isSelected ? "✓ Selected" : "Select"}
          onPress={onSelect}
          variant={isSelected ? "primary" : "secondary"}
          style={styles.actionButton}
          disabled={false} // Allow re-selection for UX feedback
        />
        
        <Button
          title="View Details"
          onPress={onViewDetail}
          variant="ghost"
          style={styles.actionButton}
        />
      </View>
    </TouchableOpacity>
  );
};