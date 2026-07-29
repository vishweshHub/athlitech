import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, RADIUS } from '@/styles/tokens';

interface WorkoutSuccessModalProps {
  visible: boolean;
  onComplete: () => void;
  autoCloseMs?: number;
}

export const WorkoutSuccessModal: React.FC<WorkoutSuccessModalProps> = ({
  visible,
  onComplete,
  autoCloseMs = 3500,
}) => {
  const colors = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!visible) return;

    // Reset animation values
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.85);

    // Fade in + Scale up spring animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto close timer
    const closeTimer = setTimeout(() => {
      // Fade out + subtle scale down
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete();
      });
    }, autoCloseMs);

    return () => {
      clearTimeout(closeTimer);
    };
  }, [visible, autoCloseMs, onComplete, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]}>
        <Animated.View
          style={[
            styles.cardContainer,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.borderEmerald || colors.emerald,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Animated Celebration Icon Header */}
          <View style={[styles.iconCircle, { backgroundColor: colors.emeraldDim || 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="sparkles" size={38} color={colors.emerald} />
          </View>

          {/* Title with Emoji */}
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            🎉 Workout Completed!
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.emerald }]}>
            Great job!
          </Text>

          {/* Message */}
          <Text style={[styles.bodyText, { color: colors.textSub }]}>
            Your workout has been successfully saved.
          </Text>

          {/* Encouragement Footer */}
          <View style={[styles.footerPill, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
            <Ionicons name="flame" size={16} color={colors.warning} />
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Keep building consistency.
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    gap: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: -4,
  },
  bodyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default WorkoutSuccessModal;
