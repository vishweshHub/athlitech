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
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, withTiming, withSpring, useSharedValue } from 'react-native-reanimated';

import { RADIUS, SHADOW, useThemeColors } from '@/styles/tokens';

type Variant = 'primary' | 'ghost' | 'danger';

interface PressButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
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
  const colors = useThemeColors();
  const scale = useSharedValue(1);

  function handlePressIn() {
    scale.value = withSpring(0.96, { damping: 10, stiffness: 300 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  }

  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => {
    let bgColor, borderColor, shadowColor, shadowOpacity;
    if (variant === 'primary') {
      bgColor = colors.emerald;
      borderColor = 'transparent';
      shadowColor = colors.emerald;
      shadowOpacity = 0.35;
    } else if (variant === 'ghost') {
      bgColor = colors.inputBg || 'rgba(255,255,255,0.04)';
      borderColor = colors.border || 'rgba(255,255,255,0.1)';
      shadowColor = 'transparent';
      shadowOpacity = 0;
    } else {
      bgColor = colors.errorDim || 'rgba(239,68,68,0.1)';
      borderColor = 'rgba(239,68,68,0.25)';
      shadowColor = 'transparent';
      shadowOpacity = 0;
    }

    return {
      transform: [{ scale: scale.value }],
      backgroundColor: withTiming(bgColor, { duration: 400 }),
      borderColor: withTiming(borderColor, { duration: 400 }),
      shadowColor: withTiming(shadowColor, { duration: 400 }),
      shadowOpacity: withTiming(shadowOpacity, { duration: 400 }),
    };
  });

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const variantText: TextStyle =
    variant === 'primary'
      ? { color: '#ffffff' } // white on emerald always
      : variant === 'ghost'
      ? { color: colors.textSub }
      : { color: colors.error };

  return (
    <AnimatedPressable
      id={id}
      onPress={isDisabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      // @ts-ignore
      onMouseEnter={
        Platform.OS === 'web' && variant === 'primary'
          ? () => {
              scale.value = withSpring(1.02, { damping: 12, stiffness: 200 });
            }
          : undefined
      }
      onMouseLeave={
        Platform.OS === 'web' && variant === 'primary'
          ? () => {
              scale.value = withSpring(1, { damping: 12, stiffness: 200 });
            }
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
          <Text style={[styles.label, variantText, textStyle]}>{label}</Text>
          {suffix}
        </>
      )}
    </AnimatedPressable>
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
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
