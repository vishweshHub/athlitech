import React from 'react';
import { StyleSheet, Text, View, Alert, ViewStyle } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorView } from '../../../components/ui/ErrorView';
import { useTodayTraining } from '../../../hooks/useTodayTraining';
import { useWorkoutSession } from '../../../hooks/useWorkoutSession';
import { TrainingHeader } from './TrainingHeader';
import { TrainingMetadata } from './TrainingMetadata';
import { WorkoutAssignmentItem } from './WorkoutAssignmentItem';
import { TodayTrainingSkeleton } from './TodayTrainingSkeleton';

interface TodayTrainingSectionProps {
  athleteId?: string;
  targetDate?: string;
  onNavigateToWorkoutSession?: (sessionId: string) => void;
  onNavigateToRecoveryPlan?: () => void;
  onNavigateToLogWorkout?: () => void;
  onNavigateToContactCoach?: () => void;
  style?: ViewStyle;
}

export const TodayTrainingSection: React.FC<TodayTrainingSectionProps> = ({
  athleteId,
  targetDate,
  onNavigateToWorkoutSession,
  onNavigateToRecoveryPlan,
  onNavigateToLogWorkout,
  onNavigateToContactCoach,
  style,
}) => {
  const { todayTraining, isLoading, error, isUsingCache, refetch } =
    useTodayTraining(athleteId, targetDate);

  const { startSession, isLoading: isStartingSession } = useWorkoutSession(athleteId);

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
      <Card style={[styles.sectionCard, style]} variant="elevated">
        <TodayTrainingSkeleton />
      </Card>
    );
  }

  // State 5: Error with no cache
  if (error && !todayTraining) {
    return (
      <Card style={[styles.sectionCard, style]} variant="elevated">
        <ErrorView message={error} onRetry={refetch} />
      </Card>
    );
  }

  const isRestDay =
    todayTraining?.status === 'REST_DAY' ||
    (!todayTraining?.has_training && todayTraining?.status === 'REST_DAY');
  const hasNoPlan = !todayTraining?.has_training && !isRestDay;
  const isTrainingAvailable = Boolean(todayTraining?.has_training && todayTraining?.sessions?.length);

  const activeSession = todayTraining?.sessions[0];
  const weekNumber = todayTraining?.training_week?.week_number;
  const dayName = todayTraining?.training_day?.day_name || 'Today';
  const sessionTitle = activeSession?.session_name || 'Workout Session';
  const goalSubtitle = todayTraining?.training_plan?.goal || activeSession?.session_name;

  return (
    <Card style={[styles.sectionCard, style]} variant="elevated">
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Today's Training</Text>
      </View>

      {/* Warning Banner for State 5 (Error with Cache) */}
      {isUsingCache && error && (
        <View style={styles.cacheWarningBanner}>
          <Text style={styles.cacheWarningText}>{error}</Text>
        </View>
      )}

      {/* State 1: Training Available */}
      {isTrainingAvailable && (
        <View style={styles.contentBox}>
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

          <Text style={styles.subHeading}>Workout Assignments</Text>
          <View style={styles.assignmentsList}>
            {activeSession?.assignments && activeSession.assignments.length > 0 ? (
              activeSession.assignments.map((assignment, index) => (
                <WorkoutAssignmentItem
                  key={assignment.id || index}
                  assignment={assignment}
                />
              ))
            ) : (
              <Text style={styles.noAssignmentsText}>No assignments scheduled for this session.</Text>
            )}
          </View>

          <Button
            title="Start Workout"
            onPress={handleStartWorkout}
            variant="primary"
            size="lg"
            isLoading={isStartingSession}
            style={styles.actionBtn}
          />
        </View>
      )}

      {/* State 2: Rest Day */}
      {isRestDay && (
        <View style={styles.contentBox}>
          <TrainingHeader
            weekNumber={weekNumber}
            dayName={dayName}
            title="Recovery Day"
            subtitle="Recovery is part of your training."
          />

          <View style={styles.restCard}>
            <Text style={styles.restCardTitle}>Rest & Regeneration</Text>
            <Text style={styles.restCardMessage}>
              {todayTraining?.message ||
                'Focus on hydration, mobility, and adequate sleep to maximize adaptations for upcoming sessions.'}
            </Text>
          </View>

          <Button
            title="View Recovery Plan"
            onPress={onNavigateToRecoveryPlan || (() => Alert.alert('Recovery Plan', 'Rest day recovery guidelines.'))}
            variant="secondary"
            size="md"
            style={styles.actionBtn}
          />
        </View>
      )}

      {/* State 3: No Active Plan */}
      {hasNoPlan && (
        <View style={styles.contentBox}>
          <EmptyState
            title="No active training plan."
            description="Your coach will assign a new plan soon or you can log a manual session."
          />
          <View style={styles.dualBtnRow}>
            <Button
              title="Log Workout"
              onPress={onNavigateToLogWorkout || (() => Alert.alert('Log Workout', 'Manual workout log.'))}
              variant="outline"
              size="md"
              style={styles.halfBtn}
            />
            <Button
              title="Contact Coach"
              onPress={onNavigateToContactCoach || (() => Alert.alert('Contact Coach', 'Reaching out to coach.'))}
              variant="primary"
              size="md"
              style={styles.halfBtn}
            />
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    marginBottom: 24,
    padding: 18,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  cacheWarningBanner: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  cacheWarningText: {
    fontSize: 13,
    color: '#FACC15',
    textAlign: 'center',
    fontWeight: '600',
  },
  contentBox: {
    gap: 8,
  },
  subHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 10,
    marginBottom: 4,
  },
  assignmentsList: {
    gap: 8,
    marginBottom: 12,
  },
  noAssignmentsText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  restCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 10,
  },
  restCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 6,
  },
  restCardMessage: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 12,
    width: '100%',
  },
  dualBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  halfBtn: {
    flex: 1,
  },
});

export default TodayTrainingSection;
