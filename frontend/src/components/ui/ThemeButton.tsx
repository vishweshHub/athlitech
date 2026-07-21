import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, Animated, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { RADIUS, SPACING } from '@/theme/spacing';
import { TYPOGRAPHY } from '@/theme/typography';

interface ThemeButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
}

export default function ThemeButton({ 
  title, 
  onPress, 
  variant = 'primary', 
  style,
  loading = false,
  disabled = false
}: ThemeButtonProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.neutral;
    if (variant === 'primary') return colors.emerald;
    if (variant === 'secondary') return colors.bgMid;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return colors.neutralText;
    if (variant === 'primary') return '#ffffff';
    return colors.textPrimary;
  };

  const getBorderColor = () => {
    if (variant === 'outline') return colors.border;
    if (variant === 'secondary') return colors.borderSubtle;
    return 'transparent';
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} />
        ) : (
          <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
