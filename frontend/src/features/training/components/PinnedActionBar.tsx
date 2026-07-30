import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { useThemeColors } from '@/styles/tokens';

interface PinnedActionBarProps {
  state?: 'training_available' | 'rest_day' | 'no_plan';
  hasStartedSession?: boolean;
  onStartSession?: () => void;
  onResumeSession?: () => void;
  onViewWorkouts?: () => void;
  onStartWorkout?: () => void;
  onViewRecoveryPlan?: () => void;
  onLogWorkout?: () => void;
  onContactCoach?: () => void;
  isLoading?: boolean;
  style?: ViewStyle;
}

export const PinnedActionBar: React.FC<PinnedActionBarProps> = ({
  state = 'training_available',
  hasStartedSession = false,
  onStartSession,
  onResumeSession,
  onViewWorkouts,
  onStartWorkout,
  onViewRecoveryPlan,
  onLogWorkout,
  onContactCoach,
  isLoading = false,
  style,
}) => {
  const colors = useThemeColors();

  const handlePrimary = hasStartedSession ? onResumeSession : (onStartSession || onStartWorkout);
  const primaryLabel = hasStartedSession ? 'Resume Workout Session' : 'Start Workout Session';

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCard, borderTopColor: colors.border }, style]}>
      {handlePrimary ? (
        <Button
          label={primaryLabel}
          onPress={handlePrimary}
          variant="primary"
          size="lg"
          isLoading={isLoading}
          style={styles.fullButton}
        />
      ) : onViewWorkouts ? (
        <Button
          label="View Workouts Library"
          onPress={onViewWorkouts}
          variant="secondary"
          size="lg"
          style={styles.fullButton}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
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
