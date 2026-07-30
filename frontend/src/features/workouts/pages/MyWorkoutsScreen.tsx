import React, { useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorView } from '../../../components/ui/ErrorView';
import { useSavedWorkouts } from '../../../hooks/useSavedWorkouts';
import { useWorkoutSession } from '../../../hooks/useWorkoutSession';
import { MyWorkoutsSkeleton } from '../components/MyWorkoutsSkeleton';
import { useThemeColors } from '../../../styles/tokens';

export const MyWorkoutsScreen: React.FC = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { savedWorkouts, isLoading, error, refetch, removeWorkout } = useSavedWorkouts();
  const { startSession } = useWorkoutSession();

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const handleStartWorkout = async (workoutTemplateId: string) => {
    if (!workoutTemplateId) {
      Alert.alert('Start Workout Failed', 'Workout template ID is missing.');
      return;
    }
    setStartingId(workoutTemplateId);
    try {
      const session = await startSession({ workout_template_id: workoutTemplateId });
      if (session) {
        router.push('/workout-session' as Href);
      } else {
        Alert.alert('Start Workout Failed', 'Could not start workout session. Please try again.');
      }
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to start workout session.';
      Alert.alert('Start Workout Failed', message);
    } finally {
      setStartingId(null);
    }
  };


  const handleRemove = async (workoutTemplateId: string) => {
    setRemovingId(workoutTemplateId);
    try {
      await removeWorkout(workoutTemplateId);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to remove workout.');
    } finally {
      setRemovingId(null);
    }
  };

  const getDifficultyVariant = (diff?: string) => {
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

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <PressableHeaderBack onBack={() => router.back()} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Workouts</Text>
        <Text style={[styles.subtitle, { color: colors.textSub }]}>
          Your saved workout collection for self-directed training.
        </Text>
      </View>

      {/* Loading State: Skeleton Loading */}
      {isLoading ? (
        <MyWorkoutsSkeleton />
      ) : error ? (
        <ErrorView message={error} onRetry={refetch} />
      ) : savedWorkouts.length === 0 ? (
        <Card style={styles.emptyCard}>
          <EmptyState
            icon="bookmark-outline"
            title="No Saved Workouts"
            description="Browse the Workout Library and save workouts to begin training."
            actionLabel="Browse Workout Library"
            onActionPress={() => router.push('/athlete-dashboard')}
          />
        </Card>
      ) : (
        <View style={styles.workoutsList}>
          {savedWorkouts.map((item) => {
            const tmpl = item.workout_template || {};
            const title = tmpl.title || 'Saved Workout';
            const description = tmpl.description || 'No description provided.';
            const sport = tmpl.sport || 'General';
            const difficulty = tmpl.difficulty || 'Intermediate';
            const duration = tmpl.duration_minutes || 30;

            const templateId = item.workout_template_id || tmpl.id || item.id;

            return (
              <Card key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    <Badge label={sport} variant="neutral" />
                    <Badge label={difficulty} variant={getDifficultyVariant(difficulty)} />
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color={colors.emerald} />
                    <Text style={[styles.durationText, { color: colors.textSub }]}>
                      {duration} mins
                    </Text>
                  </View>
                </View>

                <Text style={[styles.workoutTitle, { color: colors.textPrimary }]}>
                  {title}
                </Text>

                <Text style={[styles.descriptionText, { color: colors.textMuted }]} numberOfLines={3}>
                  {description}
                </Text>

                <View style={styles.actionRow}>
                  <Button
                    label="▶ Start Workout"
                    onPress={() => handleStartWorkout(templateId)}
                    variant="primary"
                    size="sm"
                    isLoading={startingId === templateId}
                    style={styles.halfBtn}
                  />
                  <Button
                    label="Remove"
                    onPress={() => handleRemove(templateId)}
                    variant="outline"
                    size="sm"
                    isLoading={removingId === templateId}
                    style={styles.halfBtn}
                  />
                </View>
              </Card>
            );

          })}
        </View>
      )}
    </ScreenContainer>
  );
};

function PressableHeaderBack({ onBack }: { onBack: () => void }) {
  const colors = useThemeColors();
  return (
    <Text onPress={onBack} style={[styles.backLink, { color: colors.info }]}>
      ← Back
    </Text>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backLink: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  emptyCard: {
    marginTop: 12,
    padding: 24,
  },
  workoutsList: {
    gap: 16,
  },
  card: {
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionRow: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 10,
  },
  halfBtn: {
    flex: 1,
  },
});

export default MyWorkoutsScreen;
