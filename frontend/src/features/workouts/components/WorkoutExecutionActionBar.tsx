import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Button } from '../../../components/ui/Button';

interface WorkoutExecutionActionBarProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onCompleteWorkout: () => void;
  onCancelWorkout: () => void;
  isLoading?: boolean;
  style?: ViewStyle;
}

export const WorkoutExecutionActionBar: React.FC<WorkoutExecutionActionBarProps> = ({
  isPaused,
  onTogglePause,
  onCompleteWorkout,
  onCancelWorkout,
  isLoading = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Button
        label="Complete Workout"
        onPress={onCompleteWorkout}
        variant="primary"
        size="md"
        isLoading={isLoading}
        style={styles.equalBtn}
      />
      <Button
        label={isPaused ? 'Resume' : 'Pause'}
        onPress={onTogglePause}
        variant={isPaused ? 'primary' : 'secondary'}
        size="md"
        isLoading={isLoading}
        style={styles.equalBtn}
      />
      <Button
        label="Cancel Workout"
        onPress={onCancelWorkout}
        variant="danger"
        size="md"
        isLoading={isLoading}
        style={styles.equalBtn}
      />

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  equalBtn: {
    flex: 1,
  },
});

export default WorkoutExecutionActionBar;
