import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Button } from '../../../components/ui/Button';

interface PinnedActionBarProps {
  state: 'training_available' | 'rest_day' | 'no_plan';
  onStartWorkout?: () => void;
  onViewRecoveryPlan?: () => void;
  onLogWorkout?: () => void;
  onContactCoach?: () => void;
  isLoading?: boolean;
  style?: ViewStyle;
}

export const PinnedActionBar: React.FC<PinnedActionBarProps> = ({
  state,
  onStartWorkout,
  onViewRecoveryPlan,
  onLogWorkout,
  onContactCoach,
  isLoading = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {state === 'training_available' && onStartWorkout && (
        <Button
          title="Start Workout"
          onPress={onStartWorkout}
          variant="primary"
          size="lg"
          isLoading={isLoading}
          style={styles.fullButton}
        />
      )}

      {state === 'rest_day' && onViewRecoveryPlan && (
        <Button
          title="View Recovery Plan"
          onPress={onViewRecoveryPlan}
          variant="secondary"
          size="lg"
          style={styles.fullButton}
        />
      )}

      {state === 'no_plan' && (
        <View style={styles.dualButtonRow}>
          {onLogWorkout && (
            <Button
              title="Log Workout"
              onPress={onLogWorkout}
              variant="outline"
              size="md"
              style={styles.halfButton}
            />
          )}
          {onContactCoach && (
            <Button
              title="Contact Coach"
              onPress={onContactCoach}
              variant="primary"
              size="md"
              style={styles.halfButton}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  fullButton: {
    width: '100%',
  },
  dualButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
});

export default PinnedActionBar;
