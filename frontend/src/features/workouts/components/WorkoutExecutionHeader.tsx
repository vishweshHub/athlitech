import React from 'react';
import { StyleSheet, Text, View, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components/ui/Badge';

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
  const isPaused = status === 'paused';
  const statusLabel = isPaused ? 'PAUSED' : status === 'completed' ? 'COMPLETED' : 'IN PROGRESS';
  const statusVariant = isPaused ? 'warning' : status === 'completed' ? 'success' : 'info';

  const sourceLabel = sourceType === 'SELF' ? 'SELF WORKOUT' : 'COACH ASSIGNED';
  const sourceVariant = sourceType === 'SELF' ? 'primary' : 'info';

  return (
    <View style={[styles.container, style]}>
      {/* Header Top Nav */}
      <View style={styles.topNavRow}>
        {onBack && (
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color="#F8FAFC" />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        )}
        <View style={styles.badgeHeaderRow}>
          <Badge label={sourceLabel} variant={sourceVariant} />
          <Badge label={statusLabel} variant={statusVariant} />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.timerBox}>
        <Text style={styles.timerLabel}>ELAPSED TIME</Text>
        <Text style={[styles.timerValue, isPaused && styles.timerPaused]}>
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
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backBtnText: {
    color: '#F8FAFC',
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
    color: '#F8FAFC',
    marginBottom: 14,
  },
  timerBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#38BDF8',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  timerPaused: {
    color: '#FACC15',
  },
});

export default WorkoutExecutionHeader;
