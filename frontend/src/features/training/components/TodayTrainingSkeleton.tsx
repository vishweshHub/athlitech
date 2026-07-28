import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LoadingCard } from '../../../components/ui/LoadingCard';

export const TodayTrainingSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerSkeleton}>
        <View style={styles.metaPlaceholder} />
        <View style={styles.titlePlaceholder} />
        <View style={styles.subtitlePlaceholder} />
      </View>

      {/* Metadata Row Skeleton */}
      <View style={styles.badgeRowSkeleton}>
        <View style={styles.badgePlaceholder} />
        <View style={styles.badgePlaceholder} />
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
    backgroundColor: '#1E293B',
    borderRadius: 4,
    marginBottom: 8,
  },
  titlePlaceholder: {
    height: 28,
    width: '75%',
    backgroundColor: '#1E293B',
    borderRadius: 6,
    marginBottom: 8,
  },
  subtitlePlaceholder: {
    height: 16,
    width: '50%',
    backgroundColor: '#1E293B',
    borderRadius: 4,
  },
  badgeRowSkeleton: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  badgePlaceholder: {
    height: 24,
    width: 90,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  listSkeleton: {
    gap: 8,
  },
});

export default TodayTrainingSkeleton;
