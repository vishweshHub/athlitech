import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

import { useThemeColors, RADIUS } from '@/styles/tokens';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
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
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const resolvedRadius =
    borderRadius !== undefined
      ? borderRadius
      : variant === 'circle'
      ? 999
      : variant === 'text'
      ? RADIUS.xs
      : RADIUS.sm;

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius: resolvedRadius,
          backgroundColor: colors.skeletonBg,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}
