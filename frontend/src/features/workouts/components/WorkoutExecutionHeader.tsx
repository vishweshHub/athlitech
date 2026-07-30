import React from 'react';
import { StyleSheet, Text, View, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components/ui/Badge';
import { useThemeColors, RADIUS } from '@/styles/tokens';

interface WorkoutExecutionHeaderProps {
  title: string;
  status: string;
  totalDurationSeconds: number;
  sourceType?: 'PLANNED' | 'SELF' | string;
  onBack?: () => void;
  style?: ViewStyle;
}

export const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => String(num).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

export const WorkoutExecutionHeader: React.FC<WorkoutExecutionHeaderProps> = ({
  title,
  status,
  totalDurationSeconds,
  sourceType = 'PLANNED',
  onBack,
  style,
}) => {
  const colors = useThemeColors();
  const isPaused = status === 'paused';
  const statusLabel = isPaused ? 'PAUSED' : status === 'completed' ? 'COMPLETED' : 'IN PROGRESS';
  const statusVariant = isPaused ? 'warning' : status === 'completed' ? 'success' : 'info';

  const sourceLabel = sourceType === 'SELF' ? 'SELF WORKOUT' : 'COACH ASSIGNED';
  const sourceVariant = sourceType === 'SELF' ? 'info' : 'success';

  return (
    <View style={[styles.container, style]}>
      {/* Header Top Nav */}
      <View style={styles.topNavRow}>
        {onBack && (
          <Pressable
            style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={onBack}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>Back</Text>
          </Pressable>
        )}
        <View style={styles.badgeHeaderRow}>
          <Badge label={sourceLabel} variant={sourceVariant} />
          <Badge label={statusLabel} variant={statusVariant} />
        </View>
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>

      <View style={[styles.timerBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Text style={[styles.timerLabel, { color: colors.textMuted }]}>ELAPSED TIME</Text>
        <Text style={[styles.timerValue, { color: colors.info }, isPaused && { color: colors.warning }]}>
          {formatDuration(totalDurationSeconds)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 14,
  },
  timerBox: {
    borderRadius: RADIUS.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 36,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
});

export default WorkoutExecutionHeader;
