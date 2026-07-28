import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';

import { ScreenContainer, Card, Button, Badge, Loading, EmptyState } from '@/components/ui';
import { useThemeColors, RADIUS } from '@/styles/tokens';
import { getStoredToken } from '@/api/auth';
import { fetchMyPerformanceLogs, PerformanceLogResponse } from '@/api/performance';

export default function PerformanceScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const [logs, setLogs] = useState<PerformanceLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      try {
        const storedToken = await getStoredToken();
        if (!storedToken) {
          router.replace('/login');
          return;
        }

        const data = await fetchMyPerformanceLogs(storedToken);
        setLogs(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load performance logs');
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, []);

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.centerBox}>
          <Loading size="large" message="Loading performance records..." />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.shell, isDesktop ? styles.shellDesktop : isTablet ? styles.shellTablet : styles.shellMobile]}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>My Performance History</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>Logged effort, ratings, and workout session history</Text>
          </View>
          <Button
            label="Dashboard"
            onPress={() => router.push('/athlete-dashboard' as Href)}
            variant="secondary"
            size="sm"
          />
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.errorDim, borderColor: colors.error }]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {logs.length === 0 ? (
          <EmptyState
            icon="trophy-outline"
            title="No performance logs recorded yet"
            description="Complete a workout session to log effort ratings, notes, and performance stats."
            actionLabel="Start a Workout"
            onAction={() => router.push('/athlete-dashboard' as Href)}
          />
        ) : (
          <View style={styles.logsList}>
            {logs.map((log) => (
              <Card key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.workoutTitle, { color: colors.textPrimary }]}>
                      {log.workout_name}
                    </Text>
                    <Text style={[styles.dateText, { color: colors.textSub }]}>
                      Completed {new Date(log.completed_at || log.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <Badge
                    label={log.source_type === 'SELF' ? 'Self Workout' : 'Coach Plan'}
                    variant={log.source_type === 'SELF' ? 'info' : 'success'}
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

                <View style={styles.statsGrid}>
                  <View style={[styles.statTile, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
                    <Ionicons name="time-outline" size={18} color={colors.info} />
                    <View>
                      <Text style={[styles.statTileLabel, { color: colors.textMuted }]}>DURATION</Text>
                      <Text style={[styles.statTileValue, { color: colors.textPrimary }]}>
                        {log.duration_minutes} mins
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statTile, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
                    <Ionicons name="speedometer-outline" size={18} color={colors.emerald} />
                    <View>
                      <Text style={[styles.statTileLabel, { color: colors.textMuted }]}>EFFORT (RPE)</Text>
                      <Text style={[styles.statTileValue, { color: colors.textPrimary }]}>
                        {log.perceived_effort} / 10
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statTile, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
                    <Ionicons name="star" size={18} color={colors.warning} />
                    <View>
                      <Text style={[styles.statTileLabel, { color: colors.textMuted }]}>RATING</Text>
                      <Text style={[styles.statTileValue, { color: colors.textPrimary }]}>
                        {log.completion_rating} / 5 Stars
                      </Text>
                    </View>
                  </View>
                </View>

                {log.notes ? (
                  <View style={[styles.notesBox, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
                    <Ionicons name="document-text-outline" size={16} color={colors.textSub} style={{ marginTop: 2 }} />
                    <Text style={[styles.notesText, { color: colors.textSub }]}>{log.notes}</Text>
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
        )}

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
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  shell: {
    width: '100%',
    gap: 20,
  },
  shellDesktop: {
    maxWidth: 800,
  },
  shellTablet: {
    maxWidth: 680,
  },
  shellMobile: {
    maxWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
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
  logsList: {
    gap: 16,
  },
  logCard: {
    padding: 20,
    borderRadius: RADIUS.lg,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statTile: {
    flex: 1,
    minWidth: 150,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statTileLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statTileValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  notesBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
