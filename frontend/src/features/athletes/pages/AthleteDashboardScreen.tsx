import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import type { Athlete, Coach } from '@/api/admin';
import { fetchAthleteById, fetchCoachById } from '@/api/admin';
import type { AuthUser } from '@/api/auth';
import type { Workout } from '@/api/workout';
import { fetchAthleteWorkouts, updateWorkoutStatus } from '@/api/workout';
import type { PerformanceRecord } from '@/api/performance';
import {
  fetchAthletePerformances,
  fetchMyPerformanceLogs,
  PerformanceLogResponse,
  getSourceBadgeInfo,
} from '@/api/performance';

import {
  Button,
  Card,
  Badge,
  SummaryCard,
  Table,
  ThemeToggle,
  EmptyState,
  StatsGrid,
  StatsGridItem,
  OnboardingBanner,
  WorkoutSuccessModal,
} from '@/components/ui';
import RecommendedWorkoutsCard from '../components/RecommendedWorkoutsCard';
import WorkoutLibraryScreen from '@/features/workouts/pages/WorkoutLibraryScreen';
import TodayTrainingSection from '@/features/training/components/TodayTrainingSection';
import { useSavedWorkouts } from '@/hooks/useSavedWorkouts';
import { Href } from 'expo-router';
import { fetchWorkoutRecommendations, WorkoutRecommendation } from '@/api/profile';


import { useThemeColors, RADIUS } from '@/styles/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AthleteProfileDetailsCard from '@/features/profile/components/AthleteProfileDetailsCard';

interface AthleteDashboardScreenProps {
  user: AuthUser | null;
  token: string;
  onSignOut: () => void;
}

type TabType = 'dashboard' | 'workouts' | 'performance' | 'profile' | 'library';


const isWeb = Platform.OS === 'web';

export default function AthleteDashboardScreen({ user, token, onSignOut }: AthleteDashboardScreenProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const colors = useThemeColors();
  const scheme = useColorScheme();

  const styles = getStyles(colors, isLargeScreen);

  // Navigation state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(isLargeScreen);

  // Sync sidebar state when screen size changes
  useEffect(() => {
    setSidebarOpen(isLargeScreen);
  }, [isLargeScreen]);

  // Data state
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Workouts
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  // Performance
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceLogResponse[]>([]);
  const [isPerfLoading, setIsPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState<string | null>(null);

  // Workout Recommendations
  const [recommendations, setRecommendations] = useState<WorkoutRecommendation[]>([]);

  // Completion modal
  const [selectedWorkoutForCompletion, setSelectedWorkoutForCompletion] = useState<Workout | null>(null);
  const [completionStatus, setCompletionStatus] = useState<'completed' | 'skipped' | 'pending' | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState('100');
  const [athleteNotes, setAthleteNotes] = useState('');
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const athleteId = user?.id;

  const loadPerformanceData = useCallback(async () => {
    if (!token) return;
    setIsPerfLoading(true);
    setPerfError(null);
    try {
      const data = await fetchMyPerformanceLogs(token);
      const sorted = [...data].sort((a, b) => {
        const dA = a.completed_at || a.created_at || '';
        const dB = b.completed_at || b.created_at || '';
        return dB.localeCompare(dA);
      });
      setPerformanceLogs(sorted);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load performance data';
      setPerfError(message);
    } finally {
      setIsPerfLoading(false);
    }
  }, [token]);

  const loadDashboardData = useCallback(async () => {
    if (!athleteId || !token) return;
    setIsLoading(true);
    setError(null);

    try {
      let athleteData: Athlete;
      try {
        athleteData = await fetchAthleteById(token, athleteId);
        setAthlete(athleteData);

        if (athleteData.coach_id) {
          try {
            const coachData = await fetchCoachById(token, athleteData.coach_id);
            setCoach(coachData);
          } catch (coachError) {
            console.warn('Failed to fetch coach details:', coachError);
          }
        }
      } catch (e) {
        const errMessage = e instanceof Error ? e.message.toLowerCase() : '';
        const is404 = errMessage.includes('404') || errMessage.includes('not found') || errMessage.includes('no athlete');
        if (is404 && user) {
          athleteData = {
            athlete_id: athleteId,
            name: user.name || 'Athlete User',
            sport: 'Not specified',
            weight: 'Not specified',
            coach_id: '',
          };
          setAthlete(athleteData);
        } else {
          throw e;
        }
      }

      const workoutsData = await fetchAthleteWorkouts(token, athleteId);
      setWorkouts(workoutsData);

      if (user?.profile_completed) {
        try {
          const recs = await fetchWorkoutRecommendations(token);
          setRecommendations(recs);
        } catch (recErr) {
          console.warn('Failed to fetch workout recommendations:', recErr);
        }
      }

      // Load performance history as part of dashboard refresh
      await loadPerformanceData();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load dashboard data';
      console.warn('Error loading athlete dashboard data:', e);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [athleteId, token, loadPerformanceData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (activeTab === 'performance') {
      loadPerformanceData();
    }
  }, [activeTab, loadPerformanceData]);

  const handleUpdateStatus = async (workoutId: string, status: 'pending' | 'completed' | 'skipped') => {
    try {
      await updateWorkoutStatus(token, workoutId, status);
      setWorkouts((prev) =>
        prev.map((w) =>
          w.workout_id === workoutId
            ? { ...w, status, completed_at: undefined, completion_percentage: undefined, athlete_notes: undefined }
            : w
        )
      );
    } catch (e) {
      console.warn('Failed to update workout status:', e);
    }
  };

  const handleUpdateStatusClick = (workout: Workout, status: 'pending' | 'completed' | 'skipped') => {
    if (status === 'pending') {
      handleUpdateStatus(workout.workout_id, 'pending');
    } else {
      setSelectedWorkoutForCompletion(workout);
      setCompletionStatus(status);
      setCompletionPercentage(status === 'completed' ? '100' : '0');
      setAthleteNotes('');
    }
  };

  const handleSaveCompletion = async () => {
    if (!selectedWorkoutForCompletion || !completionStatus) return;
    setIsSavingCompletion(true);
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const completedAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const pct = parseInt(completionPercentage) || 0;

      await updateWorkoutStatus(
        token,
        selectedWorkoutForCompletion.workout_id,
        completionStatus,
        completedAt,
        pct,
        athleteNotes.trim() || undefined
      );

      setWorkouts((prev) =>
        prev.map((w) =>
          w.workout_id === selectedWorkoutForCompletion.workout_id
            ? {
                ...w,
                status: completionStatus,
                completed_at: completedAt,
                completion_percentage: pct,
                athlete_notes: athleteNotes.trim() || undefined,
              }
            : w
        )
      );

      const isCompleted = completionStatus === 'completed';
      setSelectedWorkoutForCompletion(null);

      if (isCompleted) {
        setShowSuccessModal(true);
        await loadPerformanceData();
      }
    } catch (err: any) {
      alert('Failed to save completion: ' + err.message);
    } finally {
      setIsSavingCompletion(false);
    }
  };

  // Derived metrics
  const totalWorkouts = workouts.length;
  const completedWorkouts = workouts.filter((w) => w.status === 'completed').length;
  const pendingWorkouts = workouts.filter((w) => w.status === 'pending').length;
  const skippedWorkouts = workouts.filter((w) => w.status === 'skipped').length;
  const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

  if (!user || !token) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.centeredStatus}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>Session expired. Please log in again.</Text>
          <Button label="Go to Login" onPress={onSignOut} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <WorkoutSuccessModal
        visible={showSuccessModal}
        onComplete={() => setShowSuccessModal(false)}
      />
      <View style={styles.mainContainer}>
        {/* ── SIDEBAR ── */}
        {sidebarOpen && (
          <View style={[styles.sidebar, !isLargeScreen && styles.sidebarFloating]}>
            <View style={styles.sidebarHeader}>
              <View style={styles.brandRow}>
                <Ionicons name="flash" size={22} color={colors.emerald} />
                <Text style={styles.sidebarBrand}>AthliTech</Text>
              </View>
              {!isLargeScreen && (
                <Pressable onPress={() => setSidebarOpen(false)}>
                  <Ionicons name="close" size={24} color={colors.textSub} />
                </Pressable>
              )}
            </View>

            {/* Athlete profile mini card */}
            <View style={[styles.sidebarProfile, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
              <View style={[styles.sidebarAvatar, { backgroundColor: colors.infoDim, borderColor: 'rgba(14,165,233,0.2)' }]}>
                <Text style={[styles.sidebarAvatarText, { color: colors.info }]}>
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sidebarProfileName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {user?.name || 'Athlete'}
                </Text>
                <Badge label="Athlete" variant="info" />
              </View>
            </View>

            <View style={styles.sidebarNav}>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: 'grid', count: null },
                { id: 'my-workouts', label: 'My Workouts', icon: 'bookmark', count: null },
                { id: 'library', label: 'Workout Library', icon: 'book', count: null },
                { id: 'workouts', label: 'Assigned Workouts', icon: 'fitness', count: totalWorkouts },
                { id: 'performance', label: 'Performance', icon: 'speedometer', count: null },
                { id: 'profile', label: 'My Profile', icon: 'person', count: null },
              ].map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.sidebarItem,
                    activeTab === item.id && styles.sidebarItemActive,
                  ]}
                  onPress={() => {
                    if (item.id === 'my-workouts') {
                      router.push('/my-workouts');
                    } else if (item.id === 'profile') {
                      router.push('/complete-profile');
                    } else {
                      setActiveTab(item.id as TabType);
                    }
                    if (!isLargeScreen) setSidebarOpen(false);
                  }}
                >

                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={activeTab === item.id ? colors.emerald : colors.textSub}
                  />
                  <Text
                    style={[
                      styles.sidebarItemLabel,
                      activeTab === item.id && styles.sidebarItemLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.count !== null && item.count !== undefined && (
                    <View style={[styles.sidebarBadge, activeTab === item.id && styles.sidebarBadgeActive]}>
                      <Text style={[styles.sidebarBadgeText, activeTab === item.id && styles.sidebarBadgeTextActive]}>
                        {item.count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            <View style={styles.sidebarFooter}>
              <Pressable style={styles.logoutButton} onPress={onSignOut}>
                <Ionicons name="log-out" size={20} color={colors.error} />
                <Text style={styles.logoutLabel}>Logout</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Dark overlay for mobile sidebar */}
        {sidebarOpen && !isLargeScreen && (
          <Pressable style={styles.overlay} onPress={() => setSidebarOpen(false)} />
        )}

        {/* ── MAIN CONTENT ── */}
        <View style={styles.contentArea}>
          {/* Header */}
          <View style={styles.header}>
            {(!isLargeScreen || !sidebarOpen) && (
              <Pressable onPress={() => setSidebarOpen(!sidebarOpen)} style={styles.hamburgerBtn}>
                <Ionicons name="menu" size={24} color={colors.textPrimary} />
              </Pressable>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>
                {activeTab === 'dashboard' && 'My Dashboard'}
                {activeTab === 'library' && 'Workout Library'}
                {activeTab === 'workouts' && 'Assigned Workouts'}
                {activeTab === 'performance' && 'My Performance'}
                {activeTab === 'profile' && 'My Profile'}

              </Text>
              <Text style={styles.headerSubtitle}>{user?.email || 'Athlete'}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <ThemeToggle />
              <Pressable onPress={loadDashboardData} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.contentInner,
              { padding: isWeb || isLargeScreen ? 24 : 16 },
            ]}
          >
            {isLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.emerald} />
                <Text style={styles.loaderText}>Loading your dashboard...</Text>
              </View>
            ) : error ? (
              <Card style={styles.section}>
                <View style={{ alignItems: 'center', padding: 24, gap: 16 }}>
                  <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                  <Button label="Retry" onPress={loadDashboardData} variant="primary" />
                </View>
              </Card>
            ) : !athlete ? (
              <Card style={styles.section}>
                <EmptyState
                  icon="person-outline"
                  title="Profile not found"
                  description="Your athlete profile could not be loaded."
                  actionLabel="Retry"
                  onActionPress={loadDashboardData}
                />
              </Card>
            ) : (
              <>
                {/* ── WORKOUT LIBRARY TAB ── */}
                {activeTab === 'library' && (
                  <WorkoutLibraryScreen token={token} userRole="athlete" />
                )}

                {/* ── DASHBOARD TAB ── */}
                {activeTab === 'dashboard' && (

                  <>
                    <OnboardingBanner
                      isVisible={!user?.profile_completed}
                      title="Welcome to AthliTech! 👋"
                      description="Your account has been created successfully. Complete your profile to unlock personalized workout recommendations & tracking."
                      buttonLabel="Complete Profile"
                      onAction={() => router.push('/complete-profile')}
                    />
                    {/* Welcome Banner */}
                    <Card style={[styles.section, { marginBottom: 24 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <View style={[styles.profileAvatar, { backgroundColor: colors.infoDim, borderColor: 'rgba(14,165,233,0.2)' }]}>
                          <Text style={[styles.avatarText, { color: colors.info, fontSize: 24 }]}>
                            {athlete.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.welcomeText, { color: colors.textSub }]}>Welcome back,</Text>
                          <Text style={[styles.welcomeName, { color: colors.textPrimary }]}>{athlete.name}</Text>
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                            <Badge label="Athlete" variant="info" />
                            {athlete.sport && <Badge label={athlete.sport} variant="neutral" />}
                          </View>
                        </View>
                        {coach && (
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }]}>My Coach</Text>
                            <Text style={[{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }]}>{coach.name}</Text>
                            <Badge label="Coach" variant="success" />
                          </View>
                        )}
                      </View>
                    </Card>

                    {/* Today's Training Section */}
                    <TodayTrainingSection
                      athleteId={athleteId}
                      onNavigateToWorkoutSession={() => router.push('/workout-session' as Href)}
                    />


                    {/* Stat Cards */}
                    <StatsGrid gap={16} style={{ marginBottom: 24 }}>
                      <StatsGridItem minWidth={300}>
                        <SummaryCard
                          title="Dashboard Summary"
                          iconName="stats-chart-outline"
                          metrics={[
                            { label: 'Total Workouts', value: totalWorkouts },
                            { label: 'Completed', value: completedWorkouts },
                            { label: 'Pending', value: pendingWorkouts },
                            { label: 'Completion Rate', value: completionRate, suffix: '%' },
                          ]}
                        />
                      </StatsGridItem>
                    </StatsGrid>

                    {/* Unlocked Workout Recommendations Card */}
                    {user?.profile_completed && (
                      <RecommendedWorkoutsCard recommendations={recommendations} />
                    )}

                    {/* Workout Breakdown Card */}
                    <StatsGrid gap={16} style={{ marginBottom: 24 }}>
                      <StatsGridItem minWidth={300}>
                        <Card style={{ flex: 1, height: '100%' }}>
                          <View style={styles.metricHeader}>
                            <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>Workout Status</Text>
                            <View style={[styles.iconWrapper, { backgroundColor: colors.infoDim }]}>
                              <Ionicons name="barbell-outline" size={20} color={colors.info} />
                            </View>
                          </View>
                          <View style={styles.derivedStatsContainer}>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>{pendingWorkouts}</Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>Pending</Text>
                            </View>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>{completedWorkouts}</Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>Completed</Text>
                            </View>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>{skippedWorkouts}</Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>Skipped</Text>
                            </View>
                          </View>
                        </Card>
                      </StatsGridItem>

                      {/* Coach Card */}
                      <StatsGridItem minWidth={300}>
                        <Card style={{ flex: 1, height: '100%' }}>
                          <View style={styles.metricHeader}>
                            <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>My Coach</Text>
                            <View style={[styles.iconWrapper, { backgroundColor: colors.emeraldDim }]}>
                              <Ionicons name="person-circle-outline" size={20} color={colors.emerald} />
                            </View>
                          </View>
                          {coach ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                              <View style={[styles.coachAvatar, { backgroundColor: colors.emeraldDim, borderColor: colors.borderEmerald }]}>
                                <Text style={[styles.avatarText, { color: colors.emerald }]}>
                                  {coach.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.coachName, { color: colors.textPrimary }]}>{coach.name}</Text>
                                <Text style={[styles.coachEmail, { color: colors.textSub }]}>{coach.email}</Text>
                                <Badge label="Coach" variant="success" />
                              </View>
                            </View>
                          ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                              <Ionicons name="person-outline" size={32} color={colors.textMuted} />
                              <Text style={[{ fontSize: 13, color: colors.textMuted, marginTop: 8 }]}>No coach assigned yet</Text>
                            </View>
                          )}
                        </Card>
                      </StatsGridItem>
                    </StatsGrid>

                    {/* Recent workouts preview */}
                    {workouts.length > 0 && (
                      <Card style={styles.section}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Workouts</Text>
                          <Button
                            label="View All"
                            onPress={() => setActiveTab('workouts')}
                            variant="secondary"
                            size="sm"
                          />
                        </View>
                        {workouts.slice(0, 3).map((w) => (
                          <View key={w.workout_id} style={[styles.activityRow, { borderBottomColor: colors.borderSubtle }]}>
                            <View style={[styles.activityIconWrapper, {
                              backgroundColor: w.status === 'completed' ? colors.emeraldDim : w.status === 'skipped' ? colors.errorDim : colors.infoDim
                            }]}>
                              <Ionicons
                                name={w.status === 'completed' ? 'checkmark-circle' : w.status === 'skipped' ? 'close-circle' : 'time'}
                                size={16}
                                color={w.status === 'completed' ? colors.emerald : w.status === 'skipped' ? colors.error : colors.info}
                              />
                            </View>
                            <View style={styles.activityContent}>
                              <Text style={styles.activityTitleText}>{w.title}</Text>
                              <Text style={styles.activityMsgText}>Target: {w.date || 'Not set'}</Text>
                            </View>
                            <Badge
                              label={w.status}
                              variant={w.status === 'completed' ? 'success' : w.status === 'skipped' ? 'error' : 'warning'}
                            />
                          </View>
                        ))}
                      </Card>
                    )}

                    {/* My Workouts Section Preview */}
                    <MyWorkoutsDashboardSection />

                    {/* Quick Actions */}
                    <View style={styles.section}>

                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
                      <StatsGrid gap={16} style={{ marginTop: 12 }}>
                        <StatsGridItem minWidth={260}>
                          <Pressable
                            style={styles.actionCard}
                            onPress={() => setActiveTab('workouts')}
                          >
                            <Ionicons name="barbell-outline" size={32} color={colors.info} />
                            <Text style={styles.actionCardTitle}>Assigned Workouts</Text>
                            <Text style={styles.actionCardDesc}>
                              View and update the status of your assigned workout plans.
                            </Text>

                          </Pressable>
                        </StatsGridItem>
                        <StatsGridItem minWidth={260}>
                          <Pressable
                            style={styles.actionCard}
                            onPress={() => setActiveTab('performance')}
                          >
                            <Ionicons name="speedometer" size={32} color={colors.warning} />
                            <Text style={styles.actionCardTitle}>Performance History</Text>
                            <Text style={styles.actionCardDesc}>
                              Track your progress and review coach feedback.
                            </Text>
                          </Pressable>
                        </StatsGridItem>
                      </StatsGrid>
                    </View>
                  </>
                )}

                {/* ── WORKOUTS TAB ── */}
                {activeTab === 'workouts' && (
                  <Card style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 20 }]}>
                      My Workouts ({workouts.length})
                    </Text>

                    {workouts.length === 0 ? (
                      <EmptyState
                        icon="fitness-outline"
                        title="No workouts assigned yet"
                        description="Your coach will assign workout plans to you soon."
                      />
                    ) : (
                      <View style={styles.workoutsList}>
                        {workouts.map((w) => (
                          <Card key={w.workout_id} style={styles.workoutCard}>
                            {/* Header */}
                            <View style={styles.workoutCardHeader}>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.workoutTitle, { color: colors.textPrimary }]}>{w.title}</Text>
                                {w.date && (
                                  <Text style={[styles.workoutDate, { color: colors.textSub }]}>
                                    Target Date: {w.date}
                                  </Text>
                                )}
                              </View>
                              <Badge
                                label={w.status}
                                variant={
                                  w.status === 'completed' ? 'success' : w.status === 'skipped' ? 'error' : 'warning'
                                }
                              />
                            </View>

                            {w.description ? (
                              <Text style={[styles.workoutDesc, { color: colors.textSub }]}>{w.description}</Text>
                            ) : null}

                            {/* Exercises */}
                            {w.exercises && w.exercises.length > 0 && (
                              <View style={[styles.exercisesContainer, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
                                <Text style={[styles.exercisesTitle, { color: colors.textSub }]}>Exercises</Text>
                                {w.exercises.map((ex, idx) => (
                                  <View key={idx} style={styles.exerciseRow}>
                                    <Ionicons name="ellipse" size={6} color={colors.info} />
                                    <Text style={[styles.exerciseText, { color: colors.textPrimary }]}>
                                      {ex.name} — {ex.sets} sets × {ex.reps} reps{ex.duration ? ` (${ex.duration})` : ''}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Completion Record */}
                            {(w.status === 'completed' || w.status === 'skipped') && (w.completed_at || w.completion_percentage !== undefined) && (
                              <View style={[styles.completionCard, { backgroundColor: w.status === 'completed' ? colors.emeraldDim : colors.errorDim, borderColor: w.status === 'completed' ? colors.borderEmerald : 'rgba(239,68,68,0.15)' }]}>
                                <Text style={[styles.completionTitle, { color: w.status === 'completed' ? colors.emerald : colors.error }]}>
                                  Completion Record
                                </Text>
                                {w.completed_at && (
                                  <Text style={[styles.completionDetail, { color: colors.textSub }]}>
                                    Date: {w.completed_at}
                                  </Text>
                                )}
                                {w.completion_percentage !== undefined && (
                                  <Text style={[styles.completionDetail, { color: colors.textSub }]}>
                                    Completion: {w.completion_percentage}%
                                  </Text>
                                )}
                                {w.athlete_notes && (
                                  <Text style={[styles.completionDetail, { color: colors.textSub }]}>
                                    Notes: "{w.athlete_notes}"
                                  </Text>
                                )}
                              </View>
                            )}

                            {/* Status Controls */}
                            <View style={styles.statusControlsRow}>
                              <Pressable
                                style={[
                                  styles.statusBtn,
                                  {
                                    backgroundColor: w.status === 'pending' ? colors.bgMid : 'transparent',
                                    borderColor: w.status === 'pending' ? colors.textSub : colors.border,
                                  },
                                ]}
                                onPress={() => handleUpdateStatusClick(w, 'pending')}
                              >
                                <Text style={[styles.statusBtnText, { color: w.status === 'pending' ? colors.textPrimary : colors.textSub }]}>
                                  Pending
                                </Text>
                              </Pressable>
                              <Pressable
                                style={[
                                  styles.statusBtn,
                                  {
                                    backgroundColor: w.status === 'completed' ? colors.emeraldDim : 'transparent',
                                    borderColor: w.status === 'completed' ? colors.emerald : colors.border,
                                  },
                                ]}
                                onPress={() => handleUpdateStatusClick(w, 'completed')}
                              >
                                <Text style={[styles.statusBtnText, { color: w.status === 'completed' ? colors.emerald : colors.textSub }]}>
                                  Completed
                                </Text>
                              </Pressable>
                              <Pressable
                                style={[
                                  styles.statusBtn,
                                  {
                                    backgroundColor: w.status === 'skipped' ? colors.errorDim : 'transparent',
                                    borderColor: w.status === 'skipped' ? colors.error : colors.border,
                                  },
                                ]}
                                onPress={() => handleUpdateStatusClick(w, 'skipped')}
                              >
                                <Text style={[styles.statusBtnText, { color: w.status === 'skipped' ? colors.error : colors.textSub }]}>
                                  Skipped
                                </Text>
                              </Pressable>
                            </View>
                          </Card>
                        ))}
                      </View>
                    )}
                  </Card>
                )}

                {/* ── PERFORMANCE TAB ── */}
                {activeTab === 'performance' && (
                  <Card style={styles.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                          My Performance History
                        </Text>
                        <Text style={[{ fontSize: 13, color: colors.textSub, marginTop: 2 }]}>
                          Unified record of Coach Plans & Self Workouts
                        </Text>
                      </View>
                      <Button
                        label="Refresh"
                        onPress={loadPerformanceData}
                        variant="secondary"
                        size="sm"
                        prefix={<Ionicons name="refresh-outline" size={16} color={colors.textPrimary} style={{ marginRight: 4 }} />}
                      />
                    </View>

                    {isPerfLoading ? (
                      <View style={{ padding: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.emerald} />
                        <Text style={[styles.loaderText, { marginTop: 12 }]}>Loading performance history…</Text>
                      </View>
                    ) : perfError ? (
                      <Text style={[styles.errorText, { color: colors.error }]}>{perfError}</Text>
                    ) : performanceLogs.length === 0 ? (
                      <EmptyState
                        icon="trophy-outline"
                        title="No performance logs recorded yet"
                        description="Complete workout sessions to record your performance history."
                        actionLabel="Browse Workout Library"
                        onAction={() => setActiveTab('library')}
                      />
                    ) : (
                      <View style={styles.performanceGrid}>
                        {performanceLogs.map((log) => {
                          const badgeInfo = getSourceBadgeInfo(log.source_type);
                          const dateFormatted = log.completed_at || log.created_at
                            ? new Date(log.completed_at || log.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Recently completed';

                          return (
                            <Card key={log.id} style={styles.perfCard}>
                              <View style={styles.perfCardHeader}>
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                  <Text style={[styles.perfWorkoutTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                    {log.workout_name}
                                  </Text>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                    <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                                    <Text style={[styles.perfDateText, { color: colors.textSub }]}>{dateFormatted}</Text>
                                  </View>
                                </View>
                                <Badge label={badgeInfo.label} variant={badgeInfo.variant} />
                              </View>

                              <View style={[styles.perfDivider, { backgroundColor: colors.borderSubtle }]} />

                              <View style={styles.perfStatsRow}>
                                <View style={[styles.perfStatTile, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
                                  <Ionicons name="time-outline" size={16} color={colors.info} />
                                  <View>
                                    <Text style={[styles.perfTileLabel, { color: colors.textMuted }]}>DURATION</Text>
                                    <Text style={[styles.perfTileValue, { color: colors.textPrimary }]}>
                                      {log.duration_minutes} mins
                                    </Text>
                                  </View>
                                </View>

                                <View style={[styles.perfStatTile, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
                                  <Ionicons name="speedometer-outline" size={16} color={colors.emerald} />
                                  <View>
                                    <Text style={[styles.perfTileLabel, { color: colors.textMuted }]}>EFFORT (RPE)</Text>
                                    <Text style={[styles.perfTileValue, { color: colors.textPrimary }]}>
                                      {log.perceived_effort} / 10
                                    </Text>
                                  </View>
                                </View>

                                <View style={[styles.perfStatTile, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
                                  <Ionicons name="star" size={16} color={colors.warning} />
                                  <View>
                                    <Text style={[styles.perfTileLabel, { color: colors.textMuted }]}>RATING</Text>
                                    <Text style={[styles.perfTileValue, { color: colors.textPrimary }]}>
                                      {log.completion_rating} / 5 Stars
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              {log.notes ? (
                                <View style={[styles.perfNotesBox, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
                                  <Ionicons name="document-text-outline" size={15} color={colors.textSub} style={{ marginTop: 2 }} />
                                  <Text style={[styles.perfNotesText, { color: colors.textSub }]} numberOfLines={2}>
                                    {log.notes}
                                  </Text>
                                </View>
                              ) : null}
                            </Card>
                          );
                        })}
                      </View>
                    )}
                  </Card>
                )}

                {/* ── PROFILE TAB ── */}
                {activeTab === 'profile' && (
                  <AthleteProfileDetailsCard
                    userName={athlete.name}
                    userEmail={user.email}
                    profile={{
                      sport: athlete.sport || '',
                      event: (athlete as any).event || '',
                      height: (athlete as any).height || null,
                      weight: athlete.weight ? parseFloat(String(athlete.weight)) : null,
                      dob: (athlete as any).dob || null,
                      personal_best: (athlete as any).personal_best || null,
                      primary_goal: (athlete as any).primary_goal || null,
                      goal_timeline: (athlete as any).goal_timeline || null,
                    }}
                    onEdit={() => router.push('/complete-profile')}
                    coachName={coach?.name}
                    coachEmail={coach?.email}
                  />
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>

      {/* ── COMPLETION MODAL ── */}
      <Modal
        visible={selectedWorkoutForCompletion !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedWorkoutForCompletion(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedWorkoutForCompletion(null)}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Record Completion</Text>
              <Pressable onPress={() => setSelectedWorkoutForCompletion(null)}>
                <Ionicons name="close" size={24} color={colors.textSub} />
              </Pressable>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSub }]}>
              Workout: {selectedWorkoutForCompletion?.title}
            </Text>

            <View style={{ marginTop: 20, gap: 14 }}>
              <View>
                <Text style={[styles.modalLabel, { color: colors.textSub }]}>Completion Percentage (0–100%)</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg, marginTop: 6 }]}
                  keyboardType="numeric"
                  value={completionPercentage}
                  onChangeText={(val) => {
                    const clean = val.replace(/[^0-9]/g, '');
                    const num = parseInt(clean) || 0;
                    setCompletionPercentage(num > 100 ? '100' : clean);
                  }}
                />
              </View>
              <View>
                <Text style={[styles.modalLabel, { color: colors.textSub }]}>Athlete Notes (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg, marginTop: 6 }]}
                  placeholder="How did it feel? Any issues or highlights?"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  value={athleteNotes}
                  onChangeText={setAthleteNotes}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <Button
                label="Cancel"
                onPress={() => setSelectedWorkoutForCompletion(null)}
                variant="secondary"
                disabled={isSavingCompletion}
              />
              <Button
                label={isSavingCompletion ? 'Saving…' : 'Save Completion'}
                onPress={handleSaveCompletion}
                variant="primary"
                disabled={isSavingCompletion}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(colors: ReturnType<typeof useThemeColors>, isLargeScreen: boolean) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    mainContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    centeredStatus: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 16,
    },
    errorText: {
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
    },

    // ── Sidebar ──
    sidebar: {
      width: 260,
      backgroundColor: colors.bgCard,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      paddingVertical: 20,
    },
    sidebarFloating: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 1000,
    },
    sidebarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sidebarBrand: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    sidebarProfile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: 16,
      marginBottom: 20,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    sidebarAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    sidebarAvatarText: {
      fontSize: 14,
      fontWeight: '800',
    },
    sidebarProfileName: {
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 4,
    },
    sidebarNav: {
      paddingHorizontal: 12,
      gap: 4,
    },
    sidebarItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
    },
    sidebarItemActive: {
      backgroundColor: colors.emeraldDim,
      borderColor: colors.borderEmerald,
      borderWidth: 1,
    },
    sidebarItemLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSub,
    },
    sidebarItemLabelActive: {
      color: colors.emerald,
    },
    sidebarBadge: {
      backgroundColor: colors.bgMid,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sidebarBadgeActive: {
      backgroundColor: colors.emeraldDim,
      borderColor: colors.borderEmerald,
    },
    sidebarBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSub,
    },
    sidebarBadgeTextActive: {
      color: colors.emerald,
    },
    sidebarFooter: {
      paddingHorizontal: 12,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 20,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
    },
    logoutLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.error,
    },

    overlay: {
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 999,
    },

    // ── Header ──
    contentArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    hamburgerBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.bgMid,
    },
    headerInfo: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSub,
      marginTop: 2,
    },
    refreshBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.bgMid,
    },

    // ── Content ──
    content: {
      flex: 1,
    },
    contentInner: {
      maxWidth: 1400,
      alignSelf: 'center',
      width: '100%',
      gap: 0,
    },
    loaderContainer: {
      paddingVertical: 60,
      alignItems: 'center',
      gap: 12,
    },
    loaderText: {
      color: colors.textSub,
      fontSize: 14,
    },

    // ── Welcome ──
    welcomeText: {
      fontSize: 13,
    },
    welcomeName: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    profileAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '800',
    },

    // ── Metrics ──
    metricsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 24,
      width: '100%',
    },
    metricHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    metricLabel: {
      fontSize: 14,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    iconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    derivedStatsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    derivedStatBox: {
      flex: 1,
      backgroundColor: colors.bgMid,
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    derivedStatVal: {
      fontSize: 18,
      fontWeight: '800',
    },
    derivedStatLabel: {
      fontSize: 10,
      fontWeight: '600',
      marginTop: 2,
      textTransform: 'uppercase',
    },

    // ── Coach card ──
    coachAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    coachName: {
      fontSize: 15,
      fontWeight: '700',
    },
    coachEmail: {
      fontSize: 13,
      marginTop: 2,
    },

    // ── Sections ──
    section: {
      marginBottom: 32,
      width: '100%',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
    },

    // ── Activity Feed ──
    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
    },
    activityIconWrapper: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityContent: {
      flex: 1,
    },
    activityTitleText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    activityMsgText: {
      fontSize: 12,
      color: colors.textSub,
      marginTop: 2,
    },

    // ── Quick Actions ──
    actionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginTop: 12,
    },
    actionCard: {
      minWidth: 260,
      backgroundColor: colors.bgCard,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 10,
      padding: 20,
      gap: 10,
    },
    actionCardTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    actionCardDesc: {
      fontSize: 14,
      color: colors.textSub,
      lineHeight: 20,
    },

    // ── Workouts ──
    workoutsList: {
      gap: 16,
    },
    workoutCard: {
      gap: 12,
    },
    workoutCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    workoutTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    workoutDate: {
      fontSize: 12,
      marginTop: 4,
    },
    workoutDesc: {
      fontSize: 13,
      lineHeight: 20,
    },
    exercisesContainer: {
      borderRadius: 8,
      borderWidth: 1,
      padding: 12,
      gap: 8,
    },
    exercisesTitle: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    exerciseText: {
      fontSize: 13,
      flex: 1,
    },

    // ── Status Controls ──
    statusControlsRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    statusBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
    },
    statusBtnText: {
      fontSize: 12,
      fontWeight: '700',
    },

    // ── Completion Card ──
    completionCard: {
      borderRadius: 8,
      borderWidth: 1,
      padding: 12,
      gap: 4,
    },
    completionTitle: {
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    completionDetail: {
      fontSize: 12,
      lineHeight: 18,
    },

    // ── Table Cells ──
    tableCellMain: {
      paddingHorizontal: 16,
      minWidth: 180,
      flex: 2,
      justifyContent: 'center',
    },
    tableCell: {
      paddingHorizontal: 16,
      minWidth: 100,
      flex: 1,
      justifyContent: 'center',
    },
    tableMainText: {
      fontSize: 14,
      fontWeight: '700',
    },
    tableCellText: {
      fontSize: 13,
    },

    // ── Profile Tab ──
    profileAvatarLarge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    avatarTextLarge: {
      fontSize: 32,
      fontWeight: '800',
    },
    profileNameText: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    profileEmailText: {
      fontSize: 14,
      marginTop: 4,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
    },
    infoIconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoLabel: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '600',
      marginTop: 2,
    },
    divider: {
      height: 1,
    },

    // ── Forms ──
    formInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
    },
    formTextArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },

    // ── Modal ──
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalCard: {
      width: Math.min(480, isWeb ? 480 : 360),
      borderRadius: 12,
      borderWidth: 1,
      padding: 24,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    modalSubtitle: {
      fontSize: 13,
      marginTop: 4,
    },
    modalLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // ── Performance Card UI ──
    performanceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    perfCard: {
      width: isLargeScreen ? '48.5%' : '100%',
      minWidth: isLargeScreen ? 340 : '100%',
      padding: 20,
      borderRadius: RADIUS.lg,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 4,
      gap: 14,
    },
    perfCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    perfWorkoutTitle: {
      fontSize: 17,
      fontWeight: '700',
    },
    perfDateText: {
      fontSize: 13,
    },
    perfDivider: {
      height: 1,
      marginVertical: 4,
    },
    perfStatsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    perfStatTile: {
      flex: 1,
      minWidth: 95,
      padding: 10,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    perfTileLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    perfTileValue: {
      fontSize: 13,
      fontWeight: '700',
      marginTop: 1,
    },
    perfNotesBox: {
      padding: 10,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
    },
    perfNotesText: {
      fontSize: 13,
      lineHeight: 18,
      flex: 1,
    },
    perfFooterRow: {
      borderTopWidth: 1,
      paddingTop: 10,
      marginTop: 4,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    viewDetailsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    viewDetailsText: {
      fontSize: 13,
      fontWeight: '600',
    },
  });
}

function MyWorkoutsDashboardSection() {
  const router = useRouter();
  const colors = useThemeColors();
  const { savedWorkouts, isLoading } = useSavedWorkouts();

  const previewItems = savedWorkouts.slice(0, 5);

  return (
    <Card style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>My Workouts</Text>
        <Button
          label="View All →"
          onPress={() => router.push('/my-workouts' as Href)}
          variant="secondary"
          size="sm"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.emerald} style={{ padding: 16 }} />
      ) : previewItems.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title="No workouts saved yet."
          description="Browse the Workout Library and save workouts to begin training."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {previewItems.map((item) => {
            const tmpl = item.workout_template || {};
            const title = tmpl.title || 'Saved Workout';
            const sport = tmpl.sport || 'General';
            const difficulty = tmpl.difficulty || 'Intermediate';
            const duration = tmpl.duration_minutes || 30;

            const diffVariant =
              difficulty === 'Beginner'
                ? 'success'
                : difficulty === 'Advanced'
                ? 'error'
                : 'warning';

            return (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  backgroundColor: colors.bgMid,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }}>
                    {sport} • {duration} mins
                  </Text>
                </View>
                <Badge label={difficulty} variant={diffVariant as any} />
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}