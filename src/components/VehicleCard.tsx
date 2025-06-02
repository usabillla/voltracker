import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button } from './shared';
import { useTheme } from '../theme';
import type { TeslaVehicle } from '../services/tesla';

interface VehicleCardProps {
  vehicle: TeslaVehicle;
  isSelected?: boolean;
  onSelect?: (vehicle: TeslaVehicle) => void;
  onViewDetails?: (vehicle: TeslaVehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  isSelected = false,
  onSelect,
  onViewDetails,
}) => {
  const theme = useTheme();
  
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

  const getStatusColor = (state: string): string => {
    switch (state.toLowerCase()) {
      case 'online': return theme.colors.success;
      case 'asleep': return theme.colors.warning;
      case 'offline': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (state: string): string => {
    switch (state.toLowerCase()) {
      case 'online': return '🟢';
      case 'asleep': return '🟡';
      case 'offline': return '🔴';
      default: return '⚪';
    }
  };

  const styles = getStyles(theme, isSelected);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onSelect?.(vehicle)}
      disabled={!onSelect}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text variant="heading2" style={styles.title}>
            {vehicle.display_name}
          </Text>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedText}>✓</Text>
            </View>
          )}
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusIcon}>
            {getStatusIcon(vehicle.state)}
          </Text>
          <Text style={[styles.statusText, { color: getStatusColor(vehicle.state) }]}>
            {vehicle.state}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Model:</Text>
          <Text style={styles.detailValue}>
            {getVehicleYear(vehicle.vin)} {getVehicleModel(vehicle.vin)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>VIN:</Text>
          <Text style={styles.detailValue}>
            ...{vehicle.vin.slice(-6)}
          </Text>
        </View>

        {vehicle.color && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Color:</Text>
            <Text style={styles.detailValue}>{vehicle.color}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ID:</Text>
          <Text style={styles.detailValue}>{vehicle.id}</Text>
        </View>
      </View>

      {onViewDetails && (
        <View style={styles.actions}>
          <Button
            title="View Details"
            variant="outline"
            onPress={() => onViewDetails(vehicle)}
            style={styles.detailsButton}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const getStyles = (theme: any, isSelected: boolean) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: isSelected ? 2 : 1,
    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
  },
  header: {
    marginBottom: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    flex: 1,
  },
  selectedBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  selectedText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 12,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  details: {
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '400',
  },
  actions: {
    marginTop: theme.spacing.sm,
  },
  detailsButton: {
    marginTop: 0,
  },
});