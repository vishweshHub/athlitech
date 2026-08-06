import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SHADOW, useThemeColors } from '@/styles/tokens';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss?: () => void;
}

export default function Toast({ visible, message, type = 'success', onDismiss }: ToastProps) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 300 });

      const timer = setTimeout(() => {
        translateY.value = withTiming(-80, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        if (onDismiss) onDismiss();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(-80, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, message]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) return null;

  const iconName = type === 'success' ? 'checkmark-circle' : type === 'error' ? 'alert-circle' : 'information-circle';
  const iconColor = type === 'success' ? colors.emerald : type === 'error' ? colors.error : '#3B82F6';

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.toastCard}>
        <Ionicons name={iconName} size={22} color={iconColor} />
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const getStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 24,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 9999,
      pointerEvents: 'none',
    },
    toastCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.bgGlass,
      borderColor: colors.border,
      borderWidth: 1,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: RADIUS.full,
      ...SHADOW.card,
    },
    messageText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
  });
