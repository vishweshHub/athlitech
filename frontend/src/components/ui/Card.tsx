import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Reanimated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import ScrollReveal from '@/components/animations/ScrollReveal';
import { useThemeColors, RADIUS } from '@/styles/tokens';

interface CardProps {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  /** If true, renders with the premium themed card background. Default: true */
  surface?: boolean;
  /** If true, wraps the card in a ScrollReveal entrance animation. Default: false */
  animated?: boolean;
}

export default function Card({
  children,
  delay = 0,
  style,
  surface = true,
  animated = false,
}: CardProps) {
  const colors = useThemeColors();

  const animatedCardStyle = useAnimatedStyle(() => {
    if (!surface) return {};
    return {
      backgroundColor: withTiming(colors.bgGlass, { duration: 400 }),
      borderColor: withTiming(colors.border, { duration: 400 }),
    };
  }, [surface, colors]);

  const cardStyle: ViewStyle = surface
    ? {
        borderWidth: 1,
        borderRadius: RADIUS.lg,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        ...Platform.select({
          web: {
            boxShadow: `0 8px 32px ${colors.cardShadow}`,
          } as any,
          default: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 4,
          },
        }),
      }
    : {};

  const content = (
    <Reanimated.View style={[cardStyle, surface && animatedCardStyle, style]}>
      {/* Premium glass blur overlay (Web only) */}
      {surface && Platform.OS === 'web' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: RADIUS.lg - 1,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />
      )}
      {children}
    </Reanimated.View>
  );

  if (animated) {
    return (
      <ScrollReveal
        delay={delay}
        duration={600}
        slideDistance={24}
        style={{ width: '100%' }}
      >
        {content}
      </ScrollReveal>
    );
  }

  return content;
}
