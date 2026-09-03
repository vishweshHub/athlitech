import React from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { useThemeColors } from '@/styles/tokens';

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
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  if (isMobile) {
    return (
      <View style={[styles.mobileContainer, { backgroundColor: colors.bgCard, borderTopColor: colors.border }, style]}>
        <Button
          label="Complete Workout"
          onPress={onCompleteWorkout}
          variant="primary"
          size="md"
          isLoading={isLoading}
          style={styles.fullBtn}
        />
        <View style={styles.secondaryRow}>
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
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCard, borderTopColor: colors.border }, style]}>
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
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mobileContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'column',
    gap: 10,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fullBtn: {
    width: '100%',
  },
  equalBtn: {
    flex: 1,
  },
});

export default WorkoutExecutionActionBar;
