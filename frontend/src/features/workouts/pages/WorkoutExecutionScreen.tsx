import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert, Platform, Modal, BackHandler } from 'react-native';

import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionTitle } from '../../../components/ui/SectionTitle';
import { ErrorView } from '../../../components/ui/ErrorView';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useWorkoutSession } from '../../../hooks/useWorkoutSession';
import { useTodayTraining } from '../../../hooks/useTodayTraining';
import { WorkoutExecutionHeader } from '../components/WorkoutExecutionHeader';
import { WorkoutAssignmentChecklist } from '../components/WorkoutAssignmentChecklist';
import { WorkoutExecutionActionBar } from '../components/WorkoutExecutionActionBar';
import { WorkoutExecutionSkeleton } from '../components/WorkoutExecutionSkeleton';
import { getStoredToken } from '@/api/auth';
import { fetchWorkoutTemplateById, WorkoutTemplate } from '@/api/workout';
import { useThemeColors, RADIUS } from '@/styles/tokens';

interface WorkoutExecutionScreenProps {
  athleteId?: string;
  sessionId?: string;
  onNavigateToPerformanceLog?: (sessionId: string) => void;
  onClose?: () => void;
}

export const WorkoutExecutionScreen: React.FC<WorkoutExecutionScreenProps> = ({
  athleteId,
  onNavigateToPerformanceLog,
  onClose,
}) => {
  const colors = useThemeColors();
  const router = useRouter();
  const {
    activeSession,
    isLoading: isSessionLoading,
    error,
    fetchActiveSession,
    pauseSession,
    resumeSession,
    completeSession,
    cancelSession,
  } = useWorkoutSession(athleteId);

  const { todayTraining } = useTodayTraining(athleteId);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [completedAssignmentIds, setCompletedAssignmentIds] = useState<string[]>([]);
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [selfTemplate, setSelfTemplate] = useState<WorkoutTemplate | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState<boolean>(false);
  const [isCompletedSuccess, setIsCompletedSuccess] = useState<boolean>(false);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);

  // Sync elapsed duration from active session
  useEffect(() => {
    if (activeSession) {
      setElapsedSeconds(activeSession.total_duration_seconds || 0);
    }
  }, [activeSession]);

  // Live ticking timer interval when status is in_progress
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'in_progress' || isCompletedSuccess) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, isCompletedSuccess]);

  // Intercept hardware Back press (Android) and Browser Back (Web)
  useEffect(() => {
    if (!activeSession || isCompletedSuccess) return;

    if (Platform.OS === 'android') {
      const onBackPress = () => {
        setShowLeaveModal(true);
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    } else if (Platform.OS === 'web') {
      window.history.pushState({ inWorkout: true }, '', window.location.href);

      const handlePopState = () => {
        window.history.pushState({ inWorkout: true }, '', window.location.href);
        setShowLeaveModal(true);
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [activeSession, isCompletedSuccess]);

  // Load self workout template details if this is a SELF session
  useEffect(() => {
    async function loadTemplate() {
      if (activeSession?.workout_template_id) {
        setIsLoadingTemplate(true);
        try {
          const token = await getStoredToken();
          if (token) {
            const tmpl = await fetchWorkoutTemplateById(token, activeSession.workout_template_id);
            setSelfTemplate(tmpl);
          }
        } catch (err) {
          // Silent error handling
        } finally {
          setIsLoadingTemplate(false);
        }
      }
    }
    loadTemplate();
  }, [activeSession?.workout_template_id]);

  // Toggle exercise completion checklist item
  const handleToggleAssignment = (assignmentId: string) => {
    setCompletedAssignmentIds((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((id) => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  // Toggle Pause / Resume
  const handleTogglePause = async () => {
    if (!activeSession) return;
    setIsSubmittingAction(true);
    try {
      if (activeSession.status === 'paused') {
        await resumeSession(activeSession.id);
      } else {
        await pauseSession(activeSession.id);
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Back Button Navigation Trigger
  const handleBackNavigation = () => {
    setShowLeaveModal(true);
  };

  // Execute Leave Navigation without modifying lifecycle or calling cancel/complete
  const handleConfirmLeave = () => {
    setShowLeaveModal(false);
    if (onClose) {
      onClose();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/athlete-dashboard' as Href);
    }
  };

  // Execute Complete Workout
  const executeComplete = async () => {
    if (!activeSession) return;
    setIsSubmittingAction(true);
    try {
      const completed = await completeSession(activeSession.id, {
        completion_percentage: 100,
        session_notes: 'Completed session from Mobile App',
      });

      if (completed) {
        router.replace(`/performance-log?workout_session_id=${activeSession.id}` as Href);
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Complete Workout
  const handleCompleteWorkout = async () => {
    if (!activeSession) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Complete Workout\n\nAre you sure you want to complete this workout session?');
      if (confirmed) {
        await executeComplete();
      }
    } else {
      Alert.alert(
        'Complete Workout',
        'Are you sure you want to complete this workout session?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            style: 'default',
            onPress: executeComplete,
          },
        ]
      );
    }
  };

  // Execute Cancel Workout
  const executeCancel = async () => {
    if (!activeSession) return;
    setIsSubmittingAction(true);
    try {
      await cancelSession(activeSession.id);
      if (onClose) {
        onClose();
      } else {
        router.back();
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Cancel Workout
  const handleCancelWorkout = async () => {
    if (!activeSession) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Cancel Workout?\n\nYour workout session will be cancelled.\nNo performance will be recorded.');
      if (confirmed) {
        await executeCancel();
      }
    } else {
      Alert.alert(
        'Cancel Workout?',
        'Your workout session will be cancelled.\nNo performance will be recorded.',
        [
          { text: 'Continue Workout', style: 'cancel' },
          {
            text: 'Cancel Workout',
            style: 'destructive',
            onPress: executeCancel,
          },
        ]
      );
    }
  };


  // Temporary Success Screen after Completion
  if (isCompletedSuccess) {
    return (
      <ScreenContainer scrollable={false} contentContainerStyle={{ ...styles.centeredContainer, backgroundColor: colors.bg }}>
        <Card style={styles.successCard}>
          <Ionicons name="checkmark-circle-outline" size={64} color={colors.emerald} />
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Workout Completed Successfully! 🎉</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSub }]}>
            Great job! Performance Log will open here in the next sprint.
          </Text>
          <Button
            label="Back to Dashboard"
            onPress={() => {
              if (onClose) {
                onClose();
              } else {
                router.push('/athlete-dashboard' as Href);
              }
            }}
            variant="primary"
            size="md"
            style={{ marginTop: 12 }}
          />
        </Card>
      </ScreenContainer>
    );
  }

  // Loading State (Skeleton)
  if ((isSessionLoading && !activeSession) || isLoadingTemplate) {
    return (
      <ScreenContainer scrollable={false}>
        <WorkoutExecutionSkeleton />
      </ScreenContainer>
    );
  }

  // Error State with no session
  if (error && !activeSession) {
    return (
      <ScreenContainer scrollable={false}>
        <ErrorView message={error} onRetry={fetchActiveSession} />
      </ScreenContainer>
    );
  }

  const sourceType = activeSession?.source_type || (activeSession?.workout_template_id ? 'SELF' : 'PLANNED');

  // Planned Session fallback details
  const plannedSession = todayTraining?.sessions?.find(
    (s) => s.id === activeSession?.session_id
  ) || todayTraining?.sessions?.[0];

  const sessionTitle =
    sourceType === 'SELF'
      ? selfTemplate?.title || 'Self Workout'
      : plannedSession?.session_name || 'Active Workout Session';

  const estimatedDuration =
    sourceType === 'SELF'
      ? selfTemplate?.duration_minutes
      : (plannedSession as any)?.estimated_duration || 30;


  const status = activeSession?.status || 'in_progress';
  const isPaused = status === 'paused';

  return (
    <View style={[styles.screenWrapper, { backgroundColor: colors.bg }]}>
      <ScreenContainer scrollable={true} contentContainerStyle={styles.scrollContent}>
        {/* Header & Live Duration Timer */}
        <WorkoutExecutionHeader
          title={sessionTitle}
          status={status}
          totalDurationSeconds={elapsedSeconds}
          sourceType={sourceType}
          onBack={handleBackNavigation}
        />

        {sourceType === 'SELF' && selfTemplate ? (
          <View style={styles.detailsContainer}>
            {/* Template Badges */}
            <View style={styles.badgeRow}>
              <Badge label={selfTemplate.sport} variant="neutral" />
              <Badge label={selfTemplate.category} variant="info" />
              <Badge label={selfTemplate.difficulty} variant="warning" />
              <Badge label={`Est. ${estimatedDuration} mins`} variant="success" />
            </View>

            {/* Description */}
            {selfTemplate.description ? (
              <Card style={styles.detailCard}>
                <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>Description</Text>
                <Text style={[styles.cardBodyText, { color: colors.textSub }]}>{selfTemplate.description}</Text>
              </Card>
            ) : null}

            {/* Equipment Required */}
            {selfTemplate.equipment && selfTemplate.equipment.length > 0 ? (
              <Card style={styles.detailCard}>
                <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>Equipment Required</Text>
                <View style={styles.equipmentRow}>
                  {selfTemplate.equipment.map((eq, idx) => (
                    <View key={idx} style={[styles.equipmentChip, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
                      <Ionicons name="hardware-chip-outline" size={14} color={colors.info} />
                      <Text style={[styles.equipmentChipText, { color: colors.textPrimary }]}>{eq}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            {/* Instructions */}
            {selfTemplate.instructions ? (
              <Card style={styles.detailCard}>
                <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>Instructions</Text>
                <Text style={[styles.instructionsText, { color: colors.textSub }]}>{selfTemplate.instructions}</Text>
              </Card>
            ) : null}
          </View>
        ) : (
          <View style={styles.detailsContainer}>
            <View style={styles.badgeRow}>
              <Badge label={`Est. ${estimatedDuration} mins`} variant="success" />
              <Badge label="Planned Training" variant="info" />
            </View>

            {((plannedSession as any)?.description || plannedSession?.assignments?.[0]?.workout_template?.description) ? (
              <Card style={styles.detailCard}>
                <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>Description</Text>
                <Text style={[styles.cardBodyText, { color: colors.textSub }]}>
                  {(plannedSession as any)?.description || plannedSession?.assignments?.[0]?.workout_template?.description}
                </Text>
              </Card>
            ) : null}


            {/* Planned Session Checklist */}
            <SectionTitle title="Workout Assignments" subtitle="Tap exercises as you complete them" />
            <WorkoutAssignmentChecklist
              assignments={plannedSession?.assignments || []}
              completedAssignmentIds={completedAssignmentIds}
              onToggleAssignment={handleToggleAssignment}
            />
          </View>
        )}
      </ScreenContainer>

      {/* Fixed Pinned Bottom Action Bar */}
      <WorkoutExecutionActionBar
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onCompleteWorkout={handleCompleteWorkout}
        onCancelWorkout={handleCancelWorkout}
        isLoading={isSubmittingAction}
      />

      {/* Leave Workout Confirmation Modal */}
      <Modal
        visible={showLeaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={[styles.leaveModalOverlay, { backgroundColor: colors.cardShadow }]}>
          <Card style={styles.leaveModalCard}>
            <View style={styles.leaveModalHeader}>
              <Ionicons name="log-out-outline" size={26} color={colors.info} />
              <Text style={[styles.leaveModalTitle, { color: colors.textPrimary }]}>Leave Workout?</Text>
            </View>
            <Text style={[styles.leaveModalMessage, { color: colors.textSub }]}>
              Your workout will continue running in the background.{"\n\n"}You can resume it anytime from your active session.
            </Text>
            <View style={styles.leaveModalActions}>
              <Button
                label="Continue Workout"
                onPress={() => setShowLeaveModal(false)}
                variant="secondary"
                style={styles.leaveModalBtn}
              />
              <Button
                label="Leave Session"
                onPress={handleConfirmLeave}
                variant="primary"
                style={styles.leaveModalBtn}
              />
            </View>
          </Card>
        </View>
      </Modal>
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
  detailsContainer: {
    gap: 16,
    marginTop: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailCard: {
    padding: 16,
    gap: 8,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardBodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  equipmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  equipmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  equipmentChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    padding: 24,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    gap: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  leaveModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  leaveModalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: RADIUS.lg,
    padding: 24,
    gap: 16,
  },
  leaveModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leaveModalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  leaveModalMessage: {
    fontSize: 14,
    lineHeight: 22,
  },
  leaveModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  leaveModalBtn: {
    flex: 1,
  },
});

export default WorkoutExecutionScreen;
