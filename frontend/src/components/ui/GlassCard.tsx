import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/useTheme';
import { RADIUS } from '@/theme/spacing';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function GlassCard({ children, style }: GlassCardProps) {
  const { theme, colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(colors.bgGlass, { duration: 400 }),
      borderColor: withTiming(colors.borderSubtle, { duration: 400 }),
      shadowColor: withTiming(theme === 'dark' ? '#000000' : '#475569', { duration: 400 }),
      shadowOpacity: withTiming(theme === 'dark' ? 0.3 : 0.05, { duration: 400 }),
    };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 5,
  },
});
