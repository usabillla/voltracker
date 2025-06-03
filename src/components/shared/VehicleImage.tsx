import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from './Text';

interface VehicleImageProps {
  model?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const VehicleImage: React.FC<VehicleImageProps> = ({
  model = 'Tesla',
  color = 'Unknown',
  size = 'medium',
  style,
}) => {
  const getModelImage = (modelName: string) => {
    const normalizedModel = modelName.toLowerCase();
    
    // For web, use the public path with PNG format for better browser support
    if (typeof window !== 'undefined') {
      if (normalizedModel.includes('model s')) {
        return '/images/Mega-Menu-Vehicles-Model-S.png';
      } else if (normalizedModel.includes('model 3')) {
        return '/images/Mega-Menu-Vehicles-Model-3-Performance-LHD.png';
      } else if (normalizedModel.includes('model x')) {
        return '/images/Mega-Menu-Vehicles-Model-X.png';
      } else if (normalizedModel.includes('model y')) {
        return '/images/Mega-Menu-Vehicles-Model-Y-2-v2.png';
      } else if (normalizedModel.includes('cybertruck')) {
        return '/images/Mega-Menu-Vehicles-Cybertruck-1x.png';
      }
      return '/images/Mega-Menu-Vehicles-Model-3-Performance-LHD.png'; // Default to Model 3
    }
    
    // For React Native, would require the images
    // For now, return null and fallback to emoji
    return null;
  };

  const getColorFilter = (colorName: string): string => {
    const normalizedColor = colorName.toLowerCase();
    
    if (normalizedColor.includes('white') || normalizedColor.includes('pearl')) {
      return 'brightness(1.2) contrast(1.1)'; // Bright white
    } else if (normalizedColor.includes('black') || normalizedColor.includes('midnight')) {
      return 'brightness(0.3) contrast(1.5)'; // Dark
    } else if (normalizedColor.includes('red') || normalizedColor.includes('cherry')) {
      return 'hue-rotate(0deg) saturate(1.5)'; // Red
    } else if (normalizedColor.includes('blue') || normalizedColor.includes('deep blue')) {
      return 'hue-rotate(240deg) saturate(1.3)'; // Blue
    } else if (normalizedColor.includes('gray') || normalizedColor.includes('grey') || normalizedColor.includes('silver')) {
      return 'brightness(0.8) saturate(0.3)'; // Gray/Silver
    }
    return 'brightness(1)'; // Default
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          image: { width: 80, height: 40 }
        };
      case 'large':
        return {
          image: { width: 200, height: 100 }
        };
      default: // medium
        return {
          image: { width: 120, height: 60 }
        };
    }
  };

  const getModelEmoji = (modelName: string): string => {
    const normalizedModel = modelName.toLowerCase();
    
    if (normalizedModel.includes('model s')) {
      return '🚗'; // Sedan
    } else if (normalizedModel.includes('model 3')) {
      return '🚙'; // Compact sedan
    } else if (normalizedModel.includes('model x')) {
      return '🚐'; // SUV with falcon doors
    } else if (normalizedModel.includes('model y')) {
      return '🚙'; // Compact SUV
    } else if (normalizedModel.includes('cybertruck')) {
      return '🛻'; // Pickup truck
    }
    return '🚗'; // Default
  };

  const sizeStyles = getSizeStyles();
  const modelImagePath = getModelImage(model);
  const modelEmoji = getModelEmoji(model);

  return (
    <View style={[styles.container, style]}>
      {modelImagePath ? (
        <Image
          source={{ uri: modelImagePath }}
          style={[
            styles.vehicleImage,
            sizeStyles.image
          ]}
          resizeMode="contain"
          onError={(error) => {
            console.log('Failed to load Tesla image:', modelImagePath, error.nativeEvent?.error);
          }}
          onLoad={() => {
            console.log('Successfully loaded Tesla image:', modelImagePath);
          }}
        />
      ) : (
        <Text style={[
          styles.emoji,
          { fontSize: sizeStyles.image.height * 0.6 }
        ]}>
          {modelEmoji}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleImage: {
    // Image styling will be applied via sizeStyles.image
  },
  emoji: {
    textAlign: 'center',
  },
});