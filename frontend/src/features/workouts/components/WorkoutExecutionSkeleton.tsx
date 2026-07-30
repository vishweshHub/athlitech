import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LoadingCard } from '../../../components/ui/LoadingCard';
import { useThemeColors, RADIUS } from '@/styles/tokens';

export const WorkoutExecutionSkeleton: React.FC = () => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerSkeleton}>
        <View style={[styles.titlePlaceholder, { backgroundColor: colors.skeletonBg }]} />
        <View style={[styles.timerPlaceholder, { backgroundColor: colors.skeletonBg }]} />
      </View>

      {/* Checklist Skeletons */}
      <View style={styles.listSkeleton}>
        <LoadingCard height={72} />
        <LoadingCard height={72} />
        <LoadingCard height={72} />
        <LoadingCard height={72} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  headerSkeleton: {
    marginBottom: 20,
  },
  titlePlaceholder: {
    height: 28,
    width: '65%',
    borderRadius: RADIUS.xs,
    marginBottom: 12,
  },
  timerPlaceholder: {
    height: 80,
    width: '100%',
    borderRadius: RADIUS.md,
  },
  listSkeleton: {
    gap: 10,
  },
});

export default WorkoutExecutionSkeleton;
