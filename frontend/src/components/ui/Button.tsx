import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

import { useThemeColors, RADIUS, SHADOW } from '@/styles/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  id?: string;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  prefix,
  suffix,
  id,
}: ButtonProps) {
  const colors = useThemeColors();
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }

  const isDisabled = disabled || loading;

  // ── Styles setup ──────────────────────────────────────────────────────────
  const sizeStyles = {
    sm: {
      minHeight: 38,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: RADIUS.sm,
    },
    md: {
      minHeight: 48,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: RADIUS.md,
    },
    lg: {
      minHeight: 56,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: RADIUS.lg,
    },
  }[size];

  const sizeTextStyles = {
    sm: { fontSize: 14, fontWeight: '600' as const },
    md: { fontSize: 16, fontWeight: '700' as const },
    lg: { fontSize: 18, fontWeight: '800' as const },
  }[size];

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.emerald,
          ...Platform.select({
            web: {
              boxShadow: `0 8px 20px ${colors.emeraldGlow}`,
            } as any,
            default: {
              shadowColor: colors.emerald,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 8,
            },
          }),
        };
      case 'secondary':
        return {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderWidth: 1,
          ...Platform.select({
            web: {
              boxShadow: `0 4px 12px ${colors.cardShadow}`,
            } as any,
            default: {
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 3,
            },
          }),
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: colors.errorDim,
          borderColor: 'rgba(239,68,68,0.25)',
          borderWidth: 1,
        };
    }
  };

  const getVariantTextStyles = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return { color: '#ffffff' };
      case 'secondary':
        return { color: colors.textPrimary };
      case 'ghost':
        return { color: colors.textSub };
      case 'danger':
        return { color: colors.error };
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        id={id}
        onPress={isDisabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.base,
          sizeStyles,
          getVariantStyles(),
          isDisabled && styles.disabled,
        ]}
        // @ts-ignore
        onMouseEnter={
          Platform.OS === 'web' && variant === 'primary'
            ? () =>
                Animated.spring(scale, {
                  toValue: 1.02,
                  useNativeDriver: true,
                  tension: 200,
                  friction: 12,
                }).start()
            : undefined
        }
        onMouseLeave={
          Platform.OS === 'web' && variant === 'primary'
            ? () =>
                Animated.spring(scale, {
                  toValue: 1,
                  useNativeDriver: true,
                  tension: 200,
                  friction: 12,
                }).start()
            : undefined
        }
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? '#ffffff' : colors.emerald}
            size="small"
          />
        ) : (
          <>
            {prefix}
            <Text style={[styles.label, sizeTextStyles, getVariantTextStyles(), textStyle]}>
              {label}
            </Text>
            {suffix}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    textAlign: 'center',
  },
});
