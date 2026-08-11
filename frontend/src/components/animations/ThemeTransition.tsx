import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/theme/useTheme';
import Stars from './Stars';
import Clouds from './Clouds';
import LightParticles from './LightParticles';

interface ThemeTransitionProps {
  children: React.ReactNode;
}

export default function ThemeTransition({ children }: ThemeTransitionProps) {
  const { theme, colors } = useTheme();

  const isDark = theme === 'dark';

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(colors.bg, { duration: 600 }),
    };
  });

  const darkOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isDark ? 1 : 0, { duration: 600 }),
    };
  });

  const lightOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isDark ? 0 : 1, { duration: 600 }),
    };
  });

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      {/* Dark Theme Background */}
      <Animated.View style={[StyleSheet.absoluteFill, darkOverlayStyle, { pointerEvents: 'none' as any }]}>
        <LinearGradient
          colors={['#02050a', '#0a101d']}
          style={StyleSheet.absoluteFill}
        />
        <Stars />
      </Animated.View>

      {/* Light Theme Background */}
      <Animated.View style={[StyleSheet.absoluteFill, lightOverlayStyle, { pointerEvents: 'none' as any }]}>
        <LinearGradient
          colors={['#e0f2fe', '#f8fafc']}
          style={StyleSheet.absoluteFill}
        />
        <Clouds />
        <LightParticles />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
