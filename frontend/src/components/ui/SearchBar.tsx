import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors, RADIUS } from '@/styles/tokens';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
}: SearchBarProps) {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);

  // Border and glow animation
  const focusAnim = useRef(new Animated.Value(0)).current;

  function handleFocus() {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
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
    outputRange: [colors.inputBorder, colors.emerald],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.25],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor,
          backgroundColor: colors.inputBg,
          shadowColor: colors.emerald,
          shadowOpacity,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 8,
          elevation: 0,
        },
        style,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={18}
        color={isFocused ? colors.emerald : colors.textMuted}
        style={styles.searchIcon}
      />

      <TextInput
        style={[styles.input, { color: colors.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        selectionColor={colors.emerald}
      />

      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          style={styles.clearButton}
          hitSlop={8}
        >
          <Ionicons
            name="close-circle-outline"
            size={18}
            color={colors.textMuted}
          />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.full,
    height: 44,
    paddingHorizontal: 14,
    width: '100%',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    padding: 0,
    outlineWidth: 0, // for web
  } as any,
  clearButton: {
    marginLeft: 6,
    padding: 4,
  },
});
