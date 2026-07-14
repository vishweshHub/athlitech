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

import { useThemeColors, RADIUS } from '@/styles/tokens';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  /** If true, adds a password visibility toggle */
  password?: boolean;
}

export default function Input({
  label,
  error,
  password = false,
  value,
  onChangeText,
  placeholder,
  ...rest
}: InputProps) {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animate border color: 0 = unfocused, 1 = focused
  const focusAnim = useRef(new Animated.Value(0)).current;

  function handleFocus() {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false, // must be false for color interpolation
    }).start();
  }

  function handleBlur() {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? colors.error : colors.inputBorder,
      error ? colors.error : colors.emerald,
    ],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.25],
  });

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: colors.textSub }]}>{label}</Text>}

      <Animated.View
        style={[
          styles.inputRow,
          {
            borderColor,
            backgroundColor: colors.inputBg,
            shadowColor: error ? colors.error : colors.emerald,
            shadowOpacity,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 8,
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
    outlineWidth: 0, // for web
  } as any,
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  error: {
    fontSize: 13,
    marginTop: 6,
  },
});
