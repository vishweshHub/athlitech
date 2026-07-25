/**
 * GlassInput
 *
 * A dark-themed TextInput with an animated focus ring.
 * The border smoothly transitions from dim → emerald on focus.
 *
 * Usage:
 *   <GlassInput
 *     label="Email"
 *     value={email}
 *     onChangeText={setEmail}
 *     placeholder="you@example.com"
 *     keyboardType="email-address"
 *   />
 */

import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { RADIUS, useThemeColors } from '@/styles/tokens';

interface GlassInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  /** If true, adds a password visibility toggle */
  password?: boolean;
  containerStyle?: any;
}

export default function GlassInput({
  label,
  error,
  password = false,
  value,
  onChangeText,
  placeholder,
  containerStyle,
  ...rest
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const colors = useThemeColors();

  const isFocusedValue = useSharedValue(0);

  function handleFocus() {
    setIsFocused(true);
    isFocusedValue.value = withTiming(1, { duration: 220 });
  }

  function handleBlur() {
    setIsFocused(false);
    isFocusedValue.value = withTiming(0, { duration: 220 });
  }

  const animatedStyle = useAnimatedStyle(() => {
    let borderColor, shadowColor, shadowOpacity;
    
    if (error) {
      borderColor = isFocusedValue.value === 1 ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.4)';
      shadowColor = colors.error;
      shadowOpacity = isFocusedValue.value === 1 ? 0.45 : 0;
    } else {
      // interpolate doesn't work with string colors in reanimated out of the box unless specified,
      // but since we are just doing focus on/off, we can just switch the color using withTiming
      borderColor = isFocusedValue.value === 1 ? colors.emerald : (colors.border || 'rgba(255,255,255,0.1)');
      shadowColor = colors.emerald;
      shadowOpacity = isFocusedValue.value === 1 ? 0.45 : 0;
    }

    return {
      borderColor: withTiming(borderColor, { duration: 220 }),
      backgroundColor: withTiming(colors.inputBg || 'rgba(255,255,255,0.04)', { duration: 400 }),
      shadowColor: withTiming(shadowColor, { duration: 220 }),
      shadowOpacity: withTiming(shadowOpacity, { duration: 220 }),
    };
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textSub }]}>{label}</Text>}

      <Animated.View
        style={[
          styles.inputRow,
          animatedStyle,
          {
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 12,
            elevation: 0,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={password && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={colors.emerald}
          {...rest}
        />

        {password && (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.toggle}
            hitSlop={8}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={isFocused ? colors.emerald : colors.textMuted}
            />
          </Pressable>
        )}
      </Animated.View>

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    minHeight: 52,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 0,
    // Remove browser default outline on web
    outlineWidth: 0,
    outlineStyle: 'none',
  } as any,
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  error: {
    fontSize: 13,
    marginTop: 6,
    width: '100%',
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
});
