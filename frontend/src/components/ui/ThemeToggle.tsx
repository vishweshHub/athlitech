import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/context/ThemeContext';
import { useThemeColors, RADIUS } from '@/styles/tokens';

interface ThemeToggleProps {
  style?: ViewStyle;
}

export default function ThemeToggle({ style }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const colors = useThemeColors();
  const rotateAnim = useRef(new Animated.Value(theme === 'dark' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: theme === 'dark' ? 0 : 1,
      duration: 350,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
  }, [theme, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const scale = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.8, 1],
  });

  return (
    <Pressable
      onPress={toggleTheme}
      style={[
        styles.button,
        {
          backgroundColor: colors.bgMid,
          borderColor: colors.border,
        },
        style,
      ]}
      hitSlop={8}
    >
      <Animated.View
        style={{
          transform: [{ rotate: rotation }, { scale: scale }],
        }}
      >
        <Ionicons
          name={theme === 'dark' ? 'moon-outline' : 'sunny-outline'}
          size={20}
          color={theme === 'dark' ? '#fbbf24' : colors.emerald}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
