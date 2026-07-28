import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { useThemeColors, RADIUS } from '@/styles/tokens';

export const MyWorkoutsSkeleton: React.FC = () => {
  const colors = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      {[1, 2, 3].map((key) => (
        <Card key={key} style={styles.card}>
          <Animated.View style={[styles.headerBadge, { backgroundColor: colors.skeletonBg, opacity: fadeAnim }]} />
          <Animated.View style={[styles.titleLine, { backgroundColor: colors.skeletonBg, opacity: fadeAnim }]} />
          <Animated.View style={[styles.metaLine, { backgroundColor: colors.skeletonBg, opacity: fadeAnim }]} />
          <Animated.View style={[styles.descLine, { backgroundColor: colors.skeletonBg, opacity: fadeAnim }]} />
          <Animated.View style={[styles.buttonLine, { backgroundColor: colors.skeletonBg, opacity: fadeAnim }]} />
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingVertical: 12,
  },
  card: {
    padding: 16,
    borderRadius: RADIUS.md,
    gap: 12,
  },
  headerBadge: {
    width: 90,
    height: 22,
    borderRadius: RADIUS.xs,
  },
  titleLine: {
    width: '65%',
    height: 20,
    borderRadius: RADIUS.xs,
  },
  metaLine: {
    width: '40%',
    height: 14,
    borderRadius: RADIUS.xs,
  },
  descLine: {
    width: '90%',
    height: 14,
    borderRadius: RADIUS.xs,
  },
  buttonLine: {
    width: '100%',
    height: 38,
    borderRadius: RADIUS.xs,
    marginTop: 8,
  },
});
