import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { RADIUS, useThemeColors } from '@/styles/tokens';

interface SkeletonLoaderProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  variant?: 'rect' | 'circle' | 'text';
  style?: StyleProp<ViewStyle>;
}

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius,
  variant = 'rect',
  style,
}: SkeletonLoaderProps) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const calculatedRadius =
    borderRadius !== undefined
      ? borderRadius
      : variant === 'circle'
      ? 9999
      : variant === 'text'
      ? 4
      : RADIUS.sm;

  const bgStyle: ViewStyle = {
    width: width as any,
    height,
    borderRadius: calculatedRadius,
    backgroundColor: colors.border || 'rgba(255, 255, 255, 0.08)',
  };

  return <Animated.View style={[bgStyle, animatedStyle, style]} />;
}

