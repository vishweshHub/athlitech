import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href, useLocalSearchParams } from 'expo-router';

import { ScreenContainer, Card, Button, Badge, Loading } from '@/components/ui';
import { useThemeColors, RADIUS } from '@/styles/tokens';
import { getStoredToken } from '@/api/auth';
import { workoutService } from '@/services/workout/workoutService';
import { fetchWorkoutTemplateById } from '@/api/workout';
import { createPerformanceLog, PerformanceLogPayload } from '@/api/performance';

export default function PerformanceLogScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ workout_session_id?: string }>();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const workoutSessionId = params.workout_session_id;

  const [token, setToken] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Session metadata
  const [workoutName, setWorkoutName] = useState<string>('Self Workout Session');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [sourceType, setSourceType] = useState<string>('SELF');
  const [completedAtFormatted, setCompletedAtFormatted] = useState<string>('Just now');
  const [workoutTemplateId, setWorkoutTemplateId] = useState<string | undefined>(undefined);

  // Form states
  const [perceivedEffort, setPerceivedEffort] = useState<number>(5); // 1-10
  const [completionRating, setCompletionRating] = useState<number>(5); // 1-5
  const [notes, setNotes] = useState<string>('');

  const [assignmentId, setAssignmentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function loadData() {
      try {
        const storedToken = await getStoredToken();
        if (!storedToken) {
          router.replace('/login');
          return;
        }
        setToken(storedToken);

        if (workoutSessionId) {
          const session = await workoutService.getWorkoutSessionById(workoutSessionId).catch(() =>
            workoutService.getActiveWorkoutSession().catch(() => null)
          );
          if (session) {
            let name = (session as any).workout_name || (session as any).title;
            const templateId = (session as any).workout_template_id;
            const assignId = (session as any).assignment_id;
            if (!name && templateId) {
              const tmpl = await fetchWorkoutTemplateById(storedToken, templateId).catch(() => null);
              if (tmpl) {
                name = tmpl.title;
              }
            }
            setWorkoutName(name || 'Self Workout Session');
            setSourceType('manual');
            const elapsed = (session as any).elapsed_seconds || 0;
            const derivedMins = elapsed > 0 ? Math.max(1, Math.round(elapsed / 60)) : 30;
            setDurationMinutes(derivedMins);
            if (templateId) {
              setWorkoutTemplateId(templateId);
            }
            if (assignId) {
              setAssignmentId(assignId);
            }
          }
        }
        setCompletedAtFormatted(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load session details');
      } finally {
        setIsLoadingSession(false);
      }
    }
    loadData();
  }, [workoutSessionId]);

  const handleSubmit = async (isSkip: boolean = false) => {
    if (!workoutSessionId || !workoutSessionId.trim()) {
      setErrorMessage('• workout_session_id is missing.');
      return;
    }
    if (!token || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const effortVal = isSkip ? 5 : Math.min(10, Math.max(1, Math.round(perceivedEffort || 5)));
    const ratingVal = isSkip ? 5 : Math.min(5, Math.max(1, Math.round(completionRating || 5)));
    const noteText = isSkip ? undefined : (notes.trim() || undefined);

    const payload: PerformanceLogPayload = {
      workout_session_id: workoutSessionId.trim(),
      workout_template_id: workoutTemplateId || undefined,
      assignment_id: assignmentId || undefined,
      activity_label: workoutName || 'Workout Session',
      workout_name: workoutName || 'Workout Session',
      source_type: 'manual',
      duration_minutes: Math.max(0, Math.round(durationMinutes || 0)),
      perceived_effort: effortVal,
      completion_rating: ratingVal,
      notes: noteText,
      metrics: {
        perceived_effort: effortVal,
        completion_rating: ratingVal,
        duration_minutes: Math.max(0, Math.round(durationMinutes || 0)),
        ...(noteText ? { notes: noteText } : {}),
      },
    };

    try {
      await createPerformanceLog(token, payload);
      setShowSuccess(true);
      setTimeout(() => {
        router.replace('/performance' as Href);
      }, 500);
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        setShowSuccess(true);
        setTimeout(() => {
          router.replace('/performance' as Href);
        }, 400);
      } else {
        setErrorMessage(err.message || 'Failed to save performance log');
        setIsSubmitting(false);
      }
    }
  };

  if (isLoadingSession) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.centerBox}>
          <Loading size="large" message="Preparing performance log..." />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.scrollContent}>
      <View style={styles.shell}>
        
        {/* ── TOP BAR WITH BACK BUTTON ── */}
        <View style={styles.topNavigationRow}>
          <Button
            label="Back to Dashboard"
            onPress={() => router.push('/athlete-dashboard' as Href)}
            variant="secondary"
            size="sm"
            prefix={<Ionicons name="arrow-back-outline" size={16} color={colors.textPrimary} style={{ marginRight: 6 }} />}
          />
        </View>

        {/* ── HEADER TITLE ── */}
        <View style={styles.header}>
          <View style={[styles.headerIconBox, { backgroundColor: colors.emeraldDim }]}>
            <Ionicons name="trophy-outline" size={26} color={colors.emerald} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Workout Complete!</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>Log your performance effort and feedback</Text>
          </View>
        </View>

        {showSuccess ? (
          <View style={[styles.successBanner, { backgroundColor: colors.emeraldDim, borderColor: colors.emerald }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.emerald} />
            <Text style={[styles.successText, { color: colors.emerald }]}>
              Performance Log saved successfully! Redirecting...
            </Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={[styles.errorBox, { backgroundColor: colors.errorDim, borderColor: colors.error }]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* ── RESPONSIVE GRID CONTAINER ── */}
        <View style={[styles.gridRow, isDesktop || isTablet ? styles.gridDesktop : styles.gridMobile]}>
          
          {/* ── 1. WORKOUT SUMMARY CARD ── */}
          <Card style={[styles.card, isDesktop || isTablet ? styles.colSummary : styles.colFull]}>
            <Text style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}>Workout Summary</Text>
            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.summaryList}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>WORKOUT NAME</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                  {workoutName}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>DURATION</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time-outline" size={16} color={colors.info} />
                  <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                    {durationMinutes} mins
                  </Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>COMPLETED AT</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                  {completedAtFormatted}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>SOURCE</Text>
                <View style={{ alignItems: 'flex-start' }}>
                  <Badge
                    label={sourceType === 'SELF' ? 'Self Workout' : 'Coach Plan'}
                    variant={sourceType === 'SELF' ? 'info' : 'success'}
                  />
                </View>
              </View>
            </View>
          </Card>

          {/* ── 2. PERFORMANCE FORM CARD ── */}
          <Card style={[styles.card, isDesktop || isTablet ? styles.colForm : styles.colFull]}>
            <Text style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}>Performance Feedback</Text>
            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

            {/* Effort Rating (1 - 10) */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="speedometer-outline" size={20} color={colors.info} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Perceived Effort (RPE)</Text>
                <Badge label={`${perceivedEffort} / 10`} variant="info" />
              </View>
              <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                Rate how demanding this session felt physically (1 = Minimal, 10 = Maximum Effort)
              </Text>

              <View style={styles.effortPillGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isSelected = perceivedEffort === num;
                  return (
                    <Pressable
                      key={num}
                      onPress={() => setPerceivedEffort(num)}
                      disabled={isSubmitting}
                      style={[
                        styles.effortPill,
                        {
                          backgroundColor: isSelected ? colors.info : colors.bgMid,
                          borderColor: isSelected ? colors.info : colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.effortPillText,
                          { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                        ]}
                      >
                        {num}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

            {/* Completion Rating (1 - 5 Stars) */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="star-outline" size={20} color={colors.warning} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Session Rating</Text>
                <Badge label={`${completionRating} / 5 Stars`} variant="warning" />
              </View>
              <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                How satisfied are you with your performance in this session?
              </Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= completionRating;
                  return (
                    <Pressable
                      key={star}
                      onPress={() => setCompletionRating(star)}
                      disabled={isSubmitting}
                      style={styles.starBtn}
                    >
                      <Ionicons
                        name={filled ? 'star' : 'star-outline'}
                        size={32}
                        color={filled ? colors.warning : colors.textMuted}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

            {/* Notes (Optional Multiline) */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="document-text-outline" size={20} color={colors.emerald} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Session Notes (Optional)</Text>
              </View>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                editable={!isSubmitting}
                placeholder="Add notes about form, fatigue, weather, or coach feedback..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* ── ACTION BUTTONS ── */}
            <View style={styles.actionsRow}>
              <Button
                label="Skip"
                onPress={() => handleSubmit(true)}
                variant="secondary"
                size="lg"
                disabled={isSubmitting}
                style={styles.actionBtn}
              />
              <Button
                label={isSubmitting ? 'Saving...' : 'Save Performance'}
                onPress={() => handleSubmit(false)}
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                style={styles.actionBtn}
              />
            </View>

          </Card>

        </View>

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexGrow: 1,
    width: '100%',
  },
  shell: {
    width: '100%',
    gap: 20,
  },
  topNavigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconBox: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  successText: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gridRow: {
    width: '100%',
  },
  gridDesktop: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  gridMobile: {
    flexDirection: 'column',
    gap: 20,
  },
  colSummary: {
    width: '35%',
    minWidth: 280,
  },
  colForm: {
    flex: 1,
    minWidth: 320,
  },
  colFull: {
    width: '100%',
  },
  card: {
    padding: 24,
    borderRadius: RADIUS.lg,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  summaryList: {
    gap: 16,
  },
  summaryItem: {
    gap: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  sectionHint: {
    fontSize: 13,
  },
  effortPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  effortPill: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effortPillText: {
    fontSize: 16,
    fontWeight: '700',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  starBtn: {
    padding: 4,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
  },
});
