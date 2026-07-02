import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  assignAthleteToCoach,
  createRole,
  fetchAllRoles,
  fetchAllUsers,
  updateUserRole,
} from '@/services/admin';
import type { Role, User } from '@/services/admin';
import type { AuthUser } from '@/services/auth';

const mockStats = {
  totalUsers: 142,
  totalCoaches: 18,
  totalAthletes: 114,
  totalRoles: 4,
};

const mockUsers: User[] = [
  { id: '1', name: 'Coach Sarah', email: 'sarah@athlitech.com', role: 'coach' },
  { id: '2', name: 'Coach Marcus', email: 'marcus@athlitech.com', role: 'coach' },
  { id: '3', name: 'John Athlete', email: 'john@athlitech.com', role: 'athlete' },
  { id: '4', name: 'Elena Athlete', email: 'elena@athlitech.com', role: 'athlete' },
  { id: '5', name: 'Admin User', email: 'admin@athlitech.com', role: 'admin' },
];

const mockRoles: Role[] = [
  { id: 'r1', name: 'admin', permissions: ['all'] },
  { id: 'r2', name: 'coach', permissions: ['read:athletes', 'write:athletes'] },
  { id: 'r3', name: 'athlete', permissions: ['read:profile'] },
];

interface AdminDashboardProps {
  user: AuthUser | null;
  token: string;
  onSignOut: () => void;
}

type TabType = 'overview' | 'users' | 'roles' | 'assign';

export default function AdminDashboard({ user, token, onSignOut }: AdminDashboardProps) {
  // Navigation / Tabs state
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Backend data state
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Form states
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState('');
  const [roleFormMessage, setRoleFormMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Assign Athlete to Coach states
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [assignFormMessage, setAssignFormMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // User Role Editing states
  const [updatingUserRoleMap, setUpdatingUserRoleMap] = useState<{ [userId: string]: string }>({});
  const [userRoleMessage, setUserRoleMessage] = useState<{ [userId: string]: { text: string; isError: boolean } }>({});
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Fallback / Placeholder numbers


  // Fetch data
  const loadDashboardData = useCallback(async () => {
    setIsLoadingData(true);
    setIsUsingFallback(false);
    try {
      const fetchedUsers = await fetchAllUsers(token);
      const fetchedRoles = await fetchAllRoles(token);
      setUsers(fetchedUsers);
      setRoles(fetchedRoles);
    } catch (e) {
      console.warn('Backend API connection failed, using high-fidelity placeholders:', e);
      setIsUsingFallback(true);
      setUsers(mockUsers);
      setRoles(mockRoles);
    } finally {
      setIsLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived counts
  const totalUsers = isUsingFallback ? mockStats.totalUsers : users.length;
  const totalCoaches = isUsingFallback
    ? mockStats.totalCoaches
    : users.filter((u) => u.role.toLowerCase() === 'coach').length;
  const totalAthletes = isUsingFallback
    ? mockStats.totalAthletes
    : users.filter((u) => u.role.toLowerCase() === 'athlete').length;
  const totalRoles = isUsingFallback ? mockStats.totalRoles : roles.length;

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
        // Mock creation
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
        // Reload
        const fetchedRoles = await fetchAllRoles(token);
        setRoles(fetchedRoles);
      }
    } catch (e: any) {
      setRoleFormMessage({ text: e.message || 'Failed to create role', isError: true });
    } finally {
      setIsCreatingRole(false);
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
        // Reload user list
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

  const handleAssignAthlete = async () => {
    setAssignFormMessage(null);
    if (!selectedAthleteId) {
      setAssignFormMessage({ text: 'Please select or input an Athlete ID', isError: true });
      return;
    }
    if (!selectedCoachId) {
      setAssignFormMessage({ text: 'Please select or input a Coach ID', isError: true });
      return;
    }

    setIsAssigning(true);
    try {
      if (isUsingFallback) {
        setAssignFormMessage({
          text: 'Athlete assignment processed locally (Fallback Mode)',
          isError: false,
        });
        setSelectedAthleteId('');
        setSelectedCoachId('');
      } else {
        await assignAthleteToCoach(token, selectedAthleteId, selectedCoachId);
        setAssignFormMessage({ text: 'Athlete successfully assigned to Coach!', isError: false });
        setSelectedAthleteId('');
        setSelectedCoachId('');
      }
    } catch (e: any) {
      setAssignFormMessage({ text: e.message || 'Failed to assign athlete', isError: true });
    } finally {
      setIsAssigning(false);
    }
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Welcome Panel */}
      <View style={styles.heroBanner}>
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle}>AthliTech Control Center</Text>
          <Text style={styles.heroSubtitle}>
            Welcome back, <Text style={styles.boldText}>{user?.name || 'Administrator'}</Text>
          </Text>
          {isUsingFallback && (
            <View style={styles.fallbackBadge}>
              <Ionicons name="information-circle" size={14} color="#b45309" />
              <Text style={styles.fallbackText}>API Sandbox (Offline Mock Mode)</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          <Pressable onPress={loadDashboardData} style={styles.iconBtn}>
            <Ionicons name="refresh" size={20} color="#1e293b" />
          </Pressable>
        </View>
      </View>

      {/* Navigation Tab Bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name="grid"
            size={18}
            color={activeTab === 'overview' ? '#3b82f6' : '#647286'}
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'users' && styles.activeTabButton]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === 'users' ? '#3b82f6' : '#647286'}
          />
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'roles' && styles.activeTabButton]}
          onPress={() => setActiveTab('roles')}
        >
          <Ionicons
            name="shield"
            size={18}
            color={activeTab === 'roles' ? '#3b82f6' : '#647286'}
          />
          <Text style={[styles.tabText, activeTab === 'roles' && styles.activeTabText]}>
            Roles
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'assign' && styles.activeTabButton]}
          onPress={() => setActiveTab('assign')}
        >
          <Ionicons
            name="git-compare"
            size={18}
            color={activeTab === 'assign' ? '#3b82f6' : '#647286'}
          />
          <Text style={[styles.tabText, activeTab === 'assign' && styles.activeTabText]}>
            Assign
          </Text>
        </Pressable>
      </View>

      {isLoadingData ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loaderText}>Loading dashboard workspace...</Text>
        </View>
      ) : (
        <>
          {/* Metrics Grid */}
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

          {/* Tab Views */}
          {activeTab === 'overview' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Management Actions</Text>
              <View style={styles.actionGrid}>
                <Pressable
                  style={styles.actionCard}
                  onPress={() => setActiveTab('users')}
                >
                  <Ionicons name="people-circle" size={32} color="#3b82f6" />
                  <Text style={styles.actionCardTitle}>Manage Users</Text>
                  <Text style={styles.actionCardDesc}>Review list, assign roles, inspect users.</Text>
                </Pressable>

                <Pressable
                  style={styles.actionCard}
                  onPress={() => setActiveTab('roles')}
                >
                  <Ionicons name="shield-checkmark" size={32} color="#10b981" />
                  <Text style={styles.actionCardTitle}>Manage Roles</Text>
                  <Text style={styles.actionCardDesc}>Create new roles and update system permissions.</Text>
                </Pressable>

                <Pressable
                  style={styles.actionCard}
                  onPress={() => setActiveTab('assign')}
                >
                  <Ionicons name="git-network-outline" size={32} color="#f59e0b" />
                  <Text style={styles.actionCardTitle}>Assign Athlete</Text>
                  <Text style={styles.actionCardDesc}>Map athletes to their designated coaches.</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionCard, styles.logoutActionCard]}
                  onPress={onSignOut}
                >
                  <Ionicons name="log-out" size={32} color="#ef4444" />
                  <Text style={[styles.actionCardTitle, { color: '#ef4444' }]}>Logout</Text>
                  <Text style={styles.actionCardDesc}>Securely sign out of your administrator account.</Text>
                </Pressable>
              </View>
            </View>
          )}

          {activeTab === 'users' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>User Registry ({filteredUsers.length})</Text>
                <TextInput
                  style={styles.searchBar}
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
                      <View key={item.id} style={styles.userListItem}>
                        <View style={styles.userInfo}>
                          <Text style={styles.userNameText}>{item.name}</Text>
                          <Text style={styles.userEmailText}>{item.email}</Text>
                          <Text style={styles.userIdText}>ID: {item.id}</Text>
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

                        <View style={styles.userRoleEdit}>
                          <Text style={styles.smallLabel}>Assign Role:</Text>
                          <View style={styles.rolePickerRow}>
                            {roles.map((r) => (
                              <Pressable
                                key={r.name}
                                style={[
                                  styles.roleSelectChip,
                                  selectedRole === r.name && styles.roleSelectChipActive,
                                ]}
                                onPress={() =>
                                  setUpdatingUserRoleMap((prev) => ({
                                    ...prev,
                                    [item.id]: r.name,
                                  }))
                                }
                              >
                                <Text
                                  style={[
                                    styles.roleSelectChipText,
                                    selectedRole === r.name && styles.roleSelectChipTextActive,
                                  ]}
                                >
                                  {r.name}
                                </Text>
                              </Pressable>
                            ))}
                          </View>

                          {selectedRole !== item.role && (
                            <Pressable
                              style={styles.saveRoleButton}
                              onPress={() => handleUpdateUserRole(item.id)}
                            >
                              <Text style={styles.saveRoleButtonText}>Apply Role</Text>
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

          {activeTab === 'roles' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>System Roles</Text>
              <View style={styles.rolesGrid}>
                {roles.map((r) => (
                  <View key={r.name} style={styles.roleDetailCard}>
                    <View style={styles.roleBadgeHeader}>
                      <Ionicons name="shield-checkmark" size={16} color="#475569" />
                      <Text style={styles.roleTitle}>{r.name.toUpperCase()}</Text>
                    </View>
                    <View style={styles.permissionsContainer}>
                      {r.permissions.map((p) => (
                        <View key={p} style={styles.permissionChip}>
                          <Text style={styles.permissionText}>{p}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
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

          {activeTab === 'assign' && (
            <View style={styles.section}>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Coach–Athlete Assignment</Text>
                <Text style={styles.formDesc}>
                  Map athletes to specialized coaches for dynamic performance management.
                </Text>

                {assignFormMessage && (
                  <Text
                    style={[
                      styles.formMessage,
                      assignFormMessage.isError ? styles.errorText : styles.successText,
                    ]}
                  >
                    {assignFormMessage.text}
                  </Text>
                )}

                {/* Athlete Select / Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Athlete</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Athlete ID (or select from list below)"
                    placeholderTextColor="#94a3b8"
                    value={selectedAthleteId}
                    onChangeText={setSelectedAthleteId}
                  />
                </View>

                {/* Coach Select / Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Coach</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Coach ID (or select from list below)"
                    placeholderTextColor="#94a3b8"
                    value={selectedCoachId}
                    onChangeText={setSelectedCoachId}
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                    isAssigning && styles.buttonDisabled,
                  ]}
                  onPress={handleAssignAthlete}
                  disabled={isAssigning}
                >
                  {isAssigning ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Confirm Mapping</Text>
                  )}
                </Pressable>
              </View>

              {/* Utility lists for easy copy-pasting of IDs */}
              <View style={styles.helperListsContainer}>
                <View style={styles.helperList}>
                  <Text style={styles.helperTitle}>Athletes List</Text>
                  {athletesList.length === 0 ? (
                    <Text style={styles.helperEmptyText}>No registered athletes.</Text>
                  ) : (
                    athletesList.map((a) => (
                      <Pressable
                        key={a.id}
                        style={[
                          styles.helperItem,
                          selectedAthleteId === a.id && styles.helperItemActive,
                        ]}
                        onPress={() => setSelectedAthleteId(a.id)}
                      >
                        <Text style={styles.helperItemName}>{a.name}</Text>
                        <Text style={styles.helperItemId}>{a.id}</Text>
                      </Pressable>
                    ))
                  )}
                </View>

                <View style={styles.helperList}>
                  <Text style={styles.helperTitle}>Coaches List</Text>
                  {coachesList.length === 0 ? (
                    <Text style={styles.helperEmptyText}>No registered coaches.</Text>
                  ) : (
                    coachesList.map((c) => (
                      <Pressable
                        key={c.id}
                        style={[
                          styles.helperItem,
                          selectedCoachId === c.id && styles.helperItemActive,
                        ]}
                        onPress={() => setSelectedCoachId(c.id)}
                      >
                        <Text style={styles.helperItemName}>{c.name}</Text>
                        <Text style={styles.helperItemId}>{c.id}</Text>
                      </Pressable>
                    ))
                  )}
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

// Media Query / Responsive helpers
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = width > 768;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: isLargeScreen ? 32 : 16,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  heroBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    color: '#f8fafc',
    fontSize: isLargeScreen ? 28 : 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 6,
  },
  boldText: {
    fontWeight: '700',
    color: '#3b82f6',
  },
  fallbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  fallbackText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    backgroundColor: '#f1f5f9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    color: '#647286',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  loaderContainer: {
    padding: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#647286',
    fontSize: 15,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: isWeb || isLargeScreen ? 1 : undefined,
    width: isWeb || isLargeScreen ? undefined : '100%',
    minWidth: 200,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderLeftWidth: 5,
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: isLargeScreen ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: isLargeScreen ? 'center' : 'stretch',
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
    width: isLargeScreen ? 300 : '100%',
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
    width: isLargeScreen ? '48%' : '100%',
    minWidth: 260,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  logoutActionCard: {
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
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
  },
  userList: {
    gap: 12,
  },
  userListItem: {
    flexDirection: isLargeScreen ? 'row' : 'column',
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
    alignItems: isLargeScreen ? 'flex-end' : 'flex-start',
    gap: 8,
  },
  smallLabel: {
    fontSize: 12,
    color: '#647286',
    fontWeight: '600',
  },
  rolePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
  },
  roleSelectChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  roleSelectChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  roleSelectChipTextActive: {
    color: '#1d4ed8',
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
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  roleDetailCard: {
    flex: isWeb || isLargeScreen ? 1 : undefined,
    width: isWeb || isLargeScreen ? undefined : '100%',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  formDesc: {
    fontSize: 14,
    color: '#647286',
    marginTop: 4,
    marginBottom: 20,
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
  helperListsContainer: {
    flexDirection: isLargeScreen ? 'row' : 'column',
    gap: 16,
    marginTop: 24,
  },
  helperList: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  helperTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
  },
  helperEmptyText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  helperItem: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperItemActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  helperItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  helperItemId: {
    fontSize: 11,
    color: '#647286',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
