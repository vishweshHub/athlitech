import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useThemeColors, RADIUS } from '@/styles/tokens';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export default function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const colors = useThemeColors();

  const getStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: colors.emeraldDim,
          border: colors.borderEmerald || 'rgba(16,185,129,0.15)',
          text: colors.success,
        };
      case 'warning':
        return {
          bg: colors.theme === 'light' ? 'rgba(217,119,6,0.08)' : 'rgba(245,158,11,0.08)',
          border: colors.theme === 'light' ? 'rgba(217,119,6,0.15)' : 'rgba(245,158,11,0.15)',
          text: colors.warning,
        };
      case 'error':
        return {
          bg: colors.errorDim,
          border: 'rgba(239,68,68,0.15)',
          text: colors.error,
        };
      case 'info':
        return {
          bg: colors.infoDim,
          border: 'rgba(14,165,233,0.15)',
          text: colors.info,
        };
      case 'neutral':
      default:
        return {
          bg: colors.neutral,
          border: colors.border,
          text: colors.neutralText,
        };
    }
  };

  const current = getStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: current.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
