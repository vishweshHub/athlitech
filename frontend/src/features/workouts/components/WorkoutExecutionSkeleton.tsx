import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LoadingCard } from '../../../components/ui/LoadingCard';

export const WorkoutExecutionSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerSkeleton}>
        <View style={styles.titlePlaceholder} />
        <View style={styles.timerPlaceholder} />
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
    backgroundColor: '#1E293B',
    borderRadius: 6,
    marginBottom: 12,
  },
  timerPlaceholder: {
    height: 80,
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 14,
  },
  listSkeleton: {
    gap: 10,
  },
});

export default WorkoutExecutionSkeleton;
