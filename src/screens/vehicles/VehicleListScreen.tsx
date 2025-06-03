import React, { useEffect } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { Screen, Text, Button, LoadingSpinner } from '../../components/shared';
import { VehicleCard } from '../../components/vehicles/VehicleCard';
import { useTesla } from '../../hooks/useTesla';
import { useNavigation } from '../../navigation/NavigationContext';
import { TeslaVehicle } from '../../services/tesla';

export const VehicleListScreen: React.FC = () => {
  const { navigate } = useNavigation();
  const {
    vehicles,
    selectedVehicle,
    isConnected,
    loading,
    error,
    selectVehicle,
    refreshVehicles,
    connectTesla,
    clearError,
  } = useTesla();

  useEffect(() => {
    if (error) {
      // Auto-clear errors after 5 seconds
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleConnectTesla = async () => {
    try {
      await connectTesla();
      // Platform-specific OAuth URL opening will be handled by the hook
    } catch (error) {
      console.error('Failed to initiate Tesla connection:', error);
    }
  };

  const handleVehicleSelect = async (vehicle: TeslaVehicle) => {
    try {
      await selectVehicle(vehicle);
      navigate('vehicle-detail', { vehicleId: vehicle.id });
    } catch (error) {
      console.error('Failed to select vehicle:', error);
    }
  };

  const renderVehicleItem = ({ item }: { item: TeslaVehicle }) => (
    <VehicleCard
      vehicle={item}
      isSelected={selectedVehicle?.id === item.id}
      onSelect={() => handleVehicleSelect(item)}
      onViewDetail={() => navigate('vehicle-detail', { vehicleId: item.id })}
    />
  );

  if (loading && vehicles.length === 0) {
    return (
      <Screen centered>
        <LoadingSpinner size="large" />
        <Text variant="h2" style={{ marginTop: 24 }}>
          Loading Vehicles...
        </Text>
      </Screen>
    );
  }

  if (!isConnected) {
    return (
      <Screen centered padding>
        <View style={{ alignItems: 'center', maxWidth: 300 }}>
          <Text style={{ fontSize: 48, marginBottom: 24 }}>🚗</Text>
          <Text variant="h1" style={{ marginBottom: 12, textAlign: 'center' }}>
            Connect Your Tesla
          </Text>
          <Text variant="body" color="secondary" style={{ 
            marginBottom: 32, 
            textAlign: 'center',
            lineHeight: 24
          }}>
            Link your Tesla account to start tracking your vehicle usage and mileage automatically.
          </Text>
          <Button
            title="Connect Tesla Account"
            onPress={handleConnectTesla}
            loading={loading}
            style={{ 
              minWidth: 220,
              borderRadius: 12,
              paddingVertical: 16
            }}
          />
        </View>
      </Screen>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Screen centered padding>
        <View style={{ alignItems: 'center', maxWidth: 300 }}>
          <Text style={{ fontSize: 48, marginBottom: 24 }}>🔍</Text>
          <Text variant="h1" style={{ marginBottom: 12, textAlign: 'center' }}>
            No Vehicles Found
          </Text>
          <Text variant="body" color="secondary" style={{ 
            marginBottom: 32, 
            textAlign: 'center',
            lineHeight: 24
          }}>
            We couldn't find any Tesla vehicles associated with your account.
          </Text>
          <View style={{ gap: 12, width: '100%' }}>
            <Button
              title="Refresh Vehicles"
              onPress={refreshVehicles}
              loading={loading}
              style={{ borderRadius: 12, paddingVertical: 16 }}
            />
            <Button
              title="Reconnect Tesla"
              variant="ghost"
              onPress={handleConnectTesla}
              style={{ borderRadius: 12, paddingVertical: 16 }}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ 
        paddingHorizontal: 20, 
        paddingTop: 24, 
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
      }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 8
        }}>
          <Button
            title="← Dashboard"
            variant="ghost"
            onPress={() => navigate('dashboard')}
            style={{ 
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8
            }}
          />
        </View>
        <Text variant="heading1" style={{ marginBottom: 8 }}>
          Your Tesla Vehicles
        </Text>
        <Text variant="body" color="secondary">
          {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} connected
        </Text>
      </View>
      
      {error && (
        <View style={{ 
          margin: 16, 
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

      <FlatList
        data={vehicles}
        renderItem={renderVehicleItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ 
          padding: 20,
          paddingBottom: 40 
        }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshVehicles}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </Screen>
  );
};