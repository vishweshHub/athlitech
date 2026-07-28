import React from 'react';
import { StyleSheet, Text, View, RefreshControl, Alert } from 'react-native';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorView } from '../../../components/ui/ErrorView';
import { useTodayTraining } from '../../../hooks/useTodayTraining';
import { useWorkoutSession } from '../../../hooks/useWorkoutSession';
import { TrainingHeader } from '../components/TrainingHeader';
import { TrainingMetadata } from '../components/TrainingMetadata';
import { WorkoutAssignmentItem } from '../components/WorkoutAssignmentItem';
import { PinnedActionBar } from '../components/PinnedActionBar';
import { TodayTrainingSkeleton } from '../components/TodayTrainingSkeleton';
import { useThemeColors, RADIUS } from '@/styles/tokens';

interface TodayTrainingScreenProps {
  athleteId?: string;
  targetDate?: string;
  onNavigateToWorkoutSession?: (sessionId: string) => void;
  onNavigateToRecoveryPlan?: () => void;
  onNavigateToLogWorkout?: () => void;
  onNavigateToContactCoach?: () => void;
}

export const TodayTrainingScreen: React.FC<TodayTrainingScreenProps> = ({
  athleteId,
  targetDate,
  onNavigateToWorkoutSession,
  onNavigateToRecoveryPlan,
  onNavigateToLogWorkout,
  onNavigateToContactCoach,
}) => {
  const colors = useThemeColors();
  const { todayTraining, isLoading, isRefreshing, isUsingCache, error, refetch } =
    useTodayTraining(athleteId, targetDate);

  const { startSession, isLoading: isStartingSession } = useWorkoutSession(athleteId);

  // Handle Start Workout Action
  const handleStartWorkout = async () => {
    if (!todayTraining?.sessions || todayTraining.sessions.length === 0) return;

    const plannedSession = todayTraining.sessions[0];
    const session = await startSession({ session_id: plannedSession.id });

    if (session) {
      if (onNavigateToWorkoutSession) {
        onNavigateToWorkoutSession(session.id);
      } else {
        Alert.alert('Workout Started', `Session '${plannedSession.session_name}' is now active!`);
      }
    }
  };

  // State 4: Loading
  if (isLoading) {
    return (
      <ScreenContainer scrollable={false}>
        <TodayTrainingSkeleton />
      </ScreenContainer>
    );
  }

  // State 5: Error with no cache
  if (error && !todayTraining) {
    return (
      <ScreenContainer scrollable={false}>
        <ErrorView message={error} onRetry={refetch} />
      </ScreenContainer>
    );
  }

  // Determine sub-states based on todayTraining response
  const isRestDay = todayTraining?.status === 'REST_DAY' || (!todayTraining?.has_training && todayTraining?.status === 'REST_DAY');
  const hasNoPlan = !todayTraining?.has_training && !isRestDay;
  const isTrainingAvailable = Boolean(todayTraining?.has_training && todayTraining?.sessions?.length);

  const activeSession = todayTraining?.sessions[0];
  const weekNumber = todayTraining?.training_week?.week_number;
  const dayName = todayTraining?.training_day?.day_name || 'Today';
  const sessionTitle = activeSession?.session_name || 'Workout Session';
  const goalSubtitle = todayTraining?.training_plan?.goal || activeSession?.session_name;

  return (
    <View style={[styles.screenWrapper, { backgroundColor: colors.bg }]}>
      <ScreenContainer
        scrollable={true}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Warning Banner for State 5 (Error with Cache) */}
        {isUsingCache && error && (
          <View style={[styles.cacheWarningBanner, { backgroundColor: colors.warning + '20', borderColor: colors.warning + '60' }]}>
            <Text style={[styles.cacheWarningText, { color: colors.warning }]}>{error}</Text>
          </View>
        )}

        {/* State 1: Training Available */}
        {isTrainingAvailable && (
          <View style={styles.contentContainer}>
            <TrainingHeader
              weekNumber={weekNumber}
              dayName={dayName}
              title={sessionTitle}
              subtitle={goalSubtitle}
            />

            <TrainingMetadata
              duration="45–60 min"
              dayType={todayTraining?.training_day?.day_type || 'Training'}
              intensity="High Intensity"
            />

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Workout Assignments</Text>
            </View>

            <View style={styles.assignmentsList}>
              {activeSession?.assignments && activeSession.assignments.length > 0 ? (
                activeSession.assignments.map((assignment, index) => (
                  <WorkoutAssignmentItem
                    key={assignment.id || index}
                    assignment={assignment}
                  />
                ))
              ) : (
                <Text style={[styles.noAssignmentsText, { color: colors.textMuted }]}>No assignments scheduled for this session.</Text>
              )}
            </View>
          </View>
        )}

        {/* State 2: Rest Day */}
        {isRestDay && (
          <View style={styles.contentContainer}>
            <TrainingHeader
              weekNumber={weekNumber}
              dayName={dayName}
              title="Recovery Day"
              subtitle="Recovery is part of your training."
            />

            <View style={[styles.restCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.restCardTitle, { color: colors.info }]}>Rest & Regeneration</Text>
              <Text style={[styles.restCardMessage, { color: colors.textSub }]}>
                {todayTraining?.message || 'Focus on hydration, mobility, and adequate sleep to maximize adaptations for upcoming sessions.'}
              </Text>
            </View>
          </View>
        )}

        {/* State 3: No Active Plan */}
        {hasNoPlan && (
          <View style={styles.contentContainer}>
            <EmptyState
              title="No active training plan."
              description="Your coach will assign a new plan soon or you can log a manual session."
            />
          </View>
        )}
      </ScreenContainer>

      {/* Pinned Bottom CTA Bar */}
      {isTrainingAvailable && (
        <PinnedActionBar
          state="training_available"
          onStartWorkout={handleStartWorkout}
          isLoading={isStartingSession}
        />
      )}

      {isRestDay && (
        <PinnedActionBar
          state="rest_day"
          onViewRecoveryPlan={onNavigateToRecoveryPlan || (() => Alert.alert('Recovery Plan', 'Rest day recovery guidelines.'))}
        />
      )}

      {hasNoPlan && (
        <PinnedActionBar
          state="no_plan"
          onLogWorkout={onNavigateToLogWorkout || (() => Alert.alert('Log Workout', 'Manual workout log.'))}
          onContactCoach={onNavigateToContactCoach || (() => Alert.alert('Contact Coach', 'Reaching out to coach.'))}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  cacheWarningBanner: {
    borderWidth: 1,
    borderRadius: RADIUS.xs,
    padding: 10,
    marginBottom: 14,
  },
  cacheWarningText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  assignmentsList: {
    gap: 8,
  },
  noAssignmentsText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  restCard: {
    borderRadius: RADIUS.md,
    padding: 20,
    borderWidth: 1,
    marginTop: 12,
  },
  restCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  restCardMessage: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default TodayTrainingScreen;
