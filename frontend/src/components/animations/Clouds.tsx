import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const CLOUD_COUNT = 3;

function Cloud({ top, initialLeft, duration, size, opacity }: { top: number; initialLeft: number; duration: number; size: number; opacity: number }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withRepeat(
            withTiming(width + size, { 
              duration, 
              easing: Easing.linear 
            }),
            -1,
            false
          )
        }
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.cloud,
        {
          top,
          left: initialLeft - size, // Start off-screen to the left
          width: size,
          height: size * 0.4,
          borderRadius: size / 2,
          opacity,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function Clouds() {
  const [clouds, setClouds] = useState<{ id: number; top: number; initialLeft: number; duration: number; size: number; opacity: number }[]>([]);

  useEffect(() => {
    const newClouds = Array.from({ length: CLOUD_COUNT }).map((_, i) => ({
      id: i,
      top: Math.random() * (height * 0.4), // Only top 40% of screen
      initialLeft: -Math.random() * 200,
      duration: Math.random() * 40000 + 40000, // Very slow movement
      size: Math.random() * 150 + 100,
      opacity: Math.random() * 0.3 + 0.1, // Subtle
    }));
    setClouds(newClouds);
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' as any }]}>
      {clouds.map((cloud) => (
        <Cloud key={cloud.id} {...cloud} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cloud: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 2,
  },
});
