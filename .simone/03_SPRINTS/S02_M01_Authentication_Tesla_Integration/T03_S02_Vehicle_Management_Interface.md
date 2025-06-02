---
title: "Vehicle Management Interface"
type: "task"
status: "completed"
priority: "high"
sprint: "S02_M01_Authentication_Tesla_Integration"
tags: ["tesla", "ui", "vehicles", "react-native"]
assignee: "development-team"
estimated_hours: 16
dependencies:
  - "T01_S02_Tesla_OAuth_Integration"
  - "T02_S02_Vehicle_Data_Fetching"
created_date: "2025-02-06"
updated_date: "2025-06-02"
---

# T03_S02_Vehicle_Management_Interface

## Task Overview
Create a comprehensive vehicle management interface that displays Tesla vehicles, allows vehicle selection with persistence, shows real-time vehicle data, and provides connectivity verification. Build intuitive UI components for vehicle cards, selection flows, and status indicators using the existing VolTracker design system.

## Current State Analysis

### Existing Infrastructure
Current vehicle-related components in VolTracker:
- **Tesla Service** (`src/services/tesla.ts`): Complete Tesla Fleet API integration with OAuth, token management, and vehicle data fetching
- **useTesla Hook** (`src/hooks/useTesla.ts`): Vehicle state management with database persistence via Supabase
- **Database Schema** (`database.sql`): `vehicles` table with Tesla tokens, VIN, display_name, model, year, color fields
- **Shared Components** (`src/components/shared/`): Button, Text, Screen, Input, LoadingSpinner with theme support
- **Theme System** (`src/theme/index.ts`): Light/dark theme with colors, typography, spacing, and border radius
- **Dashboard Screen** (`src/screens/dashboard/DashboardScreen.tsx`): Basic connected vehicles display

### Current Implementation Details
- **Vehicle Storage**: Vehicles stored in Supabase with `tesla_tokens` JSONB field containing access/refresh tokens
- **Vehicle Types**: `TeslaVehicle` interface includes id, vin, display_name, option_codes, color, state, api_version
- **State Management**: `useTesla` hook provides vehicles array, loading states, error handling, and connection status
- **Platform Support**: Cross-platform with web/mobile detection via `platformSelect` utility

### Current Limitations
- No dedicated vehicle listing screen - only basic display in dashboard
- No vehicle selection persistence - missing selected vehicle storage
- No detailed vehicle status display with battery, range, location
- No vehicle detail screens for comprehensive data
- Missing vehicle management navigation structure

## Technical Guidance

### Architecture Overview
The vehicle management interface should integrate seamlessly with the existing VolTracker architecture:

```
src/
├── screens/
│   └── vehicles/           # New vehicle management screens
│       ├── VehicleListScreen.tsx
│       ├── VehicleDetailScreen.tsx
│       └── index.ts
├── components/
│   └── vehicles/           # New vehicle-specific components
│       ├── VehicleCard.tsx
│       ├── VehicleStatusCard.tsx
│       ├── VehicleInfoCard.tsx
│       └── index.ts
├── hooks/
│   └── useTesla.ts         # Extend existing hook
├── services/
│   └── tesla.ts            # Extend with vehicle detail APIs
└── utils/
    └── storage.ts          # Add vehicle selection persistence
```

### Database Integration
Leverage existing `vehicles` table structure:
```sql
-- Current schema (from database.sql)
CREATE TABLE public.vehicles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    tesla_id TEXT UNIQUE NOT NULL,
    vin TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT,
    tesla_tokens JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true
);
```

### Theme Integration
Use existing theme system from `src/theme/index.ts`:
```typescript
// Available theme tokens
const theme = useTheme();
theme.colors.primary      // #007bff
theme.colors.success      // #28a745 (for online status)
theme.colors.warning      // #ffc107 (for asleep status)
theme.colors.error        // #dc3545 (for offline status)
theme.spacing.md          // 16px
theme.borderRadius.md     // 8px
```

### Component Reusability
Extend existing shared components:
- `Button` component with variants: primary, secondary, outline, ghost
- `Text` component with variants: heading1, heading2, body, caption
- `Screen` component with padding and centered props
- `LoadingSpinner` for async operations

## Implementation Notes

### Phase 1: Core Infrastructure Enhancement

#### Step 1.1: Extend useTesla Hook
**File**: `src/hooks/useTesla.ts`

**Add these functions to existing hook**:
```typescript
// Add to existing TeslaState interface
export interface TeslaState {
  vehicles: TeslaVehicle[];
  selectedVehicle: TeslaVehicle | null;  // NEW
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

// New functions to add
const selectVehicle = async (vehicle: TeslaVehicle) => {
  await storage.setItem('selectedVehicle', JSON.stringify(vehicle));
  setTeslaState(prev => ({ ...prev, selectedVehicle: vehicle }));
};

const clearError = () => {
  setTeslaState(prev => ({ ...prev, error: null }));
};
```

#### Step 1.2: Extend Tesla Service
**File**: `src/services/tesla.ts`

**Add vehicle detail API methods**:
```typescript
// Add to TeslaService class
static async getVehicleData(vehicleId: number, accessToken: string) {
  // Fetch comprehensive vehicle data including charge_state, drive_state, vehicle_state
}

static async wakeVehicle(vehicleId: number, accessToken: string) {
  // Wake up sleeping vehicle
}
```

#### Step 1.3: Create Vehicle Directory Structure
**Directories to create**:
- `src/screens/vehicles/`
- `src/components/vehicles/`

### Phase 2: Vehicle List Screen Implementation

#### Step 2.1: Create VehicleListScreen
**File**: `src/screens/vehicles/VehicleListScreen.tsx`

**Key Requirements**:
- Use existing `Screen` component as container
- Implement pull-to-refresh with `RefreshControl`
- Handle connection states: not connected, no vehicles, vehicles loaded
- Use `FlatList` for vehicle rendering
- Integrate with navigation for vehicle details

**Connection States to Handle**:
1. **Not Connected**: Show connect Tesla button using existing `connectTesla` function
2. **No Vehicles**: Show empty state with refresh option
3. **Vehicles Loaded**: Display vehicle cards with selection capability

#### Step 2.2: Create VehicleCard Component
**File**: `src/components/vehicles/VehicleCard.tsx`

**Design Requirements**:
- Use theme colors for status indicators (online/asleep/offline)
- Implement selection state with visual feedback
- Show vehicle image placeholder or Tesla logo
- Display VIN last 6 digits as fallback for display_name
- Use existing Button components for actions

**Status Color Mapping**:
```typescript
const getStatusColor = (state: string) => {
  switch (state) {
    case 'online': return theme.colors.success;   // Green
    case 'asleep': return theme.colors.warning;   // Yellow
    case 'offline': return theme.colors.error;    // Red
    default: return theme.colors.secondary;       // Gray
  }
};
```

### Phase 3: Vehicle Detail Screen

#### Step 3.1: Create VehicleDetailScreen
**File**: `src/screens/vehicles/VehicleDetailScreen.tsx`

**Data Fetching Strategy**:
1. Get vehicle from navigation params
2. Load detailed data using Tesla API
3. Handle token refresh if needed
4. Display loading states and error handling

#### Step 3.2: Create Status and Info Cards
**Files**: 
- `src/components/vehicles/VehicleStatusCard.tsx`
- `src/components/vehicles/VehicleInfoCard.tsx`

**VehicleStatusCard Data**:
- Connection status with colored indicator
- Battery level and range (if available)
- Odometer reading
- Current location (lat/lng)

**VehicleInfoCard Data**:
- Model name derived from VIN or option_codes
- Full VIN display
- Color information
- Software version
- API version

### Phase 4: Navigation Integration

#### Step 4.1: Update Navigation Types
**File**: Create or update navigation type definitions

```typescript
export type MainStackParamList = {
  Dashboard: undefined;
  VehicleList: undefined;
  VehicleDetail: { vehicleId: number };
};
```

#### Step 4.2: Add Vehicle Screens to Navigator
**Integration Points**:
- Add screens to main stack navigator
- Update dashboard to link to vehicle list
- Implement navigation from list to detail

### Phase 5: Vehicle Selection Persistence

#### Step 5.1: Implement Selection Storage
**File**: `src/utils/storage.ts`

**Add functions**:
```typescript
export const vehicleStorage = {
  async setSelectedVehicle(vehicle: TeslaVehicle): Promise<void> {
    await storage.setItem('selectedVehicle', JSON.stringify(vehicle));
  },
  
  async getSelectedVehicle(): Promise<TeslaVehicle | null> {
    const stored = await storage.getItem('selectedVehicle');
    return stored ? JSON.parse(stored) : null;
  },
  
  async clearSelectedVehicle(): Promise<void> {
    await storage.removeItem('selectedVehicle');
  }
};
```

## Technical Implementation

### Phase 1: Vehicle List Screen

#### Create VehicleListScreen (`src/screens/vehicles/VehicleListScreen.tsx`)
```typescript
import React, { useEffect } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, Text, Button, LoadingSpinner } from '../../components/shared';
import { VehicleCard } from '../../components/vehicles/VehicleCard';
import { useTesla } from '../../hooks/useTesla';
import { TeslaVehicle } from '../../services/tesla';

export const VehicleListScreen: React.FC = () => {
  const navigation = useNavigation();
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
      const { url } = await connectTesla();
      // Platform-specific OAuth URL opening will be handled by the hook
    } catch (error) {
      console.error('Failed to initiate Tesla connection:', error);
    }
  };

  const handleVehicleSelect = async (vehicle: TeslaVehicle) => {
    try {
      await selectVehicle(vehicle);
      navigation.navigate('VehicleDetail', { vehicleId: vehicle.id });
    } catch (error) {
      console.error('Failed to select vehicle:', error);
    }
  };

  const renderVehicleItem = ({ item }: { item: TeslaVehicle }) => (
    <VehicleCard
      vehicle={item}
      isSelected={selectedVehicle?.id === item.id}
      onSelect={() => handleVehicleSelect(item)}
      onViewDetail={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
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
        <Text variant="h1" style={{ marginBottom: 16, textAlign: 'center' }}>
          Connect Your Tesla
        </Text>
        <Text variant="body" color="secondary" style={{ marginBottom: 32, textAlign: 'center' }}>
          Link your Tesla account to start tracking your vehicle usage and mileage automatically.
        </Text>
        <Button
          title="Connect Tesla Account"
          onPress={handleConnectTesla}
          loading={loading}
          style={{ minWidth: 200 }}
        />
      </Screen>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Screen centered padding>
        <Text variant="h1" style={{ marginBottom: 16, textAlign: 'center' }}>
          No Vehicles Found
        </Text>
        <Text variant="body" color="secondary" style={{ marginBottom: 32, textAlign: 'center' }}>
          We couldn't find any Tesla vehicles associated with your account.
        </Text>
        <Button
          title="Refresh Vehicles"
          onPress={refreshVehicles}
          loading={loading}
          style={{ marginBottom: 16 }}
        />
        <Button
          title="Reconnect Tesla"
          variant="ghost"
          onPress={handleConnectTesla}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="h1" style={{ margin: 16 }}>
        Your Tesla Vehicles
      </Text>
      
      {error && (
        <Text variant="body" color="error" style={{ margin: 16, textAlign: 'center' }}>
          {error}
        </Text>
      )}

      <FlatList
        data={vehicles}
        renderItem={renderVehicleItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshVehicles}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
};
```

### Phase 2: Vehicle Card Component

#### Create VehicleCard (`src/components/vehicles/VehicleCard.tsx`)
```typescript
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Button } from '../shared';
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

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderWidth: isSelected ? 2 : 1,
      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    nameContainer: {
      flex: 1,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: theme.spacing.xs,
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
      justifyContent: 'space-between',
    },
    actionButton: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
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
            {vehicle.option_codes?.includes('MS') ? 'Model S' :
             vehicle.option_codes?.includes('MX') ? 'Model X' :
             vehicle.option_codes?.includes('M3') ? 'Model 3' :
             vehicle.option_codes?.includes('MY') ? 'Model Y' : 'Tesla'}
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
          title={isSelected ? "Selected" : "Select"}
          onPress={onSelect}
          variant={isSelected ? "primary" : "secondary"}
          style={styles.actionButton}
          disabled={isSelected}
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
```

### Phase 3: Vehicle Detail Screen

#### Create VehicleDetailScreen (`src/screens/vehicles/VehicleDetailScreen.tsx`)
```typescript
import React, { useEffect, useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Screen, Text, Button, LoadingSpinner } from '../../components/shared';
import { VehicleStatusCard } from '../../components/vehicles/VehicleStatusCard';
import { VehicleInfoCard } from '../../components/vehicles/VehicleInfoCard';
import { TeslaService } from '../../services/tesla';
import { useTesla } from '../../hooks/useTesla';

interface RouteParams {
  vehicleId: number;
}

export const VehicleDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { vehicleId } = route.params as RouteParams;
  const { vehicles, selectVehicle } = useTesla();
  
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const vehicle = vehicles.find(v => v.id === vehicleId);

  useEffect(() => {
    if (!vehicle) {
      navigation.goBack();
      return;
    }
    
    loadVehicleData();
  }, [vehicle]);

  const loadVehicleData = async () => {
    if (!vehicle) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await TeslaService.getVehicleData(vehicle.id);
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
        navigation.navigate('Dashboard');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to select vehicle');
      }
    }
  };

  if (!vehicle) {
    return (
      <Screen centered>
        <Text variant="h2">Vehicle not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
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
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadVehicleData} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text variant="h1" style={{ margin: 16 }}>
          {vehicle.display_name || `Tesla ${vehicle.vin.slice(-6)}`}
        </Text>

        {error && (
          <Text variant="body" color="error" style={{ margin: 16, textAlign: 'center' }}>
            {error}
          </Text>
        )}

        <VehicleStatusCard vehicle={vehicle} vehicleData={vehicleData} />
        <VehicleInfoCard vehicle={vehicle} vehicleData={vehicleData} />

        <Button
          title="Select This Vehicle"
          onPress={handleSelectVehicle}
          style={{ margin: 16 }}
        />
        
        <Button
          title="Refresh Data"
          onPress={loadVehicleData}
          variant="secondary"
          loading={loading}
          style={{ margin: 16 }}
        />
      </ScrollView>
    </Screen>
  );
};
```

### Phase 4: Vehicle Status and Info Cards

#### Create VehicleStatusCard (`src/components/vehicles/VehicleStatusCard.tsx`)
```typescript
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

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.md,
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

      {vehicleData?.charge_state && (
        <View style={styles.row}>
          <Text variant="body" color="secondary">Battery Level</Text>
          <Text variant="body">
            {vehicleData.charge_state.battery_level}%
          </Text>
        </View>
      )}

      {vehicleData?.charge_state && (
        <View style={styles.row}>
          <Text variant="body" color="secondary">Range</Text>
          <Text variant="body">
            {Math.round(vehicleData.charge_state.battery_range)} miles
          </Text>
        </View>
      )}

      {vehicleData?.drive_state && (
        <View style={styles.row}>
          <Text variant="body" color="secondary">Odometer</Text>
          <Text variant="body">
            {formatOdometer(vehicleData.drive_state.odometer)}
          </Text>
        </View>
      )}

      <View style={styles.lastRow}>
        <Text variant="body" color="secondary">Location</Text>
        <Text variant="body" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
          {formatLocation(vehicleData?.drive_state)}
        </Text>
      </View>
    </View>
  );
};
```

#### Create VehicleInfoCard (`src/components/vehicles/VehicleInfoCard.tsx`)
```typescript
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

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.md,
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

      {vehicleData?.vehicle_config?.car_type && (
        <View style={styles.row}>
          <Text variant="body" color="secondary">Type</Text>
          <Text variant="body" style={{ textTransform: 'capitalize' }}>
            {vehicleData.vehicle_config.car_type}
          </Text>
        </View>
      )}

      {vehicleData?.vehicle_state?.software_update && (
        <View style={styles.row}>
          <Text variant="body" color="secondary">Software</Text>
          <Text variant="body">
            {formatSoftwareVersion(vehicleData.vehicle_state.car_version)}
          </Text>
        </View>
      )}

      <View style={styles.lastRow}>
        <Text variant="body" color="secondary">API Version</Text>
        <Text variant="body">{vehicle.api_version}</Text>
      </View>
    </View>
  );
};
```

### Phase 5: Navigation Integration

#### Update navigation types to include vehicle screens
```typescript
// src/types/navigation.ts
export type MainStackParamList = {
  Dashboard: undefined;
  VehicleList: undefined;
  VehicleDetail: { vehicleId: number };
  // ... other screens
};
```

#### Add vehicle screens to main navigator
```typescript
// src/navigation/MainNavigator.tsx
import { VehicleListScreen } from '../screens/vehicles/VehicleListScreen';
import { VehicleDetailScreen } from '../screens/vehicles/VehicleDetailScreen';

// Add to stack navigator
<Stack.Screen name="VehicleList" component={VehicleListScreen} />
<Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
```

## Testing Strategy

### Unit Testing
**Vehicle Components** (`__tests__/components/vehicles/`):
- `VehicleCard.test.tsx`: Rendering, selection states, status colors
- `VehicleStatusCard.test.tsx`: Data display, status indicators
- `VehicleInfoCard.test.tsx`: Vehicle information parsing

**Hook Testing** (`__tests__/hooks/`):
- `useTesla.test.ts`: Vehicle selection, storage integration, error handling

**Service Testing** (`__tests__/services/`):
- `tesla.test.ts`: Vehicle data fetching, API error handling

### Integration Testing
**Screen Testing** (`__tests__/screens/vehicles/`):
- `VehicleListScreen.test.tsx`: List rendering, refresh functionality, navigation
- `VehicleDetailScreen.test.tsx`: Detail loading, data display, vehicle selection

**Navigation Testing**:
- Vehicle list to detail navigation with proper params
- Back navigation and state preservation
- Deep linking to vehicle details

### End-to-End Testing
**User Flows**:
1. Connect Tesla account → View vehicles → Select vehicle → View details
2. Refresh vehicle list → Handle API errors → Retry mechanisms
3. Vehicle selection persistence across app restarts

**Platform Testing**:
- iOS: Native navigation, safe area handling
- Android: Material design compliance, hardware back button
- Web: Responsive design, browser refresh handling

**Performance Testing**:
- Vehicle list rendering with 10+ vehicles
- Image loading optimization
- API response caching
- Memory usage monitoring

## Error Handling

### Tesla API Error Scenarios
**Authentication Errors**:
- Expired access tokens → Automatic refresh using stored refresh token
- Invalid refresh tokens → Redirect to Tesla re-authentication
- Rate limiting → Exponential backoff retry strategy

**Vehicle API Errors**:
- Vehicle asleep → Show wake vehicle option
- Vehicle offline → Clear offline status indicator
- Invalid vehicle ID → Navigate back to vehicle list
- Insufficient permissions → Show permission error message

**Network Errors**:
- No internet connection → Show offline mode with cached data
- Timeout errors → Retry with increasing intervals
- DNS resolution failures → Fallback to cached vehicle info

### UI Error State Implementation
**Error Components**:
```typescript
// Error states in VehicleListScreen
if (!isConnected) {
  return <ConnectTeslaPrompt onConnect={connectTesla} loading={loading} />;
}

if (vehicles.length === 0) {
  return <EmptyVehicleList onRefresh={refreshVehicles} loading={loading} />;
}

if (error) {
  return <ErrorState error={error} onRetry={clearError} />;
}
```

**Loading States**:
- Skeleton loading for vehicle cards
- Pull-to-refresh loading indicators
- Button loading states for actions
- Progressive loading for vehicle details

**Data Freshness**:
- Timestamp display for last updated data
- Visual indicators for stale data (>5 minutes old)
- Automatic refresh intervals for critical data
- Manual refresh controls always available

## Success Criteria

### Core Functionality
- [ ] **Vehicle List Display**: Users can view all connected Tesla vehicles in a scrollable list
- [ ] **Vehicle Cards**: Each vehicle shows display name, VIN, model, color, and connection status
- [ ] **Vehicle Selection**: Users can select a primary vehicle with persistent storage
- [ ] **Status Indicators**: Real-time status (online/asleep/offline) with appropriate colors
- [ ] **Vehicle Details**: Comprehensive detail screen with battery, range, odometer, location
- [ ] **Data Refresh**: Pull-to-refresh and manual refresh functionality
- [ ] **Navigation**: Seamless navigation between list and detail screens

### User Experience
- [ ] **Loading States**: Smooth loading indicators for all async operations
- [ ] **Error Handling**: Clear error messages with actionable recovery options
- [ ] **Empty States**: Helpful guidance when no vehicles are connected
- [ ] **Platform Consistency**: Identical functionality across iOS, Android, and Web
- [ ] **Performance**: List renders smoothly with 10+ vehicles
- [ ] **Accessibility**: Screen reader support and proper contrast ratios

### Technical Requirements
- [ ] **State Management**: Vehicle selection persists across app sessions
- [ ] **API Integration**: Robust error handling for Tesla API failures
- [ ] **Token Management**: Automatic token refresh without user intervention
- [ ] **Offline Support**: Graceful degradation when network unavailable
- [ ] **Security**: Tesla tokens remain secure in device storage
- [ ] **Code Quality**: Components follow established patterns and TypeScript standards

## Dependencies

### Completed Prerequisites
- [ ] **Tesla OAuth Integration** (T01_S02): Tesla authentication flow must be working
- [ ] **Vehicle Data Fetching** (T02_S02): Basic vehicle API integration must be functional
- [ ] **Database Schema**: `vehicles` table must be created and accessible
- [ ] **User Authentication**: Supabase auth must be working for user-specific vehicle storage

### External APIs
- **Tesla Fleet API**: Vehicle list and detail endpoints
- **Tesla Auth API**: Token refresh capabilities
- **Supabase Database**: Vehicle storage and retrieval
- **Platform APIs**: Navigation and storage on mobile platforms

### Existing Infrastructure
- **Shared Components**: Button, Text, Screen, LoadingSpinner components
- **Theme System**: Complete theme with colors, typography, spacing
- **useTesla Hook**: Basic vehicle state management
- **Platform Utilities**: Cross-platform detection and storage
- **Navigation**: React Navigation setup (assumed from mobile app structure)

### Development Tools
- **TypeScript**: Type safety for all vehicle interfaces
- **Jest**: Testing framework for component and hook testing
- **React Native**: Cross-platform mobile development
- **Expo**: Development and build tooling (if used)

## Future Enhancements

### Phase 2 Features (Post-MVP)
**Advanced Vehicle Management**:
- Vehicle location mapping with interactive maps
- Real-time push notifications for status changes
- Vehicle command execution (lock/unlock, climate control, charging)
- Multiple vehicle comparison dashboard
- Vehicle sharing and permissions management

**Enhanced Data Visualization**:
- Battery level trends and charging patterns
- Trip history with route visualization
- Energy consumption analytics
- Carbon footprint tracking
- Cost analysis for charging vs. gas savings

**Smart Features**:
- Predictive charging recommendations
- Optimal route planning with charging stops
- Maintenance reminders based on mileage
- Weather-based range predictions
- Automatic trip categorization (business/personal)

### Technical Improvements
**Performance Optimizations**:
- Vehicle data caching with background sync
- Image optimization and lazy loading
- Progressive data loading for large vehicle fleets
- Offline-first architecture with sync queues

**Developer Experience**:
- Storybook component documentation
- Automated visual regression testing
- Component performance monitoring
- Analytics for user interaction patterns

## Risk Mitigation

### Tesla API Risks
**API Availability Issues**:
- **Risk**: Tesla API downtime affecting vehicle data access
- **Mitigation**: Implement cached data fallbacks, show last known status with timestamps
- **Monitoring**: Health check endpoints and user-facing service status

**Rate Limiting**:
- **Risk**: Exceeding Tesla API rate limits
- **Mitigation**: Implement exponential backoff, request queuing, and smart refresh intervals
- **Prevention**: Cache frequently accessed data, batch API requests

**Token Expiration**:
- **Risk**: Tokens expiring during critical operations
- **Mitigation**: Proactive token refresh, graceful fallback to re-authentication
- **User Experience**: Seamless background refresh without user disruption

### Data Integrity Risks
**Stale Data Display**:
- **Risk**: Users seeing outdated vehicle information
- **Mitigation**: Timestamp all data, visual indicators for data age, automatic refresh triggers
- **Validation**: Cross-reference critical data points, implement data freshness policies

**Sync Issues**:
- **Risk**: Local storage out of sync with Tesla API
- **Mitigation**: Conflict resolution strategies, periodic full sync, user-initiated sync options
- **Recovery**: Clear cache and re-fetch options, data consistency checks

### User Experience Risks
**Performance Degradation**:
- **Risk**: Slow loading with many vehicles or poor network
- **Mitigation**: Pagination, lazy loading, skeleton screens, progressive enhancement
- **Optimization**: Image compression, efficient state management, background data loading

**Cross-Platform Inconsistencies**:
- **Risk**: Different behavior on iOS, Android, Web
- **Mitigation**: Comprehensive platform testing, shared component library, platform-specific optimizations
- **Quality Assurance**: Automated cross-platform testing, manual QA on all targets

## Implementation Priority

### Sprint Breakdown (16 hours total)

**Week 1 - Core Infrastructure (8 hours)**:
1. **Day 1-2**: Extend useTesla hook with selection and error handling (3 hours)
2. **Day 2-3**: Create vehicle directory structure and base components (2 hours)
3. **Day 3-4**: Implement VehicleListScreen with basic vehicle cards (3 hours)

**Week 2 - Details and Polish (8 hours)**:
4. **Day 1-2**: Build VehicleDetailScreen with status and info cards (3 hours)
5. **Day 2-3**: Implement navigation integration and vehicle selection persistence (2 hours)
6. **Day 3-4**: Error handling, loading states, and testing (3 hours)

### Task Dependency Order
```
useTesla Hook Extension
       ↓
Vehicle Components Creation
       ↓
VehicleListScreen Implementation
       ↓
VehicleDetailScreen Implementation
       ↓
Navigation Integration
       ↓
Selection Persistence
       ↓
Error Handling & Testing
```

### Definition of Done
- [x] All components have TypeScript types
- [ ] Unit tests written for all new components
- [ ] Integration tests for vehicle screens
- [x] Error states tested and documented
- [ ] Cross-platform testing completed
- [ ] Code review passed
- [ ] Design review approved
- [ ] Performance testing completed
- [ ] Accessibility testing passed

## Output Log

[2025-06-02 18:45]: Vehicle Management Interface Implementation - COMPLETED
Result: **COMPLETED** - All core vehicle management functionality implemented
**Scope:** Complete implementation of vehicle management interface for Tesla vehicles
**Components Implemented:**
- VehicleCard component with status indicators and Tesla model detection
- VehicleListScreen with connection states, empty states, and error handling
- VehicleDetailScreen with comprehensive vehicle data fetching
- VehicleStatusCard showing battery, range, odometer, location, and connection status
- VehicleInfoCard displaying vehicle specifications and software version
**Features:**
- ✅ Vehicle selection with persistent storage
- ✅ Real-time status indicators (online/asleep/offline) with color coding
- ✅ Comprehensive vehicle data display (charge state, drive state, vehicle config)
- ✅ Pull-to-refresh functionality
- ✅ Error handling with user-friendly messages
- ✅ Loading states for all async operations
- ✅ Navigation integration with parameter passing
- ✅ Enhanced useTesla hook with vehicle data fetching
- ✅ Extended TeslaService with vehicle detail APIs
**Navigation:** Updated navigation types to support vehicle-detail route with parameters
**Storage:** Vehicle selection persistence using SecureStorage service
**Status:** Ready for testing and integration with main navigation