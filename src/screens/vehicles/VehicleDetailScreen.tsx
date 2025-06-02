import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Screen, Text, Button, LoadingSpinner } from '../../components/shared';
import { VehicleStatusCard } from '../../components/vehicles/VehicleStatusCard';
import { VehicleInfoCard } from '../../components/vehicles/VehicleInfoCard';
import { useTesla } from '../../hooks/useTesla';
import { useNavigation } from '../../navigation/NavigationContext';

export const VehicleDetailScreen: React.FC = () => {
  const { currentParams, navigate, goBack } = useNavigation();
  const vehicleId = currentParams?.vehicleId;
  const { vehicles, selectVehicle, getVehicleData } = useTesla();
  
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const vehicle = vehicles.find(v => v.id === vehicleId);

  useEffect(() => {
    if (!vehicle) {
      goBack();
      return;
    }
    
    loadVehicleData();
  }, [vehicle]);

  const loadVehicleData = async () => {
    if (!vehicle) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getVehicleData(vehicle.id);
      setVehicleData(data);
    } catch (error) {
      console.error('Failed to load vehicle data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = async () => {
    if (vehicle) {
      try {
        await selectVehicle(vehicle);
        navigate('dashboard');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to select vehicle');
      }
    }
  };

  if (!vehicle) {
    return (
      <Screen centered>
        <Text variant="h2">Vehicle not found</Text>
        <Button title="Go Back" onPress={() => goBack()} />
      </Screen>
    );
  }

  if (loading && !vehicleData) {
    return (
      <Screen centered>
        <LoadingSpinner size="large" />
        <Text variant="h2" style={{ marginTop: 24 }}>
          Loading Vehicle Data...
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 20, 
        paddingTop: 24, 
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#ffffff'
      }}>
        <Text variant="h1" style={{ marginBottom: 4 }}>
          {vehicle.display_name || `Tesla ${vehicle.vin.slice(-6)}`}
        </Text>
        <Text variant="body" color="secondary">
          {vehicle.model} • {vehicle.year} • VIN: {vehicle.vin.slice(-6)}
        </Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={loadVehicleData}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {error && (
          <View style={{ 
            margin: 20, 
            padding: 16, 
            backgroundColor: '#fef2f2', 
            borderRadius: 12, 
            borderLeftWidth: 4, 
            borderLeftColor: '#ef4444' 
          }}>
            <Text variant="body" color="error" style={{ textAlign: 'center' }}>
              {error}
            </Text>
          </View>
        )}

        <View style={{ padding: 20, gap: 16 }}>
          <VehicleStatusCard vehicle={vehicle} vehicleData={vehicleData} />
          <VehicleInfoCard vehicle={vehicle} vehicleData={vehicleData} />

          <View style={{ gap: 12, marginTop: 8 }}>
            <Button
              title="Select This Vehicle"
              onPress={handleSelectVehicle}
              style={{ borderRadius: 12, paddingVertical: 16 }}
            />
            
            <Button
              title="Refresh Data"
              onPress={loadVehicleData}
              variant="secondary"
              loading={loading}
              style={{ borderRadius: 12, paddingVertical: 16 }}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};