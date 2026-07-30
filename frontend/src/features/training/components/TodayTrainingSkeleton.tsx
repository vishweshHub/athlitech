import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LoadingCard } from '../../../components/ui/LoadingCard';
import { useThemeColors, RADIUS } from '@/styles/tokens';

export const TodayTrainingSkeleton: React.FC = () => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerSkeleton}>
        <View style={[styles.metaPlaceholder, { backgroundColor: colors.skeletonBg }]} />
        <View style={[styles.titlePlaceholder, { backgroundColor: colors.skeletonBg }]} />
        <View style={[styles.subtitlePlaceholder, { backgroundColor: colors.skeletonBg }]} />
      </View>

      {/* Metadata Row Skeleton */}
      <View style={styles.badgeRowSkeleton}>
        <View style={[styles.badgePlaceholder, { backgroundColor: colors.skeletonBg }]} />
        <View style={[styles.badgePlaceholder, { backgroundColor: colors.skeletonBg }]} />
      </View>

      {/* Workout Items List Skeletons */}
      <View style={styles.listSkeleton}>
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
    marginBottom: 16,
  },
  metaPlaceholder: {
    height: 14,
    width: '35%',
    borderRadius: RADIUS.xs,
    marginBottom: 8,
  },
  titlePlaceholder: {
    height: 28,
    width: '75%',
    borderRadius: RADIUS.xs,
    marginBottom: 8,
  },
  subtitlePlaceholder: {
    height: 16,
    width: '50%',
    borderRadius: RADIUS.xs,
  },
  badgeRowSkeleton: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  badgePlaceholder: {
    height: 24,
    width: 90,
    borderRadius: RADIUS.xs,
  },
  listSkeleton: {
    gap: 8,
  },
});

export default TodayTrainingSkeleton;
