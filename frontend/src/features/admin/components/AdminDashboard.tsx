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
  TextInput,
  View,
  useWindowDimensions,
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

interface AdminDashboardProps {
  user: AuthUser | null;
  token: string;
  onSignOut: () => void;
}

type TabType = 'dashboard' | 'users' | 'roles' | 'coaches' | 'athletes';

// Responsive helpers
const isWeb = Platform.OS === 'web';
const isLargeScreenStatic = true;

export default function AdminDashboard({ user, token, onSignOut }: AdminDashboardProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  
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
      setUsers([]);
      setRoles([]);
      setAthletesData([]);
      setWorkouts([]);
      setPerformances([]);
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
      ? 'Unable to load dashboard metrics right now.'
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
        // Update local mock state
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
        // Refresh athletes data immediately
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
        // Update local mock state
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
        // Reset local selection map
        setUpdatingAthleteCoachMap((prev) => ({
          ...prev,
          [athleteId]: '',
        }));
        // Refresh athletes data immediately
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
                <Ionicons name="flash" size={22} color="#3b82f6" />
                <Text style={styles.sidebarBrand}>AthliTech</Text>
              </View>
              {!isLargeScreen && (
                <Pressable onPress={() => setSidebarOpen(false)}>
                  <Ionicons name="close" size={24} color="#647286" />
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
                    color={activeTab === item.id ? '#3b82f6' : '#647286'}
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
                <Ionicons name="log-out" size={20} color="#ef4444" />
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
                <Ionicons name="menu" size={24} color="#0f172a" />
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
            <Pressable onPress={loadDashboardData} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={20} color="#1e293b" />
            </Pressable>
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
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loaderText}>Loading dashboard...</Text>
              </View>
            ) : (
              <>
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                  <>
                    {/* Summary Cards */}
                    <View style={styles.metricsContainer}>
                      <View style={[styles.metricCard, { borderLeftColor: '#3b82f6' }]}>
                        <View style={styles.metricHeader}>
                          <Text style={styles.metricLabel}>Total Users</Text>
                          <View style={[styles.iconWrapper, { backgroundColor: '#eff6ff' }]}>
                            <Ionicons name="people-outline" size={20} color="#3b82f6" />
                          </View>
                        </View>
                        <Text style={styles.metricValue}>{totalUsers}</Text>
                      </View>

                      <View style={[styles.metricCard, { borderLeftColor: '#10b981' }]}>
                        <View style={styles.metricHeader}>
                          <Text style={styles.metricLabel}>Coaches</Text>
                          <View style={[styles.iconWrapper, { backgroundColor: '#ecfdf5' }]}>
                            <Ionicons name="fitness-outline" size={20} color="#10b981" />
                          </View>
                        </View>
                        <Text style={styles.metricValue}>{totalCoaches}</Text>
                      </View>

                      <View style={[styles.metricCard, { borderLeftColor: '#f59e0b' }]}>
                        <View style={styles.metricHeader}>
                          <Text style={styles.metricLabel}>Athletes</Text>
                          <View style={[styles.iconWrapper, { backgroundColor: '#fffbeb' }]}>
                            <Ionicons name="walk-outline" size={20} color="#f59e0b" />
                          </View>
                        </View>
                        <Text style={styles.metricValue}>{totalAthletes}</Text>
                      </View>

                      <View style={[styles.metricCard, { borderLeftColor: '#8b5cf6' }]}>
                        <View style={styles.metricHeader}>
                          <Text style={styles.metricLabel}>Roles</Text>
                          <View style={[styles.iconWrapper, { backgroundColor: '#f5f3ff' }]}>
                            <Ionicons name="shield-outline" size={20} color="#8b5cf6" />
                          </View>
                        </View>
                        <Text style={styles.metricValue}>{totalRoles}</Text>
                      </View>
                    </View>

                    {/* Additional Summary Cards */}
                    <View style={styles.metricsContainer}>
                      {/* Workouts Overview Card */}
                      <View style={[styles.metricCard, { borderLeftColor: '#06b6d4', flex: 1 }]}>
                        <View style={styles.metricHeader}>
                          <Text style={styles.metricLabel}>Workouts Overview</Text>
                          <View style={[styles.iconWrapper, { backgroundColor: '#ecfeff' }]}>
                            <Ionicons name="barbell-outline" size={20} color="#06b6d4" />
                          </View>
                        </View>
                        <View style={styles.derivedStatsContainer}>
                          <View style={styles.derivedStatBox}>
                            <Text style={styles.derivedStatVal}>{workouts.length}</Text>
                            <Text style={styles.derivedStatLabel}>Total</Text>
                          </View>
                          <View style={styles.derivedStatBox}>
                            <Text style={styles.derivedStatVal}>{workouts.filter(w => w.status === 'pending').length}</Text>
                            <Text style={styles.derivedStatLabel}>Pending</Text>
                          </View>
                          <View style={styles.derivedStatBox}>
                            <Text style={styles.derivedStatVal}>{workouts.filter(w => w.status === 'completed').length}</Text>
                            <Text style={styles.derivedStatLabel}>Completed</Text>
                          </View>
                        </View>
                      </View>

                      {/* Performance Overview Card */}
                      <View style={[styles.metricCard, { borderLeftColor: '#ec4899', flex: 1 }]}>
                        <View style={styles.metricHeader}>
                          <Text style={styles.metricLabel}>Performance & Assignments</Text>
                          <View style={[styles.iconWrapper, { backgroundColor: '#fdf2f8' }]}>
                            <Ionicons name="speedometer-outline" size={20} color="#ec4899" />
                          </View>
                        </View>
                        <View style={styles.derivedStatsContainer}>
                          <View style={styles.derivedStatBox}>
                            <Text style={styles.derivedStatVal}>{performances.length}</Text>
                            <Text style={styles.derivedStatLabel}>Perf. Records</Text>
                          </View>
                          <View style={styles.derivedStatBox}>
                            <Text style={styles.derivedStatVal}>{athletesData.filter(a => !!a.coach_id).length}</Text>
                            <Text style={styles.derivedStatLabel}>Active Assignments</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Recent Activity Section */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Recent Activity</Text>
                      <View style={styles.activityFeed}>
                        {getRecentActivities().length === 0 ? (
                          <Text style={styles.emptyActivityText}>No recent activity recorded.</Text>
                        ) : (
                          getRecentActivities().map((act) => {
                            let iconName = 'ellipse-outline';
                            let iconColor = '#64748b';
                            let bgColor = '#f1f5f9';

                            if (act.type === 'registration') {
                              iconName = 'person-add-outline';
                              iconColor = '#3b82f6';
                              bgColor = '#eff6ff';
                            } else if (act.type === 'assignment') {
                              iconName = 'people-outline';
                              iconColor = '#10b981';
                              bgColor = '#ecfdf5';
                            } else if (act.type === 'workout_assign') {
                              iconName = 'barbell-outline';
                              iconColor = '#8b5cf6';
                              bgColor = '#f5f3ff';
                            } else if (act.type === 'workout_comp') {
                              iconName = 'checkmark-done-circle-outline';
                              iconColor = '#06b6d4';
                              bgColor = '#ecfeff';
                            } else if (act.type === 'performance') {
                              iconName = 'speedometer-outline';
                              iconColor = '#ec4899';
                              bgColor = '#fdf2f8';
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
                    </View>

                    {dashboardStatusMessage ? (
                      <View style={styles.statusCard}>
                        <Text
                          style={[
                            styles.statusText,
                            dashboardError ? styles.statusErrorText : null,
                          ]}
                        >
                          {dashboardStatusMessage}
                        </Text>
                      </View>
                    ) : null}

                    {/* Quick Actions */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Quick Actions</Text>
                      <View style={styles.actionGrid}>
                        <Pressable
                          style={[styles.actionCard, { width: isLargeScreen ? '48%' : '100%' }]}
                          onPress={() => setActiveTab('users')}
                        >
                          <Ionicons name="people-circle" size={32} color="#3b82f6" />
                          <Text style={styles.actionCardTitle}>Manage Users</Text>
                          <Text style={styles.actionCardDesc}>
                            Review and manage user accounts and roles.
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[styles.actionCard, { width: isLargeScreen ? '48%' : '100%' }]}
                          onPress={() => setActiveTab('roles')}
                        >
                          <Ionicons name="shield-checkmark" size={32} color="#10b981" />
                          <Text style={styles.actionCardTitle}>Manage Roles</Text>
                          <Text style={styles.actionCardDesc}>
                            Create and configure system roles.
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[styles.actionCard, { width: isLargeScreen ? '48%' : '100%' }]}
                          onPress={() => setActiveTab('coaches')}
                        >
                          <Ionicons name="fitness" size={32} color="#8b5cf6" />
                          <Text style={styles.actionCardTitle}>Coaches</Text>
                          <Text style={styles.actionCardDesc}>
                            View and manage coach accounts.
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[styles.actionCard, { width: isLargeScreen ? '48%' : '100%' }]}
                          onPress={() => setActiveTab('athletes')}
                        >
                          <Ionicons name="walk" size={32} color="#f59e0b" />
                          <Text style={styles.actionCardTitle}>Athletes</Text>
                          <Text style={styles.actionCardDesc}>
                            Manage athlete profiles and assignments.
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <View style={styles.section}>
                    <View
                      style={[
                        styles.sectionHeader,
                        {
                          flexDirection: isLargeScreen ? 'row' : 'column',
                          alignItems: isLargeScreen ? 'center' : 'stretch',
                        },
                      ]}
                    >
                      <Text style={styles.sectionTitle}>User Registry ({filteredUsers.length})</Text>
                      <TextInput
                        style={[styles.searchBar, { width: isLargeScreen ? 300 : '100%' }]}
                        placeholder="Search name, email, or role..."
                        placeholderTextColor="#94a3b8"
                        value={userSearchQuery}
                        onChangeText={setUserSearchQuery}
                      />
                    </View>

                    <View style={styles.userList}>
                      {filteredUsers.length === 0 ? (
                        <View style={styles.emptyContainer}>
                          <Text style={styles.emptyText}>No users matched your query</Text>
                        </View>
                      ) : (
                        filteredUsers.map((item) => {
                          const selectedRole = updatingUserRoleMap[item.id] || item.role;
                          const message = userRoleMessage[item.id];
                          return (
                            <View
                              key={item.id}
                              style={[
                                styles.userListItem,
                                { flexDirection: isLargeScreen ? 'row' : 'column' },
                                openDropdownUserId === item.id ? { zIndex: 10 } : { zIndex: 1 },
                              ]}
                            >
                              <View style={styles.userInfo}>
                                <Text style={styles.userNameText}>{item.name}</Text>
                                <Text style={styles.userEmailText}>{item.email}</Text>
                                <View style={styles.userMetaRow}>
                                  <Text style={styles.userIdText}>ID: {item.id}</Text>
                                  <View style={styles.roleBadge}>
                                    <Text style={styles.roleBadgeText}>{item.role}</Text>
                                  </View>
                                </View>
                                {message && (
                                  <Text
                                    style={[
                                      styles.userItemMessage,
                                      message.isError ? styles.errorText : styles.successText,
                                    ]}
                                  >
                                    {message.text}
                                  </Text>
                                )}
                              </View>

                              <View
                                style={[
                                  styles.userRoleEdit,
                                  { alignItems: isLargeScreen ? 'flex-end' : 'flex-start' },
                                ]}
                              >
                                {item.id === user?.id || item.email === user?.email ? (
                                  <Text style={styles.currentUserRoleText}>ADMIN (Self)</Text>
                                ) : (
                                  <>
                                    <Text style={styles.smallLabel}>Assign Role:</Text>
                                    <View style={styles.dropdownContainer}>
                                      <Pressable
                                        style={styles.dropdownButton}
                                        onPress={() =>
                                          setOpenDropdownUserId(
                                            openDropdownUserId === item.id ? null : item.id
                                          )
                                        }
                                      >
                                        <Text style={styles.dropdownButtonText}>
                                          {selectedRole.toUpperCase()}
                                        </Text>
                                        <Ionicons
                                          name={
                                            openDropdownUserId === item.id ? 'chevron-up' : 'chevron-down'
                                          }
                                          size={16}
                                          color="#647286"
                                        />
                                      </Pressable>

                                      {openDropdownUserId === item.id && (
                                        <View style={styles.dropdownMenu}>
                                          {roles.map((r) => (
                                            <Pressable
                                              key={r.name}
                                              style={[
                                                styles.dropdownItem,
                                                selectedRole === r.name && styles.dropdownItemActive,
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
                                                  styles.dropdownItemText,
                                                  selectedRole === r.name &&
                                                    styles.dropdownItemTextActive,
                                                ]}
                                              >
                                                {r.name.toUpperCase()}
                                              </Text>
                                              {selectedRole === r.name && (
                                                <Ionicons name="checkmark" size={16} color="#3b82f6" />
                                              )}
                                            </Pressable>
                                          ))}
                                        </View>
                                      )}
                                    </View>

                                    {selectedRole !== item.role && (
                                      <Pressable
                                        style={styles.saveRoleButton}
                                        onPress={() => handleUpdateUserRole(item.id)}
                                      >
                                        <Text style={styles.saveRoleButtonText}>Apply Role</Text>
                                      </Pressable>
                                    )}
                                  </>
                                )}

                                {item.id !== user?.id && item.email !== user?.email && (
                                  <Pressable
                                    style={styles.deleteUserButton}
                                    onPress={() => handleDeletePress(item)}
                                  >
                                    <Ionicons name="trash-outline" size={14} color="#ef4444" />
                                    <Text style={styles.deleteUserButtonText}>Delete User</Text>
                                  </Pressable>
                                )}
                              </View>
                            </View>
                          );
                        })
                      )}
                    </View>
                  </View>
                )}

                {/* Roles Tab */}
                {activeTab === 'roles' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>System Roles</Text>
                    <View style={styles.rolesGrid}>
                      {roles.map((r) => {
                        const isDefault = ['admin', 'coach', 'athlete'].includes(r.name.toLowerCase());
                        const isEditing = editingRoleName === r.name;

                        return (
                          <View key={r.name} style={styles.roleDetailCard}>
                            <View style={styles.roleHeaderRow}>
                              <View style={styles.roleBadgeHeader}>
                                <Ionicons name="shield-checkmark" size={16} color={isDefault ? "#3b82f6" : "#475569"} />
                                <Text style={styles.roleTitle}>{r.name.toUpperCase()}</Text>
                              </View>
                              {isDefault && (
                                <View style={styles.defaultRoleBadge}>
                                  <Text style={styles.defaultRoleBadgeText}>System Default</Text>
                                </View>
                              )}
                            </View>

                            {roleActionError[r.name] ? (
                              <Text style={styles.roleActionErrorText}>{roleActionError[r.name]}</Text>
                            ) : null}

                            {isEditing ? (
                              <View style={styles.editPermissionsForm}>
                                <TextInput
                                  style={styles.textInput}
                                  value={editingRolePermissionsInput}
                                  onChangeText={setEditingRolePermissionsInput}
                                  placeholder="e.g. read:stats, write:stats"
                                  placeholderTextColor="#94a3b8"
                                />
                                <View style={styles.editActionRow}>
                                  <Pressable
                                    style={[styles.saveRoleBtn, isSavingRolePermissions && styles.disabledBtn]}
                                    onPress={() => handleSaveRolePermissions(r.name)}
                                    disabled={isSavingRolePermissions}
                                  >
                                    <Text style={styles.saveRoleBtnText}>
                                      {isSavingRolePermissions ? 'Saving...' : 'Save'}
                                    </Text>
                                  </Pressable>
                                  <Pressable
                                    style={styles.cancelRoleBtn}
                                    onPress={() => setEditingRoleName(null)}
                                  >
                                    <Text style={styles.cancelRoleBtnText}>Cancel</Text>
                                  </Pressable>
                                </View>
                              </View>
                            ) : (
                              <>
                                <View style={styles.permissionsContainer}>
                                  {r.permissions.length === 0 ? (
                                    <Text style={styles.noPermissionsText}>No permissions assigned</Text>
                                  ) : (
                                    r.permissions.map((p) => (
                                      <View key={p} style={styles.permissionChip}>
                                        <Text style={styles.permissionText}>{p}</Text>
                                      </View>
                                    ))
                                  )}
                                </View>

                                {!isDefault && (
                                  <View style={styles.roleActionButtonsRow}>
                                    <Pressable
                                      style={styles.editRoleBtn}
                                      onPress={() => {
                                        setEditingRoleName(r.name);
                                        setEditingRolePermissionsInput(r.permissions.join(', '));
                                      }}
                                    >
                                      <Ionicons name="create-outline" size={14} color="#3b82f6" />
                                      <Text style={styles.editRoleBtnText}>Edit Permissions</Text>
                                    </Pressable>
                                    <Pressable
                                      style={styles.deleteRoleBtn}
                                      onPress={() => handleDeleteRoleClick(r.name)}
                                    >
                                      <Ionicons name="trash-outline" size={14} color="#ef4444" />
                                      <Text style={styles.deleteRoleBtnText}>Delete Role</Text>
                                    </Pressable>
                                  </View>
                                )}
                              </>
                            )}
                          </View>
                        );
                      })}
                    </View>

                    <View style={styles.formCard}>
                      <Text style={styles.formTitle}>Create Custom Role</Text>
                      {roleFormMessage && (
                        <Text
                          style={[
                            styles.formMessage,
                            roleFormMessage.isError ? styles.errorText : styles.successText,
                          ]}
                        >
                          {roleFormMessage.text}
                        </Text>
                      )}

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Role Name</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. physiotherapist, auditor"
                          placeholderTextColor="#94a3b8"
                          value={newRoleName}
                          onChangeText={setNewRoleName}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Permissions (comma separated)</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. read:stats, write:stats"
                          placeholderTextColor="#94a3b8"
                          value={newRolePermissions}
                          onChangeText={setNewRolePermissions}
                        />
                      </View>

                      <Pressable
                        style={({ pressed }) => [
                          styles.primaryButton,
                          pressed && styles.buttonPressed,
                          isCreatingRole && styles.buttonDisabled,
                        ]}
                        onPress={handleCreateRole}
                        disabled={isCreatingRole}
                      >
                        {isCreatingRole ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.primaryButtonText}>Create Role</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Coaches Tab */}
                {activeTab === 'coaches' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Coaches ({coachesList.length})</Text>
                    <View style={styles.coachesGrid}>
                      {coachesList.length === 0 ? (
                        <View style={styles.emptyContainer}>
                          <Ionicons name="fitness-outline" size={48} color="#cbd5e1" />
                          <Text style={styles.emptyText}>No coaches registered yet</Text>
                        </View>
                      ) : (
                        coachesList.map((coach) => (
                          <View key={coach.id} style={styles.coachCard}>
                            <View style={styles.coachHeader}>
                              <View style={styles.coachAvatar}>
                                <Text style={styles.avatarText}>
                                  {coach.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <View style={styles.coachInfo}>
                                <Text style={styles.coachName}>{coach.name}</Text>
                                <Text style={styles.coachEmail}>{coach.email}</Text>
                              </View>
                            </View>
                              <View style={styles.coachFooter}>
                                <View style={styles.badge}>
                                  <Text style={styles.badgeText}>Coach</Text>
                                </View>
                                <Pressable
                                  style={styles.viewBtn}
                                  onPress={() => router.push(`/coach-details?coachId=${coach.id}`)}
                                >
                                  <Text style={styles.viewBtnText}>View</Text>
                                </Pressable>
                              </View>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                )}

                {/* Athletes Tab */}
                {activeTab === 'athletes' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Athletes ({athletesList.length})</Text>
                    <View style={styles.athletesGrid}>
                      {athletesList.length === 0 ? (
                        <View style={styles.emptyContainer}>
                          <Ionicons name="walk-outline" size={48} color="#cbd5e1" />
                          <Text style={styles.emptyText}>No athletes registered yet</Text>
                        </View>
                      ) : (
                        athletesList.map((athlete) => {
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
                            <View
                              key={athlete.id}
                              style={[
                                styles.athleteCard,
                                openCoachDropdownAthleteId === athlete.id ? { zIndex: 10 } : { zIndex: 1 },
                              ]}
                            >
                              <View style={styles.athleteHeader}>
                                <View style={styles.athleteAvatar}>
                                  <Text style={styles.avatarText}>
                                    {athlete.name.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={styles.athleteInfo}>
                                  <Text style={styles.athleteName}>{athlete.name}</Text>
                                  <Text style={styles.athleteEmail}>{athlete.email}</Text>
                                  <Text style={{ fontSize: 12, color: '#647286', marginTop: 4 }}>
                                    Current Coach: {currentCoach ? currentCoach.name : 'No coach assigned'}
                                  </Text>
                                </View>
                              </View>

                              {/* Assign Coach UI */}
                              <View style={{ 
                                marginVertical: 12, 
                                borderTopWidth: 1, 
                                borderTopColor: '#f1f5f9', 
                                paddingTop: 12, 
                                gap: 8,
                                zIndex: openCoachDropdownAthleteId === athlete.id ? 20 : 1
                              }}>
                                <Text style={styles.smallLabel}>Assign Coach:</Text>
                                <View style={[styles.dropdownContainer, { width: '100%' }]}>
                                  <Pressable
                                    style={styles.dropdownButton}
                                    onPress={() =>
                                      setOpenCoachDropdownAthleteId(
                                        openCoachDropdownAthleteId === athlete.id ? null : athlete.id
                                      )
                                    }
                                  >
                                    <Text style={styles.dropdownButtonText}>
                                      {selectedCoach ? selectedCoach.name : 'Select Coach...'}
                                    </Text>
                                    <Ionicons
                                      name={openCoachDropdownAthleteId === athlete.id ? 'chevron-up' : 'chevron-down'}
                                      size={16}
                                      color="#647286"
                                    />
                                  </Pressable>

                                  {openCoachDropdownAthleteId === athlete.id && (
                                    <View style={styles.dropdownMenu}>
                                      {coachesList.length === 0 ? (
                                        <View style={{ padding: 10 }}>
                                          <Text style={{ fontSize: 12, color: '#94a3b8' }}>No coaches registered</Text>
                                        </View>
                                      ) : (
                                        coachesList.map((coach) => {
                                          const coachKey = coach.coach_id || coach.id;
                                          return (
                                            <Pressable
                                              key={coach.id}
                                              style={[
                                                styles.dropdownItem,
                                                selectedCoachId === coachKey && styles.dropdownItemActive,
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
                                                  styles.dropdownItemText,
                                                  selectedCoachId === coachKey && styles.dropdownItemTextActive,
                                                ]}
                                              >
                                                {coach.name}
                                              </Text>
                                              {selectedCoachId === coachKey && (
                                                <Ionicons name="checkmark" size={16} color="#3b82f6" />
                                              )}
                                            </Pressable>
                                          );
                                        })
                                      )}
                                    </View>
                                  )}
                                </View>

                                {selectedCoachId !== (currentCoachId || '') && selectedCoachId !== '' && (
                                  <Pressable
                                    style={[styles.saveRoleButton, { marginTop: 4, alignSelf: 'stretch', alignItems: 'center' }]}
                                    onPress={() => handleAssignCoach(athlete.id, selectedCoachId)}
                                  >
                                    <Text style={styles.saveRoleButtonText}>Apply Coach</Text>
                                  </Pressable>
                                )}

                                {currentCoach && (
                                  <Pressable
                                    style={[styles.removeCoachBtn, { marginTop: 4, alignSelf: 'stretch' }]}
                                    onPress={() => handleRemoveCoachAssignment(athlete.id)}
                                  >
                                    <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                                    <Text style={styles.removeCoachBtnText}>Remove Assignment</Text>
                                  </Pressable>
                                )}

                                {message && (
                                  <Text
                                    style={[
                                      styles.userItemMessage,
                                      message.isError ? styles.errorText : styles.successText,
                                    ]}
                                  >
                                    {message.text}
                                  </Text>
                                )}
                              </View>

                              <View style={styles.athleteFooter}>
                                <View style={styles.badge}>
                                  <Text style={styles.badgeText}>Athlete</Text>
                                </View>
                                <Pressable
                                  style={styles.viewBtn}
                                  onPress={() => router.push(`/athlete-details?athleteId=${athlete.id}`)}
                                >
                                  <Text style={styles.viewBtnText}>View Details</Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })
                      )}
                    </View>
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

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: isWeb ? 260 : '70%',
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
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
    borderBottomColor: '#f1f5f9',
  },
  sidebarBrand: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
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
    backgroundColor: '#eff6ff',
    borderLeftColor: '#3b82f6',
  },
  sidebarItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#647286',
  },
  sidebarItemLabelActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  sidebarBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBadgeActive: {
    backgroundColor: '#3b82f6',
  },
  sidebarBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#647286',
  },
  sidebarBadgeTextActive: {
    color: '#fff',
  },
  sidebarFooter: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 'auto',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    gap: 10,
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  hamburgerBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#647286',
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    color: '#647286',
    fontSize: 14,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: isWeb || isLargeScreenStatic ? 1 : undefined,
    width: isWeb || isLargeScreenStatic ? undefined : '100%',
    minWidth: 200,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderLeftWidth: 5,
    borderRadius: 8,
    padding: 20,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#647286',
    fontWeight: '600',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  statusText: {
    fontSize: 13,
    color: '#475569',
  },
  statusErrorText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: isLargeScreenStatic ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: isLargeScreenStatic ? 'center' : 'stretch',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  searchBar: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 40,
    width: isLargeScreenStatic ? 300 : '100%',
    fontSize: 14,
    color: '#0f172a',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
  },
  actionCard: {
    width: isLargeScreenStatic ? '48%' : '100%',
    minWidth: 260,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    gap: 10,
  },
  actionCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionCardDesc: {
    fontSize: 14,
    color: '#647286',
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  emptyText: {
    color: '#647286',
    fontSize: 15,
    marginTop: 12,
  },
  userList: {
    gap: 12,
  },
  userListItem: {
    flexDirection: isLargeScreenStatic ? 'row' : 'column',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  userEmailText: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  userIdText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#94a3b8',
    marginTop: 4,
  },
  userItemMessage: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  userRoleEdit: {
    justifyContent: 'center',
    alignItems: isLargeScreenStatic ? 'flex-end' : 'flex-start',
    gap: 8,
  },
  smallLabel: {
    fontSize: 12,
    color: '#647286',
    fontWeight: '600',
  },
  dropdownContainer: {
    position: 'relative',
    width: 200,
    zIndex: 50,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
  },
  dropdownButtonText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  saveRoleButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  saveRoleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    marginTop: 8,
    width: 200,
  },
  deleteUserButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  roleDetailCard: {
    flex: isWeb || isLargeScreenStatic ? 1 : undefined,
    width: isWeb || isLargeScreenStatic ? undefined : '100%',
    minWidth: 260,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  roleBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 10,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  permissionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  permissionChip: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  permissionText: {
    fontSize: 11,
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  formCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  formMessage: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#344054',
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: '#0f172a',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  successText: {
    color: '#15803d',
  },
  errorText: {
    color: '#b91c1c',
  },
  coachesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  coachCard: {
    flex: isWeb || isLargeScreenStatic ? 1 : undefined,
    width: isWeb || isLargeScreenStatic ? undefined : '100%',
    minWidth: 280,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  coachAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  coachEmail: {
    fontSize: 12,
    color: '#647286',
    marginTop: 2,
  },
  coachFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopColor: '#f1f5f9',
    borderTopWidth: 1,
  },
  athletesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  athleteCard: {
    flex: isWeb || isLargeScreenStatic ? 1 : undefined,
    width: isWeb || isLargeScreenStatic ? undefined : '100%',
    minWidth: 280,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
  },
  athleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  athleteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  athleteEmail: {
    fontSize: 12,
    color: '#647286',
    marginTop: 2,
  },
  athleteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopColor: '#f1f5f9',
    borderTopWidth: 1,
  },
  badge: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  viewBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
    textTransform: 'uppercase',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  currentUserRoleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  removeCoachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderColor: '#f87171',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
      default: {},
    }),
  },
  removeCoachBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  },
  derivedStatsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  derivedStatBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  derivedStatVal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  derivedStatLabel: {
    fontSize: 11,
    color: '#647286',
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  activityFeed: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  activityIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  activityMsgText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  activityDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  emptyActivityText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  defaultRoleBadge: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultRoleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
    textTransform: 'uppercase',
  },
  roleActionErrorText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 8,
    fontWeight: '600',
  },
  editPermissionsForm: {
    gap: 8,
    marginTop: 8,
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  saveRoleBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveRoleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  cancelRoleBtn: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelRoleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  noPermissionsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  roleActionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  editRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editRoleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  deleteRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteRoleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
