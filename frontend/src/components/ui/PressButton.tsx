/**
 * PressButton
 *
 * A Pressable with a spring-scale press animation and an emerald glow
 * on the primary variant. Replaces raw Pressable throughout the app.
 *
 * Usage:
 *   <PressButton onPress={handleLogin} label="Sign In" />
 *   <PressButton variant="ghost" onPress={...} label="Cancel" />
 *   <PressButton loading onPress={...} label="Saving..." />
 */

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

import { COLORS, RADIUS, SHADOW } from '@/styles/tokens';

type Variant = 'primary' | 'ghost' | 'danger';

interface PressButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  /** Suffix element (e.g. arrow icon) */
  suffix?: React.ReactNode;
  id?: string;
}

export default function PressButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  suffix,
  id,
}: PressButtonProps) {
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

  const variantStyle: ViewStyle =
    variant === 'primary'
      ? styles.primary
      : variant === 'ghost'
      ? styles.ghost
      : styles.danger;

  const variantText: TextStyle =
    variant === 'primary'
      ? styles.primaryText
      : variant === 'ghost'
      ? styles.ghostText
      : styles.dangerText;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        id={id}
        onPress={isDisabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.base,
          variantStyle,
          isDisabled && styles.disabled,
          style,
        ]}
        // @ts-ignore — web hover
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
            color={variant === 'primary' ? '#ffffff' : COLORS.emerald}
            size="small"
          />
        ) : (
          <>
            <Text style={[styles.label, variantText, textStyle]}>{label}</Text>
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
    minHeight: 50,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  primary: {
    backgroundColor: COLORS.emerald,
    ...SHADOW.emerald,
  },
  ghost: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
  },
  danger: {
    backgroundColor: COLORS.errorDim,
    borderColor: 'rgba(239,68,68,0.25)',
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryText: {
    color: '#ffffff',
  },
  ghostText: {
    color: COLORS.textSub,
  },
  dangerText: {
    color: COLORS.error,
  },
});
