import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorView } from '../../../components/ui/ErrorView';
import { useTodayTraining } from '../../../hooks/useTodayTraining';
import { TodayTrainingSkeleton } from './TodayTrainingSkeleton';
import { useThemeColors, RADIUS, SPACING } from '@/styles/tokens';

interface TodayTrainingSectionProps {
  athleteId?: string;
  hasCoach?: boolean;
  targetDate?: string;
  session?: any;
  style?: ViewStyle;
}

export const TodayTrainingSection: React.FC<TodayTrainingSectionProps> = ({
  athleteId,
  hasCoach = true,
  targetDate,
  session: propSession,
  style,
}) => {
  const colors = useThemeColors();

  // BUSINESS RULE: Today's Training is a coach-managed feature.
  // If the athlete has NO coach assigned, do NOT render Today's Training at all.
  if (hasCoach === false) {
    return null;
  }

  const { todayTraining, isLoading, error, isUsingCache, refetch } =
    useTodayTraining(athleteId, targetDate);

  const activeSession = propSession || todayTraining?.sessions?.[0];

  // State 1: Loading
  if (isLoading && !propSession) {
    return (
      <Card style={[styles.sectionCard, style]} variant="elevated">
        <TodayTrainingSkeleton />
      </Card>
    );
  }

  // State 2: Error with no cache
  if (error && !todayTraining && !propSession) {
    return (
      <Card style={[styles.sectionCard, style]} variant="elevated">
        <ErrorView message={error} onRetry={refetch} />
      </Card>
    );
  }

  const isTrainingAvailable = Boolean(
    propSession || (todayTraining?.has_training && todayTraining?.sessions?.length)
  );

  const firstAssignment = activeSession?.assignments?.[0];
  const template = firstAssignment?.workout_template;

  const workoutTitle = template?.title || activeSession?.session_name || 'Assigned Workout';
  const sportName = template?.sport || 'General Fitness';
  const durationStr = template?.duration_minutes ? `${template.duration_minutes} mins` : '45 mins';
  const exerciseCount =
    firstAssignment?.overrides?.exercises?.length ||
    (template?.equipment?.length ? template.equipment.length : 0) ||
    (activeSession?.assignments ? activeSession.assignments.length : 1);

  const difficultyLabel = template?.difficulty || 'Intermediate';
  const assignedDate = targetDate || todayTraining?.training_day?.date;
  const currentStatus = (firstAssignment?.overrides?.status || 'Scheduled').toUpperCase();

  const getDifficultyVariant = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'success';
      case 'Intermediate':
        return 'warning';
      case 'Advanced':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'ACTIVE':
      case 'IN_PROGRESS':
        return 'primary';
      case 'SKIPPED':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Card style={[styles.sectionCard, style]} variant="elevated">
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Today's Training</Text>
      </View>

      {/* Warning Banner for Error with Cache */}
      {isUsingCache && error && (
        <View
          style={[
            styles.cacheWarningBanner,
            { backgroundColor: colors.warning + '20', borderColor: colors.warning + '60' },
          ]}
        >
          <Text style={[styles.cacheWarningText, { color: colors.warning }]}>{error}</Text>
        </View>
      )}

      {/* INFORMATIONAL REMINDER WIDGET (No Action Buttons / Execution Triggers) */}
      {isTrainingAvailable ? (
        <View style={styles.contentBox}>
          {/* Scheduled Reminder Banner */}
          <View style={[styles.reminderBanner, { backgroundColor: colors.infoDim, borderColor: colors.info + '40' }]}>
            <Text style={[styles.reminderTitle, { color: colors.info }]}>You have a workout scheduled today.</Text>
            <Text style={[styles.reminderSub, { color: colors.textSub }]}>Complete it from Assigned Workouts.</Text>
          </View>

          {/* Badges: Sport, Difficulty, Current Status */}
          <View style={styles.badgeRow}>
            <Badge label={sportName} variant="neutral" />
            <Badge label={difficultyLabel} variant={getDifficultyVariant(difficultyLabel)} />
            <Badge label={currentStatus} variant={getStatusVariant(currentStatus)} />
          </View>

          {/* Workout Title */}
          <Text style={[styles.workoutTitle, { color: colors.textPrimary }]}>{workoutTitle}</Text>

          {/* Metadata Row: Duration, Exercise Count, Assigned Date */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaIcon, { color: colors.emerald }]}>⏱</Text>
              <Text style={[styles.metaText, { color: colors.textSub }]}>{durationStr}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={[styles.metaIcon, { color: colors.info }]}>🏋️</Text>
              <Text style={[styles.metaText, { color: colors.textSub }]}>
                {exerciseCount} {exerciseCount === 1 ? 'Exercise' : 'Exercises'}
              </Text>
            </View>

            {assignedDate ? (
              <View style={styles.metaItem}>
                <Text style={[styles.metaIcon, { color: colors.textMuted }]}>📅</Text>
                <Text style={[styles.metaText, { color: colors.textSub }]}>{assignedDate}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        /* Empty State: No Workouts Assigned */
        <View style={styles.contentBox}>
          <EmptyState
            title="No workouts assigned yet."
            description="Your coach hasn't assigned any workouts for you yet."
          />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    marginBottom: 24,
    padding: SPACING.md,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cacheWarningBanner: {
    borderWidth: 1,
    borderRadius: RADIUS.xs,
    padding: 10,
    marginBottom: 12,
  },
  cacheWarningText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  contentBox: {
    gap: 10,
  },
  reminderBanner: {
    borderRadius: RADIUS.sm,
    padding: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  reminderSub: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default TodayTrainingSection;
