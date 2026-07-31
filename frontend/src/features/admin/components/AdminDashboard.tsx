import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Modal,
} from 'react-native';

import type { Role, User, Athlete } from '@/api/admin';
import {
  createRole,
  deleteUser,
  fetchAllRoles,
  fetchAllUsers,
  updateUserRole,
  assignAthleteToCoach,
  fetchAllAthletes,
  removeAthleteCoachAssignment,
  updateRolePermissions,
  deleteRole,
} from '@/api/admin';
import type { AuthUser } from '@/api/auth';
import type { Workout } from '@/api/workout';
import { fetchAllWorkouts } from '@/api/workout';
import type { PerformanceRecord } from '@/api/performance';
import { fetchAllPerformances } from '@/api/performance';

import {
  Button,
  Input,
  Card,
  Badge,
  SummaryCard,
  SearchBar,
  Table,
  ThemeToggle,
  StatsGrid,
  StatsGridItem,
  CollectionGrid,
  CollectionGridItem,
  EmptyState,
} from '@/components/ui';
import { useThemeColors } from '@/styles/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AdminDashboardProps {
  user: AuthUser | null;
  token: string;
  onSignOut: () => void;
}

type TabType = 'dashboard' | 'users' | 'roles' | 'coaches' | 'athletes';

const isWeb = Platform.OS === 'web';

export default function AdminDashboard({ user, token, onSignOut }: AdminDashboardProps) {
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
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [performances, setPerformances] = useState<PerformanceRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Form states
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState('');
  const [roleFormMessage, setRoleFormMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Role Editing/Deleting state
  const [editingRoleName, setEditingRoleName] = useState<string | null>(null);
  const [editingRolePermissionsInput, setEditingRolePermissionsInput] = useState('');
  const [isSavingRolePermissions, setIsSavingRolePermissions] = useState(false);
  const [roleActionError, setRoleActionError] = useState<{ [roleName: string]: string }>({});

  // User Role Editing states
  const [updatingUserRoleMap, setUpdatingUserRoleMap] = useState<{ [userId: string]: string }>({});
  const [userRoleMessage, setUserRoleMessage] = useState<{ [userId: string]: { text: string; isError: boolean } }>({});
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [openDropdownUserId, setOpenDropdownUserId] = useState<string | null>(null);

  // Athlete Coach assignment states
  const [athletesData, setAthletesData] = useState<Athlete[]>([]);
  const [updatingAthleteCoachMap, setUpdatingAthleteCoachMap] = useState<{ [athleteId: string]: string }>({});
  const [athleteCoachMessage, setAthleteCoachMessage] = useState<{ [athleteId: string]: { text: string; isError: boolean } }>({});
  const [openCoachDropdownAthleteId, setOpenCoachDropdownAthleteId] = useState<string | null>(null);

  // Fetch data
  const loadDashboardData = useCallback(async () => {
    setIsLoadingData(true);
    setDashboardError(null);
    setIsUsingFallback(false);
    try {
      const [fetchedUsers, fetchedRoles, fetchedAthletes, fetchedWorkouts, fetchedPerformances] = await Promise.all([
        fetchAllUsers(token),
        fetchAllRoles(token),
        fetchAllAthletes(token).catch((e: any) => {
          console.warn('Failed to fetch athletes list:', e);
          return [];
        }),
        fetchAllWorkouts(token).catch((e: any) => {
          console.warn('Failed to fetch workouts list:', e);
          return [];
        }),
        fetchAllPerformances(token).catch((e: any) => {
          console.warn('Failed to fetch performances list:', e);
          return [];
        }),
      ]);
      setUsers(fetchedUsers);
      setRoles(fetchedRoles);
      setAthletesData(fetchedAthletes);
      setWorkouts(fetchedWorkouts);
      setPerformances(fetchedPerformances);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to load dashboard data.';
      console.warn('Backend API connection failed:', e);
      setDashboardError(message);
      setIsUsingFallback(true);
      // Local fallback mock data for testing
      setUsers([
        { id: '1', name: 'Admin User', email: 'admin@athlitech.com', role: 'admin' },
        { id: '2', name: 'Coach Smith', email: 'coach.smith@athlitech.com', role: 'coach' },
        { id: '3', name: 'Coach Davis', email: 'coach.davis@athlitech.com', role: 'coach' },
        { id: '4', name: 'Alex Johnson', email: 'alex@athlete.com', role: 'athlete' },
        { id: '5', name: 'Emma Wilson', email: 'emma@athlete.com', role: 'athlete' },
        { id: '6', name: 'Ryan Miller', email: 'ryan@athlete.com', role: 'athlete' },
      ]);
      setRoles([
        { id: 'r1', name: 'admin', permissions: ['read:all', 'write:all', 'delete:all'] },
        { id: 'r2', name: 'coach', permissions: ['read:athlete', 'write:workout', 'write:performance'] },
        { id: 'r3', name: 'athlete', permissions: ['read:workout', 'read:performance'] },
      ]);
      setAthletesData([
        { athlete_id: '4', name: 'Alex Johnson', sport: 'Sprinting', weight: '72', coach_id: '2' },
        { athlete_id: '5', name: 'Emma Wilson', sport: 'Sprinting', weight: '64', coach_id: '2' },
        { athlete_id: '6', name: 'Ryan Miller', sport: 'Hurdles', weight: '76', coach_id: '' },
      ]);
      setWorkouts([
        { workout_id: 'w1', athlete_id: '4', coach_id: 'c1', title: '100m Interval Sprints', status: 'completed', exercises: [], date: '2026-07-10', created_at: '2026-07-10', completed_at: '2026-07-10' },
        { workout_id: 'w2', athlete_id: '5', coach_id: 'c1', title: 'Start Block Acceleration', status: 'pending', exercises: [], date: '2026-07-14', created_at: '2026-07-14' },
      ]);
      setPerformances([
        { performance_id: 'p1', athlete_id: '4', coach_id: 'c1', sport_event: '100m Sprint', value: 10.45, unit: 's', recorded_at: '2026-07-10', created_at: '2026-07-10' },
      ]);
    } finally {
      setIsLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived counts from backend data
  const totalUsers = users.length;
  const totalCoaches = users.filter((u) => u.role.toLowerCase() === 'coach').length;
  const totalAthletes = users.filter((u) => u.role.toLowerCase() === 'athlete').length;
  const totalRoles = roles.length;
  const hasDashboardData = totalUsers > 0 || totalRoles > 0;
  const dashboardStatusMessage = isLoadingData
    ? 'Loading dashboard metrics from the backend...'
    : dashboardError
      ? 'Unable to load dashboard metrics (Running in Fallback Mode).'
      : hasDashboardData
        ? null
        : 'No dashboard data is available yet.';

  // Handlers
  const handleCreateRole = async () => {
    setRoleFormMessage(null);
    if (!newRoleName.trim()) {
      setRoleFormMessage({ text: 'Role name cannot be empty', isError: true });
      return;
    }

    setIsCreatingRole(true);
    try {
      const permsArray = newRolePermissions
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (isUsingFallback) {
        const newMockRole: Role = {
          id: `r_${Date.now()}`,
          name: newRoleName.trim().toLowerCase(),
          permissions: permsArray.length > 0 ? permsArray : ['read:default'],
        };
        setRoles([...roles, newMockRole]);
        setRoleFormMessage({ text: `Role "${newRoleName}" created locally (Fallback Mode)`, isError: false });
        setNewRoleName('');
        setNewRolePermissions('');
      } else {
        await createRole(token, newRoleName.trim().toLowerCase(), permsArray);
        setRoleFormMessage({ text: `Role "${newRoleName}" created successfully!`, isError: false });
        setNewRoleName('');
        setNewRolePermissions('');
        const fetchedRoles = await fetchAllRoles(token);
        setRoles(fetchedRoles);
      }
    } catch (e: any) {
      setRoleFormMessage({ text: e.message || 'Failed to create role', isError: true });
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleSaveRolePermissions = async (roleName: string) => {
    setRoleActionError((prev) => ({ ...prev, [roleName]: '' }));
    setIsSavingRolePermissions(true);
    try {
      const permsArray = editingRolePermissionsInput
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (isUsingFallback) {
        setRoles((prevRoles) =>
          prevRoles.map((r) => (r.name === roleName ? { ...r, permissions: permsArray } : r))
        );
        setEditingRoleName(null);
      } else {
        await updateRolePermissions(token, roleName, permsArray);
        const fetchedRoles = await fetchAllRoles(token);
        setRoles(fetchedRoles);
        setEditingRoleName(null);
      }
    } catch (e: any) {
      setRoleActionError((prev) => ({ ...prev, [roleName]: e.message || 'Failed to update permissions' }));
    } finally {
      setIsSavingRolePermissions(false);
    }
  };

  const handleDeleteRoleClick = async (roleName: string) => {
    setRoleActionError((prev) => ({ ...prev, [roleName]: '' }));
    
    const confirmDel = window.confirm(`Are you sure you want to delete custom role "${roleName.toUpperCase()}"?`);
    if (!confirmDel) return;

    try {
      if (isUsingFallback) {
        setRoles((prevRoles) => prevRoles.filter((r) => r.name !== roleName));
      } else {
        await deleteRole(token, roleName);
        const fetchedRoles = await fetchAllRoles(token);
        setRoles(fetchedRoles);
      }
    } catch (e: any) {
      setRoleActionError((prev) => ({ ...prev, [roleName]: e.message || 'Failed to delete role' }));
    }
  };

  const handleUpdateUserRole = async (userId: string) => {
    const targetRole = updatingUserRoleMap[userId];
    if (!targetRole) return;

    setUserRoleMessage((prev) => ({ ...prev, [userId]: { text: '', isError: false } }));

    try {
      if (isUsingFallback) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
        );
        setUserRoleMessage((prev) => ({
          ...prev,
          [userId]: { text: 'Updated role locally (Fallback Mode)', isError: false },
        }));
      } else {
        await updateUserRole(token, userId, targetRole);
        setUserRoleMessage((prev) => ({
          ...prev,
          [userId]: { text: 'Role updated successfully!', isError: false },
        }));
        const fetchedUsers = await fetchAllUsers(token);
        setUsers(fetchedUsers);
      }
    } catch (e: any) {
      setUserRoleMessage((prev) => ({
        ...prev,
        [userId]: { text: e.message || 'Failed to update role', isError: true },
      }));
    }
  };

  const handleDeletePress = (targetUser: User) => {
    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete user "${targetUser.name}"? This action cannot be undone.`
      );
      if (confirmDelete) {
        executeDeleteUser(targetUser.id);
      }
    } else {
      Alert.alert(
        'Delete User',
        `Are you sure you want to delete user "${targetUser.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => executeDeleteUser(targetUser.id) },
        ]
      );
    }
  };

  const executeDeleteUser = async (userId: string) => {
    setUserRoleMessage((prev) => ({ ...prev, [userId]: { text: 'Deleting...', isError: false } }));
    try {
      if (isUsingFallback) {
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
        setUserRoleMessage((prev) => ({
          ...prev,
          [userId]: { text: 'User deleted locally (Fallback Mode)', isError: false },
        }));
      } else {
        await deleteUser(token, userId);
        const fetchedUsers = await fetchAllUsers(token);
        setUsers(fetchedUsers);
      }
    } catch (e: any) {
      setUserRoleMessage((prev) => ({
        ...prev,
        [userId]: { text: e.message || 'Failed to delete user', isError: true },
      }));
    }
  };

  const handleAssignCoach = async (athleteId: string, coachId: string) => {
    setAthleteCoachMessage((prev) => ({ ...prev, [athleteId]: { text: 'Saving...', isError: false } }));
    try {
      if (isUsingFallback) {
        setAthletesData((prevAthletes) => {
          const exists = prevAthletes.some((a) => a.athlete_id === athleteId);
          if (exists) {
            return prevAthletes.map((a) => (a.athlete_id === athleteId ? { ...a, coach_id: coachId } : a));
          } else {
            return [...prevAthletes, { athlete_id: athleteId, name: '', sport: 'Sprinting', weight: '70', coach_id: coachId }];
          }
        });
        setAthleteCoachMessage((prev) => ({
          ...prev,
          [athleteId]: { text: 'Coach assigned locally (Fallback Mode)', isError: false },
        }));
      } else {
        await assignAthleteToCoach(token, athleteId, coachId);
        setAthleteCoachMessage((prev) => ({
          ...prev,
          [athleteId]: { text: 'Coach assigned successfully!', isError: false },
        }));
        const fetchedAthletes = await fetchAllAthletes(token);
        setAthletesData(fetchedAthletes);
      }
    } catch (e: any) {
      setAthleteCoachMessage((prev) => ({
        ...prev,
        [athleteId]: { text: e.message || 'Failed to assign coach', isError: true },
      }));
    }
  };

  const handleRemoveCoachAssignment = async (athleteId: string) => {
    setAthleteCoachMessage((prev) => ({ ...prev, [athleteId]: { text: 'Removing assignment...', isError: false } }));
    try {
      if (isUsingFallback) {
        setAthletesData((prevAthletes) => {
          return prevAthletes.map((a) => (a.athlete_id === athleteId ? { ...a, coach_id: '' } : a));
        });
        setAthleteCoachMessage((prev) => ({
          ...prev,
          [athleteId]: { text: 'Coach assignment removed locally (Fallback Mode)', isError: false },
        }));
      } else {
        await removeAthleteCoachAssignment(token, athleteId);
        setAthleteCoachMessage((prev) => ({
          ...prev,
          [athleteId]: { text: 'Coach assignment removed successfully!', isError: false },
        }));
        setUpdatingAthleteCoachMap((prev) => ({
          ...prev,
          [athleteId]: '',
        }));
        const fetchedAthletes = await fetchAllAthletes(token);
        setAthletesData(fetchedAthletes);
      }
    } catch (e: any) {
      setAthleteCoachMessage((prev) => ({
        ...prev,
        [athleteId]: { text: e.message || 'Failed to remove coach assignment', isError: true },
      }));
    }
  };

  const getRecentActivities = () => {
    const activities: { id: string; type: string; title: string; message: string; dateStr: string; timestamp: number }[] = [];

    const getTimestamp = (dateStr?: string) => {
      if (!dateStr) return 0;
      const parsed = Date.parse(dateStr);
      return isNaN(parsed) ? 0 : parsed;
    };

    // 1. Registrations
    users.forEach((u) => {
      let timestamp = 0;
      let dateStr = 'Recent';
      if (u.id && u.id.length === 24) {
        const time = parseInt(u.id.substring(0, 8), 16) * 1000;
        timestamp = time;
        dateStr = new Date(time).toLocaleDateString();
      }
      activities.push({
        id: `reg-${u.id}`,
        type: 'registration',
        title: 'New Registration',
        message: `${u.name} (${u.email}) joined as ${u.role.toUpperCase()}`,
        dateStr,
        timestamp,
      });
    });

    // 2. Coach Assignments
    athletesData.forEach((a) => {
      if (a.coach_id) {
        const coachUser = users.find((u) => u.coach_id === a.coach_id || u.id === a.coach_id);
        const coachName = coachUser ? coachUser.name : 'Unknown Coach';
        activities.push({
          id: `assign-${a.athlete_id}`,
          type: 'assignment',
          title: 'Coach Assignment',
          message: `Athlete ${a.name} assigned to Coach ${coachName}`,
          dateStr: 'Recent',
          timestamp: 0,
        });
      }
    });

    // 3. Workout Assignments & 4. Workout Completions
    workouts.forEach((w) => {
      const athleteUser = users.find((u) => u.id === w.athlete_id);
      const athleteName = athleteUser ? athleteUser.name : 'Unknown Athlete';
      const wDate = w.created_at || w.date;
      activities.push({
        id: `workout-${w.workout_id}`,
        type: 'workout_assign',
        title: 'Workout Assigned',
        message: `Workout plan "${w.title}" assigned to ${athleteName}`,
        dateStr: w.date || 'Recent',
        timestamp: getTimestamp(wDate),
      });

      if (w.status === 'completed') {
        const compDate = w.completed_at || w.date;
        activities.push({
          id: `comp-${w.workout_id}`,
          type: 'workout_comp',
          title: 'Workout Completed',
          message: `Athlete ${athleteName} completed "${w.title}" (${w.completion_percentage ?? 100}%)`,
          dateStr: w.completed_at ? String(w.completed_at).substring(0, 10) : 'Recent',
          timestamp: getTimestamp(compDate),
        });
      }
    });

    // 5. Performance Entries
    performances.forEach((p) => {
      const athleteUser = users.find((u) => u.id === p.athlete_id);
      const athleteName = athleteUser ? athleteUser.name : 'Unknown Athlete';
      const pDate = p.recorded_at || p.date || p.created_at;
      const eventName = p.sport_event || 'Sprint';
      const valStr = p.value !== undefined ? `${p.value} ${p.unit || ''}` : `${p.sprint_time || 0}s`;
      activities.push({
        id: `perf-${p.performance_id}`,
        type: 'performance',
        title: 'Performance Logged',
        message: `Metrics updated for ${athleteName}: ${eventName} (${valStr})`,
        dateStr: p.recorded_at || p.date || 'Recent',
        timestamp: getTimestamp(pDate),
      });
    });

    return activities
      .sort((a, b) => {
        if (b.timestamp !== a.timestamp) {
          return b.timestamp - a.timestamp;
        }
        return b.message.localeCompare(a.message);
      })
      .slice(0, 8);
  };

  // Filter users by search query
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const coachesList = users.filter((u) => u.role.toLowerCase() === 'coach');
  const athletesList = users.filter((u) => u.role.toLowerCase() === 'athlete');

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.mainContainer}>
        {/* Sidebar */}
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

            <View style={styles.sidebarNav}>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: 'grid', count: null },
                { id: 'users', label: 'Users', icon: 'people', count: totalUsers },
                { id: 'roles', label: 'Roles', icon: 'shield', count: totalRoles },
                { id: 'coaches', label: 'Coaches', icon: 'fitness', count: totalCoaches },
                { id: 'athletes', label: 'Athletes', icon: 'walk', count: totalAthletes },
              ].map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.sidebarItem,
                    activeTab === item.id && styles.sidebarItemActive,
                  ]}
                  onPress={() => {
                    setActiveTab(item.id as TabType);
                    if (!isLargeScreen) {
                      setSidebarOpen(false);
                    }
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

        {/* Main Content */}
        <View style={styles.contentArea}>
          {/* Header */}
          <View style={styles.header}>
            {(!isLargeScreen || !sidebarOpen) && (
              <Pressable
                onPress={() => setSidebarOpen(!sidebarOpen)}
                style={styles.hamburgerBtn}
              >
                <Ionicons name="menu" size={24} color={colors.textPrimary} />
              </Pressable>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'roles' && 'Role Management'}
                {activeTab === 'coaches' && 'Coaches'}
                {activeTab === 'athletes' && 'Athletes'}
              </Text>
              <Text style={styles.headerSubtitle}>{user?.email || 'Admin'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <ThemeToggle />
              <Pressable onPress={loadDashboardData} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.contentInner,
              { padding: isWeb || isLargeScreen ? 24 : 16 },
            ]}
          >
            {isLoadingData ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.emerald} />
                <Text style={styles.loaderText}>Loading dashboard...</Text>
              </View>
            ) : (
              <>
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                  <>
                    {/* Stat Cards Row */}
                    <StatsGrid gap={16} style={{ marginBottom: 24 }}>
                      <StatsGridItem minWidth={300}>
                        <SummaryCard
                          title="Dashboard Summary"
                          iconName="stats-chart-outline"
                          metrics={[
                            { label: 'Total Users', value: totalUsers },
                            { label: 'Coaches', value: totalCoaches },
                            { label: 'Athletes', value: totalAthletes },
                            { label: 'Roles', value: totalRoles },
                          ]}
                        />
                      </StatsGridItem>
                    </StatsGrid>

                    {/* Additional Summary Cards */}
                    <StatsGrid gap={16} style={{ marginBottom: 24 }}>
                      {/* Workouts Overview Card */}
                      <StatsGridItem minWidth={300}>
                        <Card style={{ flex: 1, height: '100%' }}>
                          <View style={styles.metricHeader}>
                            <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>Workouts Overview</Text>
                            <View style={[styles.iconWrapper, { backgroundColor: colors.infoDim }]}>
                              <Ionicons name="barbell-outline" size={20} color={colors.info} />
                            </View>
                          </View>
                          <View style={styles.derivedStatsContainer}>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>{workouts.length}</Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>Total</Text>
                            </View>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>{workouts.filter(w => w.status === 'pending').length}</Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>Pending</Text>
                            </View>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>{workouts.filter(w => w.status === 'completed').length}</Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>Completed</Text>
                            </View>
                          </View>
                        </Card>
                      </StatsGridItem>

                      {/* Roles & System Status */}
                      <StatsGridItem minWidth={300}>
                        <Card style={{ flex: 1, height: '100%' }}>
                          <View style={styles.metricHeader}>
                            <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>Performance & Assignments</Text>
                            <View style={[styles.iconWrapper, { backgroundColor: colors.emeraldDim }]}>
                              <Ionicons name="speedometer-outline" size={20} color={colors.emerald} />
                            </View>
                          </View>
                          <View style={styles.derivedStatsContainer}>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>{performances.length}</Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>Perf. Records</Text>
                            </View>
                            <View style={styles.derivedStatBox}>
                              <Text style={[styles.derivedStatVal, { color: colors.textPrimary }]}>{athletesData.filter(a => !!a.coach_id).length}</Text>
                              <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>Active Assignments</Text>
                            </View>
                          </View>
                        </Card>
                      </StatsGridItem>
                    </StatsGrid>

                    {/* Recent Activity Section */}
                    <Card style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 16 }]}>Recent Activity</Text>
                      <View style={styles.activityFeed}>
                        {getRecentActivities().length === 0 ? (
                          <Text style={styles.emptyActivityText}>No recent activity recorded.</Text>
                        ) : (
                          getRecentActivities().map((act) => {
                            let iconName = 'ellipse-outline';
                            let iconColor = colors.textSub;
                            let bgColor = colors.bgMid;

                            if (act.type === 'registration') {
                              iconName = 'person-add-outline';
                              iconColor = colors.info;
                              bgColor = colors.infoDim;
                            } else if (act.type === 'assignment') {
                              iconName = 'people-outline';
                              iconColor = colors.emerald;
                              bgColor = colors.emeraldDim;
                            } else if (act.type === 'workout_assign') {
                              iconName = 'barbell-outline';
                              iconColor = colors.emerald;
                              bgColor = colors.emeraldDim;
                            } else if (act.type === 'workout_comp') {
                              iconName = 'checkmark-done-circle-outline';
                              iconColor = colors.emerald;
                              bgColor = colors.emeraldDim;
                            } else if (act.type === 'performance') {
                              iconName = 'speedometer-outline';
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

                    {dashboardStatusMessage ? (
                      <View style={styles.statusCard}>
                        <Text
                          style={[
                            styles.statusText,
                            { color: colors.textPrimary },
                            dashboardError ? { color: colors.error, fontWeight: '600' } : null,
                          ]}
                        >
                          {dashboardStatusMessage}
                        </Text>
                      </View>
                    ) : null}

                    {/* Quick Actions */}
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
                      <StatsGrid gap={16} style={{ marginTop: 12 }}>
                        <StatsGridItem minWidth={260}>
                          <Pressable
                            style={styles.actionCard}
                            onPress={() => setActiveTab('users')}
                          >
                            <Ionicons name="people-circle" size={32} color={colors.info} />
                            <Text style={styles.actionCardTitle}>Manage Users</Text>
                            <Text style={styles.actionCardDesc}>
                              Review and manage user accounts and roles.
                            </Text>
                          </Pressable>
                        </StatsGridItem>

                        <StatsGridItem minWidth={260}>
                          <Pressable
                            style={styles.actionCard}
                            onPress={() => setActiveTab('roles')}
                          >
                            <Ionicons name="shield-checkmark" size={32} color={colors.emerald} />
                            <Text style={styles.actionCardTitle}>Manage Roles</Text>
                            <Text style={styles.actionCardDesc}>
                              Create and configure system roles.
                            </Text>
                          </Pressable>
                        </StatsGridItem>
                      </StatsGrid>
                    </View>
                  </>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
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
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>User Registry ({filteredUsers.length})</Text>
                      <View style={{ width: isLargeScreen ? 300 : '100%' }}>
                        <SearchBar
                          value={userSearchQuery}
                          onChangeText={setUserSearchQuery}
                          placeholder="Search name, email, or role..."
                        />
                      </View>
                    </View>

                    <Table
                      headers={['User Details', 'User ID', 'Role', 'Role Assigner', 'Actions']}
                      data={filteredUsers}
                      renderRow={(item: User, index: number) => {
                        const selectedRole = updatingUserRoleMap[item.id] || item.role;
                        const message = userRoleMessage[item.id];
                        const isSelf = item.id === user?.id || item.email === user?.email;

                        return (
                          <React.Fragment key={item.id}>
                            {/* User details */}
                            <View style={styles.tableCellUser}>
                              <Text style={[styles.userNameText, { color: colors.textPrimary }]}>{item.name}</Text>
                              <Text style={[styles.userEmailText, { color: colors.textSub }]}>{item.email}</Text>
                              {message && (
                                <Text
                                  style={[
                                    styles.userItemMessage,
                                    { color: message.isError ? colors.error : colors.success, marginTop: 4 }
                                  ]}
                                >
                                  {message.text}
                                </Text>
                              )}
                            </View>

                            {/* ID */}
                            <View style={styles.tableCellId}>
                              <Text style={[styles.cellText, { color: colors.textSub }]}>{item.id}</Text>
                            </View>

                            {/* Current Role */}
                            <View style={styles.tableCellBadge}>
                              <Badge
                                label={item.role}
                                variant={
                                  item.role === 'admin'
                                    ? 'error'
                                    : item.role === 'coach'
                                    ? 'success'
                                    : item.role === 'athlete'
                                    ? 'info'
                                    : 'neutral'
                                }
                              />
                            </View>

                            {/* Dropdown Role assigner */}
                            <View style={styles.tableCellDropdown}>
                              {isSelf ? (
                                <Text style={[styles.currentUserRoleText, { color: colors.textMuted }]}>ADMIN (Self)</Text>
                              ) : (
                                <View style={styles.dropdownContainer}>
                                  <Pressable
                                    style={[styles.dropdownButton, { backgroundColor: colors.bgMid, borderColor: colors.border }]}
                                    onPress={() =>
                                      setOpenDropdownUserId(
                                        openDropdownUserId === item.id ? null : item.id
                                      )
                                    }
                                  >
                                    <Text style={[styles.dropdownButtonText, { color: colors.textPrimary }]}>
                                      {selectedRole.toUpperCase()}
                                    </Text>
                                    <Ionicons
                                      name={openDropdownUserId === item.id ? 'chevron-up' : 'chevron-down'}
                                      size={16}
                                      color={colors.textSub}
                                    />
                                  </Pressable>

                                  {openDropdownUserId === item.id && (
                                    <Modal
                                      transparent
                                      visible={true}
                                      animationType="fade"
                                      onRequestClose={() => setOpenDropdownUserId(null)}
                                    >
                                      <Pressable
                                        style={styles.modalOverlay}
                                        onPress={() => setOpenDropdownUserId(null)}
                                      >
                                        <View
                                          style={[
                                            styles.modalMenu,
                                            { backgroundColor: colors.bgCard, borderColor: colors.border }
                                          ]}
                                        >
                                          <Text style={[styles.modalHeader, { color: colors.textSub, borderBottomColor: colors.border }]}>
                                            Change Role: {item.name}
                                          </Text>
                                          {roles.map((r) => (
                                            <Pressable
                                              key={r.name}
                                              style={[
                                                styles.modalItem,
                                                selectedRole === r.name && { backgroundColor: colors.bgMid },
                                              ]}
                                              onPress={() => {
                                                setUpdatingUserRoleMap((prev) => ({
                                                  ...prev,
                                                  [item.id]: r.name,
                                                }));
                                                setOpenDropdownUserId(null);
                                              }}
                                            >
                                              <Text
                                                style={[
                                                  styles.modalItemText,
                                                  { color: selectedRole === r.name ? colors.emerald : colors.textPrimary, flex: 1 },
                                                ]}
                                              >
                                                {r.name.toUpperCase()}
                                              </Text>
                                              {selectedRole === r.name && (
                                                <Ionicons name="checkmark" size={16} color={colors.emerald} />
                                              )}
                                            </Pressable>
                                          ))}
                                        </View>
                                      </Pressable>
                                    </Modal>
                                  )}
                                </View>
                              )}
                            </View>

                            {/* Actions */}
                            <View style={styles.tableCellActions}>
                              <Button
                                label=""
                                onPress={() => {
                                  if (item.role === 'coach') {
                                    router.push(`/coach-details?coachId=${item.id}`);
                                  } else {
                                    router.push(`/athlete-details?athleteId=${item.id}`);
                                  }
                                }}
                                variant="secondary"
                                size="sm"
                                prefix={<Ionicons name="eye-outline" size={16} color={colors.textPrimary} />}
                                style={{ width: 36, height: 34, paddingHorizontal: 0, justifyContent: 'center', marginRight: 6 }}
                              />
                              {!isSelf && selectedRole !== item.role && (
                                <Button
                                  label="Apply"
                                  onPress={() => handleUpdateUserRole(item.id)}
                                  variant="primary"
                                  size="sm"
                                  style={{ height: 34, justifyContent: 'center', marginRight: 6 }}
                                />
                              )}
                              {!isSelf && (
                                <Button
                                  label=""
                                  onPress={() => handleDeletePress(item)}
                                  variant="danger"
                                  size="sm"
                                  prefix={<Ionicons name="trash-outline" size={16} color="#fff" />}
                                  style={{ width: 36, height: 34, paddingHorizontal: 0, justifyContent: 'center' }}
                                />
                              )}
                            </View>
                          </React.Fragment>
                        );
                      }}
                    />
                  </Card>
                )}

                {/* Roles Tab */}
                {activeTab === 'roles' && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 16 }]}>System Roles</Text>
                    <View style={styles.rolesGrid}>
                      {roles.map((r) => {
                        const isDefault = ['admin', 'coach', 'athlete'].includes(r.name.toLowerCase());
                        const isEditing = editingRoleName === r.name;

                        return (
                          <Card key={r.name} style={styles.roleDetailCard}>
                            <View style={styles.roleHeaderRow}>
                              <View style={styles.roleBadgeHeader}>
                                <Ionicons name="shield-checkmark" size={16} color={isDefault ? colors.emerald : colors.textSub} />
                                <Text style={[styles.roleTitle, { color: colors.textPrimary }]}>{r.name.toUpperCase()}</Text>
                              </View>
                              {isDefault && (
                                <Badge label="System Default" variant="neutral" />
                              )}
                            </View>

                            {roleActionError[r.name] ? (
                              <Text style={[styles.roleActionErrorText, { color: colors.error }]}>{roleActionError[r.name]}</Text>
                            ) : null}

                            {isEditing ? (
                              <View style={styles.editPermissionsForm}>
                                <Input
                                  value={editingRolePermissionsInput}
                                  onChangeText={setEditingRolePermissionsInput}
                                  placeholder="e.g. read:stats, write:stats"
                                />
                                <View style={styles.editActionRow}>
                                  <Button
                                    label={isSavingRolePermissions ? 'Saving...' : 'Save'}
                                    onPress={() => handleSaveRolePermissions(r.name)}
                                    disabled={isSavingRolePermissions}
                                    size="sm"
                                  />
                                  <Button
                                    label="Cancel"
                                    onPress={() => setEditingRoleName(null)}
                                    variant="ghost"
                                    size="sm"
                                  />
                                </View>
                              </View>
                            ) : (
                              <>
                                <View style={styles.permissionsContainer}>
                                  {r.permissions.length === 0 ? (
                                    <Text style={[styles.noPermissionsText, { color: colors.textMuted }]}>No permissions assigned</Text>
                                  ) : (
                                    r.permissions.map((p) => (
                                      <Badge key={p} label={p} variant="neutral" style={{ marginRight: 6, marginBottom: 6 }} />
                                    ))
                                  )}
                                </View>

                                {!isDefault && (
                                  <View style={styles.roleActionButtonsRow}>
                                    <Button
                                      label="Edit"
                                      onPress={() => {
                                        setEditingRoleName(r.name);
                                        setEditingRolePermissionsInput(r.permissions.join(', '));
                                      }}
                                      variant="secondary"
                                      size="sm"
                                      prefix={<Ionicons name="create-outline" size={14} color={colors.textPrimary} />}
                                    />
                                    <Button
                                      label="Delete"
                                      onPress={() => handleDeleteRoleClick(r.name)}
                                      variant="danger"
                                      size="sm"
                                      prefix={<Ionicons name="trash-outline" size={14} color={colors.error} />}
                                    />
                                  </View>
                                )}
                              </>
                            )}
                          </Card>
                        );
                      })}
                    </View>

                    <Card style={styles.formCard}>
                      <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Create Custom Role</Text>
                      {roleFormMessage && (
                        <Text
                          style={[
                            styles.formMessage,
                            { color: roleFormMessage.isError ? colors.error : colors.success, marginBottom: 12 },
                          ]}
                        >
                          {roleFormMessage.text}
                        </Text>
                      )}

                      <View style={styles.formFields}>
                        <Input
                          label="Role Name"
                          value={newRoleName}
                          onChangeText={setNewRoleName}
                          placeholder="e.g. manager"
                          autoCapitalize="none"
                        />

                        <Input
                          label="Permissions (comma-separated)"
                          value={newRolePermissions}
                          onChangeText={setNewRolePermissions}
                          placeholder="e.g. read:reports, write:reports"
                          autoCapitalize="none"
                        />

                        <Button
                          label="Create Custom Role"
                          onPress={handleCreateRole}
                          loading={isCreatingRole}
                          variant="primary"
                        />
                      </View>
                    </Card>
                  </View>
                )}

                {/* Coaches Tab */}
                {activeTab === 'coaches' && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 16 }]}>
                      Coaches ({coachesList.length})
                    </Text>
                    {coachesList.length === 0 ? (
                      <EmptyState
                        icon="fitness-outline"
                        title="No coaches registered yet"
                        description="New coaches will appear here once registered."
                      />
                    ) : (
                      <StatsGrid gap={16}>
                        {coachesList.map((coach) => (
                          <StatsGridItem minWidth={280} key={coach.id}>
                            <Card
                              style={{
                                flex: 1,
                                padding: 16,
                                justifyContent: 'space-between',
                                borderColor: colors.border,
                              }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <View
                                  style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: colors.emeraldDim,
                                    borderColor: 'rgba(16,185,129,0.3)',
                                    borderWidth: 1,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.emerald }}>
                                    {coach.name.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                                    {coach.name}
                                  </Text>
                                  <Text style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }} numberOfLines={1}>
                                    {coach.email}
                                  </Text>
                                </View>
                              </View>

                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: colors.borderSubtle, paddingTop: 12, marginTop: 8 }}>
                                <Badge label="Coach" variant="success" />
                                <Button
                                  label="View Profile"
                                  onPress={() => router.push(`/coach-details?coachId=${coach.id}`)}
                                  variant="secondary"
                                  size="sm"
                                  style={{ height: 34, justifyContent: 'center' }}
                                />
                              </View>
                            </Card>
                          </StatsGridItem>
                        ))}
                      </StatsGrid>
                    )}
                  </View>
                )}

                {/* Athletes Tab */}
                {activeTab === 'athletes' && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 16 }]}>
                      Athletes ({athletesList.length})
                    </Text>
                    {athletesList.length === 0 ? (
                      <EmptyState
                        icon="walk-outline"
                        title="No athletes registered yet"
                        description="New athletes will appear here once registered."
                      />
                    ) : (
                      <StatsGrid gap={16}>
                        {athletesList.map((athlete) => {
                          const athleteDoc = athletesData.find((a) => a.athlete_id === athlete.id);
                          const currentCoachId = athleteDoc?.coach_id;
                          const currentCoach = coachesList.find(
                            (c) => c.coach_id === currentCoachId || c.id === currentCoachId
                          );
                          const selectedCoachId = updatingAthleteCoachMap[athlete.id] !== undefined
                            ? updatingAthleteCoachMap[athlete.id]
                            : currentCoachId || '';
                          const selectedCoach = coachesList.find(
                            (c) => c.coach_id === selectedCoachId || c.id === selectedCoachId
                          );
                          const message = athleteCoachMessage[athlete.id];

                          return (
                            <StatsGridItem minWidth={280} key={athlete.id}>
                              <Card
                                style={{
                                  flex: 1,
                                  padding: 16,
                                  justifyContent: 'space-between',
                                  borderColor: colors.border,
                                }}
                              >
                                {/* Top Header */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                  <View
                                    style={{
                                      width: 44,
                                      height: 44,
                                      borderRadius: 22,
                                      backgroundColor: colors.infoDim,
                                      borderColor: 'rgba(14,165,233,0.3)',
                                      borderWidth: 1,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.info }}>
                                      {athlete.name.charAt(0).toUpperCase()}
                                    </Text>
                                  </View>
                                  <View style={{ flex: 1, justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                                      {athlete.name}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }} numberOfLines={1}>
                                      {athlete.email}
                                    </Text>
                                  </View>
                                </View>

                                {/* Coach Assignment Section */}
                                <View
                                  style={{
                                    paddingVertical: 10,
                                    borderTopWidth: 1,
                                    borderBottomWidth: 1,
                                    borderColor: colors.borderSubtle,
                                    marginVertical: 4,
                                    gap: 8,
                                  }}
                                >
                                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>
                                    Current Coach: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{currentCoach ? currentCoach.name : 'None'}</Text>
                                  </Text>

                                  <View style={{ width: '100%' }}>
                                    <Pressable
                                      style={[styles.dropdownButton, { backgroundColor: colors.bgMid, borderColor: colors.border, height: 36 }]}
                                      onPress={() =>
                                        setOpenCoachDropdownAthleteId(
                                          openCoachDropdownAthleteId === athlete.id ? null : athlete.id
                                        )
                                      }
                                    >
                                      <Text style={[styles.dropdownButtonText, { color: colors.textPrimary, fontSize: 13 }]} numberOfLines={1}>
                                        {selectedCoach ? selectedCoach.name : 'Select a coach...'}
                                      </Text>
                                      <Ionicons
                                        name={openCoachDropdownAthleteId === athlete.id ? 'chevron-up' : 'chevron-down'}
                                        size={16}
                                        color={colors.textSub}
                                      />
                                    </Pressable>

                                    {openCoachDropdownAthleteId === athlete.id && (
                                      <Modal
                                        transparent
                                        visible={true}
                                        animationType="fade"
                                        onRequestClose={() => setOpenCoachDropdownAthleteId(null)}
                                      >
                                        <Pressable
                                          style={styles.modalOverlay}
                                          onPress={() => setOpenCoachDropdownAthleteId(null)}
                                        >
                                          <View
                                            style={[
                                              styles.modalMenu,
                                              { backgroundColor: colors.bgCard, borderColor: colors.border }
                                            ]}
                                          >
                                            <Text style={[styles.modalHeader, { color: colors.textSub, borderBottomColor: colors.border }]}>
                                              Select Coach for {athlete.name}
                                            </Text>
                                            <Pressable
                                              style={[
                                                styles.modalItem,
                                                selectedCoachId === '' && { backgroundColor: colors.bgMid },
                                              ]}
                                              onPress={() => {
                                                setUpdatingAthleteCoachMap((prev) => ({
                                                  ...prev,
                                                  [athlete.id]: '',
                                                }));
                                                setOpenCoachDropdownAthleteId(null);
                                              }}
                                            >
                                              <Text style={[styles.modalItemText, { color: colors.textSub }]}>
                                                No Coach (Unassign)
                                              </Text>
                                            </Pressable>
                                            {coachesList.map((c) => {
                                              const coachKey = c.coach_id || c.id;
                                              return (
                                                <Pressable
                                                  key={coachKey}
                                                  style={[
                                                    styles.modalItem,
                                                    selectedCoachId === coachKey && { backgroundColor: colors.bgMid },
                                                  ]}
                                                  onPress={() => {
                                                    setUpdatingAthleteCoachMap((prev) => ({
                                                      ...prev,
                                                      [athlete.id]: coachKey,
                                                    }));
                                                    setOpenCoachDropdownAthleteId(null);
                                                  }}
                                                >
                                                  <Text
                                                    style={[
                                                      styles.modalItemText,
                                                      { color: colors.textPrimary, fontWeight: selectedCoachId === coachKey ? '700' : '400' },
                                                    ]}
                                                  >
                                                    {c.name}
                                                  </Text>
                                                </Pressable>
                                              );
                                            })}
                                          </View>
                                        </Pressable>
                                      </Modal>
                                    )}
                                  </View>

                                  {selectedCoachId !== (currentCoachId || '') && selectedCoachId !== '' && (
                                    <Button
                                      label="Apply Coach"
                                      onPress={() => handleAssignCoach(athlete.id, selectedCoachId)}
                                      variant="primary"
                                      size="sm"
                                      style={{ height: 34, justifyContent: 'center' }}
                                    />
                                  )}

                                  {currentCoach && (
                                    <Button
                                      label="Unassign Coach"
                                      onPress={() => handleRemoveCoachAssignment(athlete.id)}
                                      variant="danger"
                                      size="sm"
                                      prefix={<Ionicons name="close-circle-outline" size={14} color="#fff" />}
                                      style={{ height: 34, justifyContent: 'center' }}
                                    />
                                  )}

                                  {message && (
                                    <Text
                                      style={[
                                        styles.userItemMessage,
                                        { color: message.isError ? colors.error : colors.success }
                                      ]}
                                    >
                                      {message.text}
                                    </Text>
                                  )}
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                  <Badge label="Athlete" variant="info" />
                                  <Button
                                    label="View Profile"
                                    onPress={() => router.push(`/athlete-details?athleteId=${athlete.id}`)}
                                    variant="secondary"
                                    size="sm"
                                    style={{ height: 34, justifyContent: 'center' }}
                                  />
                                </View>
                              </Card>
                            </StatsGridItem>
                          );
                        })}
                      </StatsGrid>
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Sidebar Overlay (Mobile & Tablet) */}
      {!isLargeScreen && sidebarOpen && (
        <Pressable style={styles.overlay} onPress={() => setSidebarOpen(false)} />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isLargeScreen: boolean) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: Platform.OS === 'web' ? 260 : '70%',
    backgroundColor: colors.bgMid,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingTop: 16,
  },
  sidebarFloating: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    height: '100%',
    zIndex: 1000,
    width: 260,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  sidebarBrand: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sidebarNav: {
    paddingVertical: 16,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  sidebarItemActive: {
    backgroundColor: colors.emeraldDim,
    borderLeftColor: colors.emerald,
  },
  sidebarItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSub,
  },
  sidebarItemLabelActive: {
    color: colors.emerald,
    fontWeight: '700',
  },
  sidebarBadge: {
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBadgeActive: {
    backgroundColor: colors.emerald,
  },
  sidebarBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSub,
  },
  sidebarBadgeTextActive: {
    color: '#fff',
  },
  sidebarFooter: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: 'auto',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.errorDim,
    gap: 10,
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  hamburgerBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.bgMid,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSub,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.bgMid,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentInner: {
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  loaderContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: colors.textSub,
    fontSize: 14,
  },
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
  statusCard: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  statusText: {
    fontSize: 13,
  },
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    width: '100%',
  },
  emptyText: {
    color: colors.textSub,
    fontSize: 15,
    marginTop: 12,
  },
  // Table Cells Custom Styles
  tableCellUser: {
    paddingHorizontal: 16,
    minWidth: 220,
    flex: 2,
    justifyContent: 'center',
  },
  tableCellId: {
    paddingHorizontal: 16,
    minWidth: 100,
    flex: 1,
    justifyContent: 'center',
  },
  tableCellBadge: {
    paddingHorizontal: 16,
    minWidth: 110,
    flex: 1,
    justifyContent: 'center',
  },
  tableCellDropdown: {
    paddingHorizontal: 16,
    minWidth: 180,
    flex: 1.5,
    justifyContent: 'center',
  },
  tableCellActions: {
    paddingHorizontal: 16,
    minWidth: 120,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  userEmailText: {
    fontSize: 13,
    marginTop: 2,
  },
  cellText: {
    fontSize: 13,
  },
  userItemMessage: {
    fontSize: 11,
    fontWeight: '600',
  },
  currentUserRoleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  smallLabel: {
    color: colors.textSub,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownContainer: {
    position: 'relative',
    width: '100%',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: '100%',
  },
  dropdownButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 36,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownItemText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalMenu: {
    width: 280,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Roles list
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
    width: '100%',
  },
  roleDetailCard: {
    flex: isLargeScreen ? 1 : undefined,
    width: isLargeScreen ? undefined : '100%',
    minWidth: 280,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  roleBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  roleActionErrorText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  editPermissionsForm: {
    gap: 10,
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  permissionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  noPermissionsText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  roleActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 12,
    marginTop: 'auto',
  },
  formCard: {
    width: '100%',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  formMessage: {
    fontSize: 13,
    fontWeight: '600',
  },
  formFields: {
    gap: 14,
  },
  // Coaches
  coachesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
  },
  coachCard: {
    width: isLargeScreen ? '31%' : '100%',
    minWidth: 260,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  coachAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.emeraldDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderEmerald,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.emerald,
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  coachEmail: {
    fontSize: 13,
    color: colors.textSub,
    marginTop: 2,
  },
  coachFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 12,
  },
  // Athletes
  athletesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
  },
  athleteCard: {
    width: isLargeScreen ? '31%' : '100%',
    minWidth: 280,
  },
  athleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  athleteAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.infoDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.2)',
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  athleteShortId: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.textMuted,
    marginTop: 2,
  },
  athleteEmail: {
    fontSize: 13,
    color: colors.textSub,
    marginTop: 2,
  },
  athleteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 12,
    marginTop: 12,
  },
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
    color: colors.textMuted,
    paddingVertical: 20,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
});
