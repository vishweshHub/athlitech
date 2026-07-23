import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import type { Athlete } from '@/api/admin';
import { fetchCoachAthletes, fetchCoachById } from '@/api/admin';
import type { AuthUser } from '@/api/auth';
import type { Workout, Exercise } from '@/api/workout';
import { createWorkout, fetchCoachWorkouts } from '@/api/workout';
import type { PerformanceRecord } from '@/api/performance';
import { fetchAthletePerformances, createPerformance } from '@/api/performance';

import {
  Button,
  Card,
  Badge,
  SummaryCard,
  SearchBar,
  Table,
  ThemeToggle,
  EmptyState,
  SkeletonLoader,
  OnboardingBanner,
  StatsGrid,
  StatsGridItem,
  CollectionGrid,
  CollectionGridItem,
} from '@/components/ui';
import { useThemeColors } from '@/styles/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CoachDashboardScreenProps {
  user: AuthUser | null;
  token: string;
  onSignOut: () => void;
}

type TabType = 'dashboard' | 'athletes' | 'workouts' | 'performance';

const isWeb = Platform.OS === 'web';

export default function CoachDashboardScreen({ user, token, onSignOut }: CoachDashboardScreenProps) {
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

  // Backend data state
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualCoachId, setActualCoachId] = useState<string | null>(null);

  // Performance state
  const [selectedAthleteForPerf, setSelectedAthleteForPerf] = useState<Athlete | null>(null);
  const [athletePerformances, setAthletePerformances] = useState<PerformanceRecord[]>([]);
  const [isPerfLoading, setIsPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState<string | null>(null);

  // Create Workout Form State
  const [showCreateWorkoutModal, setShowCreateWorkoutModal] = useState(false);
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [workoutFormMessage, setWorkoutFormMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [newWorkoutTitle, setNewWorkoutTitle] = useState('');
  const [newWorkoutDescription, setNewWorkoutDescription] = useState('');
  const [newWorkoutAthleteId, setNewWorkoutAthleteId] = useState('');
  const [newWorkoutDate, setNewWorkoutDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [newWorkoutExercises, setNewWorkoutExercises] = useState<Exercise[]>([
    { name: '', sets: 3, reps: 10, duration: '' }
  ]);
  const [athleteDropdownSearch, setAthleteDropdownSearch] = useState('');
  const [showAthleteDropdown, setShowAthleteDropdown] = useState(false);

  // Create Performance Form State
  const [showCreatePerfModal, setShowCreatePerfModal] = useState(false);
  const [isSavingPerf, setIsSavingPerf] = useState(false);
  const [perfFormMessage, setPerfFormMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [newSprintTime, setNewSprintTime] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newHeight, setNewHeight] = useState('');
  const [newPerfRemarks, setNewPerfRemarks] = useState('');
  const [newPerfDate, setNewPerfDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  // Record linked performance for workout
  const [selectedWorkoutForPerf, setSelectedWorkoutForPerf] = useState<Workout | null>(null);
  const [perfSportEvent, setPerfSportEvent] = useState('');
  const [perfValue, setPerfValue] = useState('');
  const [perfUnit, setPerfUnit] = useState('seconds');
  const [perfFeedback, setPerfFeedback] = useState('');
  const [perfLinkedDate, setPerfLinkedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [isSavingLinkedPerf, setIsSavingLinkedPerf] = useState(false);
  const [linkedPerfMessage, setLinkedPerfMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!token || !user) return;
    setIsLoading(true);
    setError(null);

    try {
      let coachId = user?.coach_id;
      if (!coachId && user?.id) {
        const coachData = await fetchCoachById(token, user.id);
        coachId = coachData.coach_id || coachData.id;
      }
      if (!coachId && user?.id) {
        coachId = user.id;
      }
      if (!coachId) {
        throw new Error('Coach account is not fully configured (missing Coach ID).');
      }

      setActualCoachId(coachId);

      const [athletesData, workoutsData] = await Promise.all([
        fetchCoachAthletes(token, coachId),
        fetchCoachWorkouts(token, coachId),
      ]);

      setAthletes(athletesData);
      setFilteredAthletes(athletesData);
      setWorkouts(workoutsData);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load dashboard data';
      console.warn('Error loading coach dashboard data:', e);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Filter athletes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAthletes(athletes);
      return;
    }
    const query = searchQuery.toLowerCase();
    setFilteredAthletes(
      athletes.filter(
        (a) =>
          (a.name && a.name.toLowerCase().includes(query)) ||
          (a.sport && a.sport.toLowerCase().includes(query))
      )
    );
  }, [searchQuery, athletes]);

  // Load athlete performances when selected
  useEffect(() => {
    if (!selectedAthleteForPerf || !token) return;
    const athlete = selectedAthleteForPerf;
    async function loadPerfs() {
      setIsPerfLoading(true);
      setPerfError(null);
      try {
        const data = await fetchAthletePerformances(token, athlete.athlete_id);
        const sorted = [...data].sort((a, b) => {
          const dA = a.date || a.recorded_at || '';
          const dB = b.date || b.recorded_at || '';
          return dB.localeCompare(dA);
        });
        setAthletePerformances(sorted);
      } catch (err: any) {
        setPerfError(err.message || 'Failed to fetch performance history');
      } finally {
        setIsPerfLoading(false);
      }
    }
    loadPerfs();
  }, [selectedAthleteForPerf, token]);

  // Auto-select athlete if only one
  useEffect(() => {
    if (athletes.length === 1) {
      setNewWorkoutAthleteId(athletes[0].athlete_id);
    }
  }, [athletes]);

  // Handlers
  const handleCreateWorkout = async () => {
    setWorkoutFormMessage(null);
    if (!newWorkoutTitle.trim()) {
      setWorkoutFormMessage({ text: 'Workout title cannot be empty.', isError: true });
      return;
    }
    if (!newWorkoutAthleteId) {
      setWorkoutFormMessage({ text: 'Please select an athlete.', isError: true });
      return;
    }
    if (!newWorkoutDate.trim()) {
      setWorkoutFormMessage({ text: 'Please enter a target date.', isError: true });
      return;
    }
    for (let i = 0; i < newWorkoutExercises.length; i++) {
      if (!newWorkoutExercises[i].name.trim()) {
        setWorkoutFormMessage({ text: `Exercise #${i + 1} name cannot be empty.`, isError: true });
        return;
      }
    }

    setIsSavingWorkout(true);
    try {
      await createWorkout(token, {
        title: newWorkoutTitle.trim(),
        description: newWorkoutDescription.trim() || undefined,
        athlete_id: newWorkoutAthleteId,
        exercises: newWorkoutExercises,
        date: newWorkoutDate.trim(),
      });
      setWorkoutFormMessage({ text: 'Workout plan assigned successfully!', isError: false });
      setNewWorkoutTitle('');
      setNewWorkoutDescription('');
      setNewWorkoutAthleteId(athletes.length === 1 ? athletes[0].athlete_id : '');
      setNewWorkoutExercises([{ name: '', sets: 3, reps: 10, duration: '' }]);

      if (actualCoachId) {
        const workoutsData = await fetchCoachWorkouts(token, actualCoachId);
        setWorkouts(workoutsData);
      }

      setTimeout(() => {
        setShowCreateWorkoutModal(false);
        setWorkoutFormMessage(null);
      }, 1500);
    } catch (e: any) {
      setWorkoutFormMessage({ text: e.message || 'Failed to create workout plan.', isError: true });
    } finally {
      setIsSavingWorkout(false);
    }
  };

  const handleCreatePerformance = async () => {
    setPerfFormMessage(null);
    if (!selectedAthleteForPerf) return;

    const sprintFloat = parseFloat(newSprintTime);
    const weightInt = parseInt(newWeight);
    const heightInt = parseInt(newHeight);

    if (isNaN(sprintFloat) || sprintFloat <= 0) {
      setPerfFormMessage({ text: 'Sprint time must be a number greater than 0.', isError: true });
      return;
    }
    if (isNaN(weightInt) || weightInt <= 0) {
      setPerfFormMessage({ text: 'Weight must be an integer greater than 0.', isError: true });
      return;
    }
    if (isNaN(heightInt) || heightInt <= 0) {
      setPerfFormMessage({ text: 'Height must be an integer greater than 0.', isError: true });
      return;
    }

    setIsSavingPerf(true);
    try {
      await createPerformance(token, {
        athlete_id: selectedAthleteForPerf.athlete_id,
        date: newPerfDate.trim(),
        sprint_time: sprintFloat,
        weight: weightInt,
        height: heightInt,
        coach_remarks: newPerfRemarks.trim() || undefined,
      });
      setPerfFormMessage({ text: 'Performance recorded successfully!', isError: false });
      setNewSprintTime('');
      setNewWeight('');
      setNewHeight('');
      setNewPerfRemarks('');

      const data = await fetchAthletePerformances(token, selectedAthleteForPerf.athlete_id);
      const sorted = [...data].sort((a, b) => {
        const dA = a.date || a.recorded_at || '';
        const dB = b.date || b.recorded_at || '';
        return dB.localeCompare(dA);
      });
      setAthletePerformances(sorted);

      setTimeout(() => {
        setShowCreatePerfModal(false);
        setPerfFormMessage(null);
      }, 1500);
    } catch (err: any) {
      setPerfFormMessage({ text: err.message || 'Failed to record performance.', isError: true });
    } finally {
      setIsSavingPerf(false);
    }
  };

  const handleCreateLinkedPerformance = async () => {
    setLinkedPerfMessage(null);
    if (!selectedWorkoutForPerf) return;
    const valFloat = parseFloat(perfValue);
    if (isNaN(valFloat) || valFloat <= 0) {
      setLinkedPerfMessage({ text: 'Performance value must be greater than 0.', isError: true });
      return;
    }
    if (!perfSportEvent.trim()) {
      setLinkedPerfMessage({ text: 'Sport/Event name cannot be empty.', isError: true });
      return;
    }

    setIsSavingLinkedPerf(true);
    try {
      await createPerformance(token, {
        athlete_id: selectedWorkoutForPerf.athlete_id,
        workout_id: selectedWorkoutForPerf.workout_id,
        sport_event: perfSportEvent.trim(),
        value: valFloat,
        unit: perfUnit.trim(),
        feedback: perfFeedback.trim() || undefined,
        recorded_at: perfLinkedDate.trim(),
        date: perfLinkedDate.trim(),
      });
      setLinkedPerfMessage({ text: 'Performance recorded successfully!', isError: false });
      setPerfValue('');
      setPerfFeedback('');
      setTimeout(() => {
        setSelectedWorkoutForPerf(null);
        setLinkedPerfMessage(null);
      }, 1500);
    } catch (err: any) {
      setLinkedPerfMessage({ text: err.message || 'Failed to record performance.', isError: true });
    } finally {
      setIsSavingLinkedPerf(false);
    }
  };

  // Derived metrics
  const totalAthletes = athletes.length;
  const totalWorkouts = workouts.length;
  const completedWorkouts = workouts.filter((w) => w.status === 'completed').length;
  const pendingWorkouts = workouts.filter((w) => w.status === 'pending').length;
  const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

  const getRecentActivity = () => {
    const activities: { id: string; type: string; title: string; message: string; dateStr: string }[] = [];

    athletes.forEach((a) => {
      activities.push({
        id: `athlete-${a.athlete_id}`,
        type: 'athlete',
        title: 'Assigned Athlete',
        message: `${a.name} (${a.sport || 'General'}) is in your roster`,
        dateStr: 'Active',
      });
    });

    workouts.slice(0, 5).forEach((w) => {
      const athleteName = athletes.find((a) => a.athlete_id === w.athlete_id)?.name || 'Athlete';
      activities.push({
        id: `workout-${w.workout_id}`,
        type: w.status === 'completed' ? 'completed' : 'workout',
        title: w.status === 'completed' ? 'Workout Completed' : 'Workout Assigned',
        message: `"${w.title}" → ${athleteName}`,
        dateStr: w.completed_at ? String(w.completed_at).substring(0, 10) : (w.date || 'Recent'),
      });
    });

    return activities.slice(0, 8);
  };

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

  const selectedAthlete = athletes.find((a) => a.athlete_id === newWorkoutAthleteId);
  const filteredDropdownAthletes = athletes.filter(
    (a) =>
      !athleteDropdownSearch ||
      a.name.toLowerCase().includes(athleteDropdownSearch.toLowerCase()) ||
      (a.sport && a.sport.toLowerCase().includes(athleteDropdownSearch.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.wrapper}>
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

            {/* Coach profile mini card */}
            <View style={[styles.sidebarProfile, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
              <View style={[styles.sidebarAvatar, { backgroundColor: colors.emeraldDim, borderColor: colors.borderEmerald }]}>
                <Text style={[styles.sidebarAvatarText, { color: colors.emerald }]}>
                  {user?.name?.charAt(0).toUpperCase() || 'C'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sidebarProfileName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {user?.name || 'Coach'}
                </Text>
                <Badge label="Coach" variant="success" />
              </View>
            </View>

            <View style={styles.sidebarNav}>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: 'grid', count: null },
                { id: 'athletes', label: 'My Athletes', icon: 'people', count: totalAthletes },
                { id: 'workouts', label: 'Workouts', icon: 'fitness', count: totalWorkouts },
                { id: 'performance', label: 'Performance', icon: 'speedometer', count: null },
              ].map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.sidebarItem,
                    activeTab === item.id && styles.sidebarItemActive,
                  ]}
                  onPress={() => {
                    setActiveTab(item.id as TabType);
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
                    <View
                      style={[
                        styles.sidebarBadge,
                        activeTab === item.id && styles.sidebarBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sidebarBadgeText,
                          activeTab === item.id && styles.sidebarBadgeTextActive,
                        ]}
                      >
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
                {activeTab === 'dashboard' && 'Coach Dashboard'}
                {activeTab === 'athletes' && 'My Athletes'}
                {activeTab === 'workouts' && 'Workout Plans'}
                {activeTab === 'performance' && 'Performance'}
              </Text>
              <Text style={styles.headerSubtitle}>{user?.email || 'Coach'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <ThemeToggle />
              <Pressable onPress={loadDashboardData} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          {/* Content Area */}
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
                <Text style={styles.loaderText}>Loading dashboard...</Text>
              </View>
            ) : error ? (
              <Card style={styles.section}>
                <View style={{ alignItems: 'center', padding: 24, gap: 16 }}>
                  <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                  <Button label="Retry" onPress={loadDashboardData} variant="primary" />
                </View>
              </Card>
            ) : (
              <>
                {/* ── DASHBOARD TAB ── */}
                {activeTab === 'dashboard' && (
                  <>
                    <OnboardingBanner
                      isVisible={!user?.profile_completed}
                      title="Welcome to AthliTech! 👋"
                      description="Your account has been created successfully. Complete your profile to unlock your full coaching experience."
                      buttonLabel="Complete Profile"
                      onAction={() => router.push('/complete-profile')}
                    />

                    {/* Stat Cards Row */}
                    <StatsGrid gap={16} style={{ marginBottom: 24 }}>
                      <StatsGridItem minWidth={300}>
                        <SummaryCard
                          title="Dashboard Summary"
                          iconName="stats-chart-outline"
                          metrics={[
                            { label: 'My Athletes', value: totalAthletes },
                            { label: 'Total Workouts', value: totalWorkouts },
                            { label: 'Completed', value: completedWorkouts },
                            { label: 'Completion Rate', value: completionRate, suffix: '%' },
                          ]}
                        />
                      </StatsGridItem>
                    </StatsGrid>

                    {/* Workout Overview + Quick Summary */}
                    <StatsGrid gap={16} style={{ marginBottom: 24 }}>
                      <StatsGridItem minWidth={300}>
                        <Card style={{ flex: 1, height: '100%' }}>
                          <View style={styles.metricHeader}>
                            <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>Workout Breakdown</Text>
                            <View style={[styles.iconWrapper, { backgroundColor: colors.infoDim }]}>
                              <Ionicons name="barbell-outline" size={20} color={colors.info} />
                            </View>
                          </View>
                          <View style={styles.derivedStatsContainer}>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>{totalWorkouts}</Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>Total</Text>
                            </View>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>{pendingWorkouts}</Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>Pending</Text>
                            </View>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>{completedWorkouts}</Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>Done</Text>
                            </View>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>{workouts.filter((w) => w.status === 'skipped').length}</Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>Skipped</Text>
                            </View>
                          </View>
                        </Card>
                      </StatsGridItem>

                      <StatsGridItem minWidth={300}>
                        <Card style={{ flex: 1, height: '100%' }}>
                          <View style={styles.metricHeader}>
                            <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>Athletes Overview</Text>
                            <View style={[styles.iconWrapper, { backgroundColor: colors.emeraldDim }]}>
                              <Ionicons name="people-outline" size={20} color={colors.emerald} />
                            </View>
                          </View>
                          <View style={styles.derivedStatsContainer}>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>{totalAthletes}</Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>Assigned</Text>
                            </View>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>
                                {athletes.filter((a) => a.sport).length}
                              </Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>With Sport</Text>
                            </View>
                          </View>
                        </Card>
                      </StatsGridItem>
                    </StatsGrid>

                    {/* Recent Activity */}
                    <Card style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 16 }]}>
                        Recent Activity
                      </Text>
                      <View style={styles.activityFeed}>
                        {getRecentActivity().length === 0 ? (
                          <Text style={[styles.emptyActivityText, { color: colors.textMuted }]}>
                            No recent activity recorded.
                          </Text>
                        ) : (
                          getRecentActivity().map((act) => {
                            let iconName = 'ellipse-outline';
                            let iconColor: string = colors.textSub;
                            let bgColor: string = colors.bgMid;

                            if (act.type === 'athlete') {
                              iconName = 'person-add-outline';
                              iconColor = colors.info;
                              bgColor = colors.infoDim;
                            } else if (act.type === 'completed') {
                              iconName = 'checkmark-done-circle-outline';
                              iconColor = colors.emerald;
                              bgColor = colors.emeraldDim;
                            } else if (act.type === 'workout') {
                              iconName = 'barbell-outline';
                              iconColor = colors.info;
                              bgColor = colors.infoDim;
                            }

                            return (
                              <View key={act.id} style={styles.activityRow}>
                                <View style={[styles.activityIconWrapper, { backgroundColor: bgColor }]}>
                                  <Ionicons name={iconName as any} size={16} color={iconColor} />
                                </View>
                                <View style={styles.activityContent}>
                                  <Text style={styles.activityTitleText}>{act.title}</Text>
                                  <Text style={styles.activityMsgText}>{act.message}</Text>
                                </View>
                                <Text style={styles.activityDateText}>{act.dateStr}</Text>
                              </View>
                            );
                          })
                        )}
                      </View>
                    </Card>

                    {/* Quick Actions */}
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
                      <StatsGrid gap={16} style={{ marginTop: 12 }}>
                        <StatsGridItem minWidth={240}>
                          <Pressable
                            style={styles.actionCard}
                            onPress={() => setActiveTab('athletes')}
                          >
                            <Ionicons name="people-circle" size={32} color={colors.info} />
                            <Text style={styles.actionCardTitle}>View Athletes</Text>
                            <Text style={styles.actionCardDesc}>
                              See all your assigned athletes and their profiles.
                            </Text>
                          </Pressable>
                        </StatsGridItem>

                        <StatsGridItem minWidth={240}>
                          <Pressable
                            style={styles.actionCard}
                            onPress={() => {
                              setActiveTab('workouts');
                              setShowCreateWorkoutModal(true);
                            }}
                          >
                            <Ionicons name="add-circle" size={32} color={colors.emerald} />
                            <Text style={styles.actionCardTitle}>Assign Workout</Text>
                            <Text style={styles.actionCardDesc}>
                              Create and assign a new workout plan to an athlete.
                            </Text>
                          </Pressable>
                        </StatsGridItem>

                        <StatsGridItem minWidth={240}>
                          <Pressable
                            style={styles.actionCard}
                            onPress={() => setActiveTab('performance')}
                          >
                            <Ionicons name="speedometer" size={32} color={colors.warning} />
                            <Text style={styles.actionCardTitle}>Track Performance</Text>
                            <Text style={styles.actionCardDesc}>
                              Record and review athlete performance metrics.
                            </Text>
                          </Pressable>
                        </StatsGridItem>
                      </StatsGrid>
                    </View>
                  </>
                )}

                {/* ── ATHLETES TAB ── */}
                {activeTab === 'athletes' && (
                  <Card style={styles.section}>
                    <View
                      style={[
                        styles.sectionHeader,
                        {
                          flexDirection: isLargeScreen ? 'row' : 'column',
                          alignItems: isLargeScreen ? 'center' : 'stretch',
                          gap: 12,
                          marginBottom: 20,
                        },
                      ]}
                    >
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        My Athletes ({filteredAthletes.length})
                      </Text>
                      <View style={{ width: isLargeScreen ? 300 : '100%' }}>
                        <SearchBar
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholder="Search by name or sport..."
                        />
                      </View>
                    </View>

                    {filteredAthletes.length === 0 ? (
                      <EmptyState
                        icon="people-outline"
                        title={searchQuery ? 'No athletes match your search' : 'No athletes assigned yet'}
                        description={searchQuery ? 'Try a different search term.' : 'Contact your admin to get athletes assigned.'}
                      />
                    ) : (
                      <CollectionGrid gap={16}>
                        {filteredAthletes.map((athlete) => (
                          <CollectionGridItem itemWidth={320} key={athlete.athlete_id}>
                            <Card
                              style={styles.athleteCard}
                            >
                              <View style={styles.athleteHeader}>
                                <View style={[styles.athleteAvatar, { backgroundColor: colors.infoDim, borderColor: 'rgba(14,165,233,0.2)' }]}>
                                  <Text style={[styles.avatarText, { color: colors.info }]}>
                                    {athlete.name?.charAt(0).toUpperCase() || 'A'}
                                  </Text>
                                </View>
                                <View style={styles.athleteInfo}>
                                  <Text style={[styles.athleteName, { color: colors.textPrimary }]}>
                                    {athlete.name}
                                  </Text>
                                  <Text style={[styles.athleteShortId, { color: colors.textMuted }]}>
                                    ID: {athlete.athlete_id.slice(-8)}
                                  </Text>
                                  <Text style={[styles.athleteEmail, { color: colors.textSub }]}>
                                    {athlete.sport || 'No sport specified'}
                                  </Text>
                                </View>
                              </View>
                              <View style={[styles.athleteFooter, { borderTopColor: colors.borderSubtle }]}>
                                <View style={{ gap: 4 }}>
                                  <Badge label="Athlete" variant="info" />
                                  {athlete.weight ? (
                                    <Text style={[{ fontSize: 12, color: colors.textSub, marginTop: 4 }]}>
                                      Weight: {athlete.weight} kg
                                    </Text>
                                  ) : null}
                                </View>
                                <Button
                                  label="View Profile"
                                  onPress={() => router.push(`/athlete-details?athleteId=${athlete.athlete_id}`)}
                                  variant="secondary"
                                  size="sm"
                                />
                              </View>
                            </Card>
                          </CollectionGridItem>
                        ))}
                      </CollectionGrid>
                    )}
                  </Card>
                )}

                {/* ── WORKOUTS TAB ── */}
                {activeTab === 'workouts' && (
                  <>
                    <Card style={styles.section}>
                      <View
                        style={[
                          styles.sectionHeader,
                          {
                            flexDirection: isLargeScreen ? 'row' : 'column',
                            alignItems: isLargeScreen ? 'center' : 'stretch',
                            gap: 12,
                            marginBottom: 20,
                          },
                        ]}
                      >
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                          Workout Plans ({workouts.length})
                        </Text>
                        <Button
                          label="Assign New Workout"
                          onPress={() => setShowCreateWorkoutModal(true)}
                          variant="primary"
                          size="sm"
                          prefix={<Ionicons name="add" size={16} color="#fff" />}
                        />
                      </View>

                      {workouts.length === 0 ? (
                        <EmptyState
                          icon="fitness-outline"
                          title="No workouts assigned yet"
                          description="Create a new workout plan and assign it to one of your athletes."
                          actionLabel="Assign Workout"
                          onActionPress={() => setShowCreateWorkoutModal(true)}
                        />
                      ) : (
                        <Table
                          headers={['Workout', 'Athlete', 'Date', 'Status', 'Actions']}
                          data={workouts}
                          renderRow={(item: Workout) => {
                            const athleteName = athletes.find((a) => a.athlete_id === item.athlete_id)?.name || 'Unknown';
                            return (
                              <React.Fragment key={item.workout_id}>
                                <View style={styles.tableCellMain}>
                                  <Text style={[styles.tableMainText, { color: colors.textPrimary }]}>
                                    {item.title}
                                  </Text>
                                  {item.description ? (
                                    <Text style={[styles.tableSubText, { color: colors.textSub }]} numberOfLines={1}>
                                      {item.description}
                                    </Text>
                                  ) : null}
                                </View>
                                <View style={styles.tableCell}>
                                  <Text style={[styles.tableCellText, { color: colors.textSub }]}>
                                    {athleteName}
                                  </Text>
                                </View>
                                <View style={styles.tableCell}>
                                  <Text style={[styles.tableCellText, { color: colors.textSub }]}>
                                    {item.date || '—'}
                                  </Text>
                                </View>
                                <View style={styles.tableCell}>
                                  <Badge
                                    label={item.status}
                                    variant={
                                      item.status === 'completed'
                                        ? 'success'
                                        : item.status === 'skipped'
                                        ? 'error'
                                        : 'warning'
                                    }
                                  />
                                </View>
                                <View style={styles.tableCellActions}>
                                  <Button
                                    label="Log Perf"
                                    onPress={() => {
                                      setSelectedWorkoutForPerf(item);
                                      setPerfSportEvent('');
                                      setPerfValue('');
                                      setPerfFeedback('');
                                    }}
                                    variant="secondary"
                                    size="sm"
                                  />
                                </View>
                              </React.Fragment>
                            );
                          }}
                        />
                      )}
                    </Card>

                    {/* Inline performance form for linked workout */}
                    {selectedWorkoutForPerf && (
                      <Card style={styles.section}>
                        <View style={[styles.sectionHeader, { marginBottom: 16 }]}>
                          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                            Log Performance for "{selectedWorkoutForPerf.title}"
                          </Text>
                          <Pressable onPress={() => setSelectedWorkoutForPerf(null)}>
                            <Ionicons name="close-circle-outline" size={24} color={colors.textSub} />
                          </Pressable>
                        </View>

                        {linkedPerfMessage && (
                          <Text
                            style={[
                              styles.formMessage,
                              { color: linkedPerfMessage.isError ? colors.error : colors.success, marginBottom: 12 },
                            ]}
                          >
                            {linkedPerfMessage.text}
                          </Text>
                        )}

                        <View style={styles.formFields}>
                          <TextInput
                            style={[styles.formInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                            placeholder="Sport / Event (e.g. 100m Sprint)"
                            placeholderTextColor={colors.textMuted}
                            value={perfSportEvent}
                            onChangeText={setPerfSportEvent}
                          />
                          <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TextInput
                              style={[styles.formInput, { flex: 1, color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                              placeholder="Value (e.g. 10.45)"
                              placeholderTextColor={colors.textMuted}
                              value={perfValue}
                              onChangeText={setPerfValue}
                              keyboardType="numeric"
                            />
                            <TextInput
                              style={[styles.formInput, { flex: 1, color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                              placeholder="Unit (e.g. seconds)"
                              placeholderTextColor={colors.textMuted}
                              value={perfUnit}
                              onChangeText={setPerfUnit}
                            />
                          </View>
                          <TextInput
                            style={[styles.formInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                            placeholder="Date (YYYY-MM-DD)"
                            placeholderTextColor={colors.textMuted}
                            value={perfLinkedDate}
                            onChangeText={setPerfLinkedDate}
                          />
                          <TextInput
                            style={[styles.formInput, styles.formTextArea, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                            placeholder="Coach feedback / remarks"
                            placeholderTextColor={colors.textMuted}
                            value={perfFeedback}
                            onChangeText={setPerfFeedback}
                            multiline
                            numberOfLines={3}
                          />
                          <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
                            <Button
                              label="Cancel"
                              onPress={() => setSelectedWorkoutForPerf(null)}
                              variant="secondary"
                            />
                            <Button
                              label={isSavingLinkedPerf ? 'Saving…' : 'Save Performance'}
                              onPress={handleCreateLinkedPerformance}
                              variant="primary"
                              disabled={isSavingLinkedPerf}
                            />
                          </View>
                        </View>
                      </Card>
                    )}
                  </>
                )}

                {/* ── PERFORMANCE TAB ── */}
                {activeTab === 'performance' && (
                  <>
                    {/* Athlete selector */}
                    <Card style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 16 }]}>
                        Select Athlete to Review
                      </Text>
                      {athletes.length === 0 ? (
                        <EmptyState
                          icon="people-outline"
                          title="No athletes assigned"
                          description="You need athletes assigned before you can track performance."
                        />
                      ) : (
                        <CollectionGrid gap={16}>
                          {athletes.map((athlete) => {
                            const isSelected = selectedAthleteForPerf?.athlete_id === athlete.athlete_id;
                            return (
                              <CollectionGridItem itemWidth={300} key={athlete.athlete_id}>
                                <Pressable
                                  onPress={() => {
                                    setSelectedAthleteForPerf(athlete);
                                    setShowCreatePerfModal(false);
                                  }}
                                  style={[
                                    styles.athleteSelectorCard,
                                    {
                                      backgroundColor: isSelected ? colors.emeraldDim : colors.bgCard,
                                      borderColor: isSelected ? colors.emerald : colors.border,
                                    },
                                  ]}
                                >
                                  <View style={[styles.athleteAvatar, { backgroundColor: isSelected ? colors.emerald : colors.infoDim, borderColor: isSelected ? colors.emerald : 'rgba(14,165,233,0.2)' }]}>
                                    <Text style={[styles.avatarText, { color: isSelected ? '#fff' : colors.info }]}>
                                      {athlete.name?.charAt(0).toUpperCase() || 'A'}
                                    </Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={[styles.athleteName, { color: colors.textPrimary }]}>
                                      {athlete.name}
                                    </Text>
                                    <Text style={[styles.athleteEmail, { color: colors.textSub }]}>
                                      {athlete.sport || 'General'}
                                    </Text>
                                  </View>
                                  {isSelected && (
                                    <Ionicons name="checkmark-circle" size={20} color={colors.emerald} />
                                  )}
                                </Pressable>
                              </CollectionGridItem>
                            );
                          })}
                        </CollectionGrid>
                      )}
                    </Card>

                    {selectedAthleteForPerf && (
                      <Card style={styles.section}>
                        <View
                          style={[
                            styles.sectionHeader,
                            {
                              flexDirection: isLargeScreen ? 'row' : 'column',
                              alignItems: isLargeScreen ? 'center' : 'stretch',
                              gap: 12,
                              marginBottom: 20,
                            },
                          ]}
                        >
                          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                            {selectedAthleteForPerf.name}'s Performance History
                          </Text>
                          <Button
                            label="Log New Performance"
                            onPress={() => setShowCreatePerfModal(true)}
                            variant="primary"
                            size="sm"
                            prefix={<Ionicons name="add" size={16} color="#fff" />}
                          />
                        </View>

                        {isPerfLoading ? (
                          <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.emerald} />
                            <Text style={[styles.loaderText, { marginTop: 12 }]}>Loading performance data…</Text>
                          </View>
                        ) : perfError ? (
                          <Text style={[styles.errorText, { color: colors.error }]}>{perfError}</Text>
                        ) : athletePerformances.length === 0 ? (
                          <EmptyState
                            icon="speedometer-outline"
                            title="No performance records yet"
                            description="Log the first performance entry for this athlete."
                            actionLabel="Log Performance"
                            onActionPress={() => setShowCreatePerfModal(true)}
                          />
                        ) : (
                          <Table
                            headers={['Event', 'Value', 'Date', 'Sprint Time', 'Remarks']}
                            data={athletePerformances}
                            renderRow={(item: PerformanceRecord) => {
                              const valStr = item.value !== undefined
                                ? `${item.value} ${item.unit || ''}`
                                : `${item.sprint_time || 0}s`;
                              return (
                                <React.Fragment key={item.performance_id}>
                                  <View style={styles.tableCellMain}>
                                    <Text style={[styles.tableMainText, { color: colors.textPrimary }]}>
                                      {item.sport_event || '100m Sprint'}
                                    </Text>
                                  </View>
                                  <View style={styles.tableCell}>
                                    <Badge label={valStr} variant="info" />
                                  </View>
                                  <View style={styles.tableCell}>
                                    <Text style={[styles.tableCellText, { color: colors.textSub }]}>
                                      {item.recorded_at || item.date || '—'}
                                    </Text>
                                  </View>
                                  <View style={styles.tableCell}>
                                    <Text style={[styles.tableCellText, { color: colors.textSub }]}>
                                      {item.sprint_time ? `${item.sprint_time}s` : '—'}
                                    </Text>
                                  </View>
                                  <View style={styles.tableCellMain}>
                                    <Text style={[styles.tableCellText, { color: colors.textSub }]} numberOfLines={2}>
                                      {item.feedback || item.coach_remarks || '—'}
                                    </Text>
                                  </View>
                                </React.Fragment>
                              );
                            }}
                          />
                        )}
                      </Card>
                    )}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>

      {/* ── CREATE WORKOUT MODAL ── */}
      <Modal
        visible={showCreateWorkoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateWorkoutModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCreateWorkoutModal(false)}
        >
          <Pressable
            style={[styles.modalMenu, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Assign Workout Plan</Text>
                <Pressable onPress={() => setShowCreateWorkoutModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textSub} />
                </Pressable>
              </View>

              {workoutFormMessage && (
                <Text style={[styles.formMessage, { color: workoutFormMessage.isError ? colors.error : colors.success }]}>
                  {workoutFormMessage.text}
                </Text>
              )}

              <View style={styles.formFields}>
                <TextInput
                  style={[styles.formInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  placeholder="Workout Title *"
                  placeholderTextColor={colors.textMuted}
                  value={newWorkoutTitle}
                  onChangeText={setNewWorkoutTitle}
                />
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  placeholder="Description (optional)"
                  placeholderTextColor={colors.textMuted}
                  value={newWorkoutDescription}
                  onChangeText={setNewWorkoutDescription}
                  multiline
                  numberOfLines={2}
                />
                <TextInput
                  style={[styles.formInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  placeholder="Target Date (YYYY-MM-DD) *"
                  placeholderTextColor={colors.textMuted}
                  value={newWorkoutDate}
                  onChangeText={setNewWorkoutDate}
                />

                {/* Athlete selector */}
                <Pressable
                  style={[styles.formInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  onPress={() => setShowAthleteDropdown(!showAthleteDropdown)}
                >
                  <Text style={{ color: selectedAthlete ? colors.textPrimary : colors.textMuted, fontSize: 14 }}>
                    {selectedAthlete ? `${selectedAthlete.name} (${selectedAthlete.sport || 'General'})` : 'Select Athlete *'}
                  </Text>
                  <Ionicons name={showAthleteDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSub} />
                </Pressable>

                {showAthleteDropdown && (
                  <View style={[styles.dropdownList, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.dropdownSearch, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                      placeholder="Search athlete..."
                      placeholderTextColor={colors.textMuted}
                      value={athleteDropdownSearch}
                      onChangeText={setAthleteDropdownSearch}
                    />
                    {filteredDropdownAthletes.map((a) => (
                      <Pressable
                        key={a.athlete_id}
                        style={[styles.dropdownItem, { borderBottomColor: colors.borderSubtle }]}
                        onPress={() => {
                          setNewWorkoutAthleteId(a.athlete_id);
                          setShowAthleteDropdown(false);
                          setAthleteDropdownSearch('');
                        }}
                      >
                        <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
                          {a.name}
                        </Text>
                        <Text style={{ color: colors.textSub, fontSize: 12 }}>
                          {a.sport || 'General'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Exercises */}
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Exercises</Text>
                {newWorkoutExercises.map((ex, idx) => (
                  <View key={idx} style={[styles.exerciseRow, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={[styles.exerciseLabel, { color: colors.textSub }]}>Exercise #{idx + 1}</Text>
                      {newWorkoutExercises.length > 1 && (
                        <Pressable onPress={() => setNewWorkoutExercises(newWorkoutExercises.filter((_, i) => i !== idx))}>
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                        </Pressable>
                      )}
                    </View>
                    <TextInput
                      style={[styles.formInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                      placeholder="Exercise name *"
                      placeholderTextColor={colors.textMuted}
                      value={ex.name}
                      onChangeText={(v) => {
                        const updated = [...newWorkoutExercises];
                        updated[idx] = { ...updated[idx], name: v };
                        setNewWorkoutExercises(updated);
                      }}
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        style={[styles.formInput, { flex: 1, minWidth: 0, color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                        placeholder="Sets"
                        placeholderTextColor={colors.textMuted}
                        value={String(ex.sets)}
                        onChangeText={(v) => {
                          const updated = [...newWorkoutExercises];
                          updated[idx] = { ...updated[idx], sets: parseInt(v) || 0 };
                          setNewWorkoutExercises(updated);
                        }}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[styles.formInput, { flex: 1, minWidth: 0, color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                        placeholder="Reps"
                        placeholderTextColor={colors.textMuted}
                        value={String(ex.reps)}
                        onChangeText={(v) => {
                          const updated = [...newWorkoutExercises];
                          updated[idx] = { ...updated[idx], reps: parseInt(v) || 0 };
                          setNewWorkoutExercises(updated);
                        }}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[styles.formInput, { flex: 1, minWidth: 0, color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                        placeholder="Duration"
                        placeholderTextColor={colors.textMuted}
                        value={ex.duration || ''}
                        onChangeText={(v) => {
                          const updated = [...newWorkoutExercises];
                          updated[idx] = { ...updated[idx], duration: v };
                          setNewWorkoutExercises(updated);
                        }}
                      />
                    </View>
                  </View>
                ))}

                <Button
                  label="+ Add Exercise"
                  onPress={() => setNewWorkoutExercises([...newWorkoutExercises, { name: '', sets: 3, reps: 10, duration: '' }])}
                  variant="secondary"
                  size="sm"
                />

                <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
                  <Button
                    label="Cancel"
                    onPress={() => setShowCreateWorkoutModal(false)}
                    variant="secondary"
                  />
                  <Button
                    label={isSavingWorkout ? 'Saving…' : 'Assign Workout'}
                    onPress={handleCreateWorkout}
                    variant="primary"
                    disabled={isSavingWorkout}
                  />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── LOG PERFORMANCE MODAL ── */}
      <Modal
        visible={showCreatePerfModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreatePerfModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCreatePerfModal(false)}
        >
          <Pressable
            style={[styles.modalMenu, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ padding: 24, gap: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Log Performance: {selectedAthleteForPerf?.name}
                </Text>
                <Pressable onPress={() => setShowCreatePerfModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textSub} />
                </Pressable>
              </View>

              {perfFormMessage && (
                <Text style={[styles.formMessage, { color: perfFormMessage.isError ? colors.error : colors.success }]}>
                  {perfFormMessage.text}
                </Text>
              )}

              <View style={styles.formFields}>
                <TextInput
                  style={[styles.formInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  placeholder="Sprint Time (seconds) *"
                  placeholderTextColor={colors.textMuted}
                  value={newSprintTime}
                  onChangeText={setNewSprintTime}
                  keyboardType="numeric"
                />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TextInput
                    style={[styles.formInput, { flex: 1, color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                    placeholder="Weight (kg) *"
                    placeholderTextColor={colors.textMuted}
                    value={newWeight}
                    onChangeText={setNewWeight}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 1, color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                    placeholder="Height (cm) *"
                    placeholderTextColor={colors.textMuted}
                    value={newHeight}
                    onChangeText={setNewHeight}
                    keyboardType="numeric"
                  />
                </View>
                <TextInput
                  style={[styles.formInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  placeholder="Date (YYYY-MM-DD)"
                  placeholderTextColor={colors.textMuted}
                  value={newPerfDate}
                  onChangeText={setNewPerfDate}
                />
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  placeholder="Coach remarks (optional)"
                  placeholderTextColor={colors.textMuted}
                  value={newPerfRemarks}
                  onChangeText={setNewPerfRemarks}
                  multiline
                  numberOfLines={3}
                />
                <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
                  <Button label="Cancel" onPress={() => setShowCreatePerfModal(false)} variant="secondary" />
                  <Button
                    label={isSavingPerf ? 'Saving…' : 'Save Performance'}
                    onPress={handleCreatePerformance}
                    variant="primary"
                    disabled={isSavingPerf}
                  />
                </View>
              </View>
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

    // ── Content Area ──
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

    // ── Sections ──
    section: {
      marginBottom: 32,
      width: '100%',
    },
    sectionHeader: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
    },

    // ── Activity Feed ──
    activityFeed: {
      gap: 12,
    },
    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
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
    activityDateText: {
      fontSize: 11,
      color: colors.textMuted,
    },
    emptyActivityText: {
      textAlign: 'center',
      fontSize: 14,
      paddingVertical: 20,
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

    // ── Athletes Grid ──
    athletesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      width: '100%',
    },
    athleteCard: {
      width: isLargeScreen ? '31%' : '100%',
      minWidth: 260,
    },
    athleteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    athleteAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '800',
    },
    athleteInfo: {
      flex: 1,
    },
    athleteName: {
      fontSize: 15,
      fontWeight: '700',
    },
    athleteShortId: {
      fontSize: 11,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      marginTop: 2,
    },
    athleteEmail: {
      fontSize: 13,
      marginTop: 2,
    },
    athleteFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      paddingTop: 12,
    },

    // ── Athlete Selector (Performance tab) ──
    athleteSelectorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      width: isLargeScreen ? '48%' : '100%',
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
    tableCellActions: {
      paddingHorizontal: 16,
      minWidth: 100,
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    tableMainText: {
      fontSize: 14,
      fontWeight: '700',
    },
    tableSubText: {
      fontSize: 12,
      marginTop: 2,
    },
    tableCellText: {
      fontSize: 13,
    },

    // ── Forms ──
    formFields: {
      gap: 12,
    },
    formInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      minWidth: 0,
    },
    formTextArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    formLabel: {
      fontSize: 13,
      fontWeight: '700',
      marginTop: 4,
    },
    formMessage: {
      fontSize: 13,
      fontWeight: '600',
    },
    exerciseRow: {
      borderRadius: 8,
      borderWidth: 1,
      padding: 12,
      gap: 8,
    },
    exerciseLabel: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    dropdownList: {
      borderWidth: 1,
      borderRadius: 8,
      overflow: 'hidden',
      maxHeight: 200,
    },
    dropdownSearch: {
      borderBottomWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 13,
    },
    dropdownItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      gap: 2,
    },

    // ── Modals ──
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalMenu: {
      width: Math.min(560, isWeb ? 560 : 400),
      maxHeight: '90%',
      borderRadius: 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
  });
}