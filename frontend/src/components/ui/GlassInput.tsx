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
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, RADIUS } from '@/styles/tokens';

interface GlassInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  /** If true, adds a password visibility toggle */
  password?: boolean;
}

export default function GlassInput({
  label,
  error,
  password = false,
  value,
  onChangeText,
  placeholder,
  ...rest
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animate border color: 0 = dim, 1 = emerald
  const focusAnim = useRef(new Animated.Value(0)).current;

  function handleFocus() {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: false, // must be false for color interpolation
    }).start();
  }

  function handleBlur() {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)',
      error ? 'rgba(239,68,68,0.8)' : COLORS.emerald,
    ],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.25],
  });

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Animated.View
        style={[
          styles.inputRow,
          {
            borderColor,
            shadowColor: error ? COLORS.error : COLORS.emerald,
            shadowOpacity,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 8,
            elevation: 0,
          },
        ]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={password && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={COLORS.emerald}
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
              color={isFocused ? COLORS.emerald : COLORS.textMuted}
            />
          </Pressable>
        )}
      </Animated.View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  label: {
    color: COLORS.textSub,
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
    color: COLORS.textPrimary,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 0,
    // Remove browser default outline on web
    outlineWidth: 0,
  } as any,
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  error: {
    color: COLORS.error,
    fontSize: 13,
    marginTop: 6,
  },
});
