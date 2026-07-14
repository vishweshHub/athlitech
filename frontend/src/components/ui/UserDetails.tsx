import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Card from './Card';
import Badge from './Badge';
import StatCard from './StatCard';
import Table from './Table';
import EmptyState from './EmptyState';
import { useThemeColors, RADIUS } from '@/styles/tokens';

export interface UserDetailsProps {
  profile: {
    id: string;
    name: string;
    email: string;
    role: 'athlete' | 'coach' | 'admin' | string;
    sport?: string;
    weight?: string;
    status?: string;
  };
  isLoading?: boolean;
  error?: string | null;
  
  // Athlete-specific data
  coach?: {
    id: string;
    name: string;
    email: string;
  } | null;
  workouts?: any[];
  performances?: any[];
  
  // Coach-specific data
  athletes?: any[];
  
  // Admin-specific data
  systemStats?: {
    totalUsers: number;
    totalCoaches: number;
    totalAthletes: number;
    totalRoles: number;
  };
  recentActivities?: any[];
  
  onBack?: () => void;
}

export default function UserDetails({
  profile,
  isLoading = false,
  error = null,
  coach = null,
  workouts = [],
  performances = [],
  athletes = [],
  systemStats,
  recentActivities = [],
  onBack,
}: UserDetailsProps) {
  const colors = useThemeColors();
  const router = useRouter();

  // Hover states for premium glass interaction
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const role = profile?.role?.toLowerCase() || 'athlete';
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.emerald} />
        <Text style={[styles.loaderText, { color: colors.textSub }]}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg, padding: 24 }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error || 'User not found'}</Text>
        <Pressable
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: colors.bgMid, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={16} color={colors.textPrimary} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // Determine avatar background gradient color
  const getAvatarBg = () => {
    switch (role) {
      case 'admin':
        return '#ef4444'; // Red
      case 'coach':
        return '#8b5cf6'; // Purple
      default:
        return '#10b981'; // Emerald
    }
  };

  // Compile athlete metrics
  const athleteTotalWorkouts = workouts.length;
  const athleteCompletedWorkouts = workouts.filter(w => w.status === 'completed').length;
  const athleteCompletionRate = athleteTotalWorkouts > 0 
    ? Math.round((athleteCompletedWorkouts / athleteTotalWorkouts) * 100)
    : 0;

  // Compile coach metrics
  const coachTotalAthletes = athletes.length;
  const coachTotalWorkouts = workouts.length;
  const coachCompletedWorkouts = workouts.filter(w => w.status === 'completed').length;

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.bg }]} contentContainerStyle={styles.scrollInner}>
      {/* Back Header navigation */}
      <View style={styles.topNav}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: pressed ? colors.bgMid : colors.bgCard,
              borderColor: colors.border,
            }
          ]}
        >
          <Ionicons name="arrow-back" size={16} color={colors.textPrimary} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13 }}>Back to Registry</Text>
        </Pressable>
      </View>

      {/* Profile Header Grid Card */}
      <Pressable
        onHoverIn={() => setHoveredCard('header')}
        onHoverOut={() => setHoveredCard(null)}
        style={{ width: '100%', marginBottom: 24 }}
      >
        <Card
          style={[
            styles.headerCard,
            hoveredCard === 'header' && { borderColor: colors.emerald },
          ]}
        >
          <View style={styles.headerRow}>
            {/* Large Avatar */}
            <View style={[styles.avatar, { backgroundColor: getAvatarBg() }]}>
              <Text style={styles.avatarText}>
                {profile.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            {/* Profile Info Details */}
            <View style={styles.headerInfo}>
              <View style={styles.titleBadgeRow}>
                <Text style={[styles.fullName, { color: colors.textPrimary }]}>{profile.name}</Text>
                <View style={{ gap: 8, flexDirection: 'row', alignItems: 'center' }}>
                  <Badge
                    label={profile.role.toUpperCase()}
                    variant={role === 'admin' ? 'error' : role === 'coach' ? 'success' : 'info'}
                  />
                  <Badge
                    label={profile.status || 'ACTIVE'}
                    variant="success"
                  />
                </View>
              </View>

              <Text style={[styles.refId, { color: colors.textMuted }]}>
                ID: {profile.id}
              </Text>
              
              <View style={styles.headerMetaList}>
                <View style={styles.metaItem}>
                  <Ionicons name="mail-outline" size={16} color={colors.textSub} />
                  <Text style={[styles.metaText, { color: colors.textSub }]}>{profile.email}</Text>
                </View>
                {profile.sport && (
                  <View style={styles.metaItem}>
                    <Ionicons name="fitness-outline" size={16} color={colors.textSub} />
                    <Text style={[styles.metaText, { color: colors.textSub }]}>{profile.sport}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Card>
      </Pressable>

      {/* Role-Specific Metric Summary Cards */}
      {role === 'athlete' && (
        <View style={styles.metricsGrid}>
          <View style={styles.metricCol}>
            <StatCard title="Assigned Workouts" value={athleteTotalWorkouts} suffix="total" trend="+12%" trendType="up" />
          </View>
          <View style={styles.metricCol}>
            <StatCard title="Completed Workouts" value={athleteCompletedWorkouts} suffix="completed" trend="+8%" trendType="up" />
          </View>
          <View style={styles.metricCol}>
            <StatCard title="Completion Rate" value={athleteCompletionRate} suffix="%" trend="+5%" trendType="up" />
          </View>
        </View>
      )}

      {role === 'coach' && (
        <View style={styles.metricsGrid}>
          <View style={styles.metricCol}>
            <StatCard title="Assigned Athletes" value={coachTotalAthletes} suffix="athletes" />
          </View>
          <View style={styles.metricCol}>
            <StatCard title="Workouts Assigned" value={coachTotalWorkouts} suffix="workouts" />
          </View>
          <View style={styles.metricCol}>
            <StatCard title="Workouts Completed" value={coachCompletedWorkouts} suffix="completed" />
          </View>
        </View>
      )}

      {role === 'admin' && (
        <View style={styles.metricsGrid}>
          <View style={styles.metricCol}>
            <StatCard title="System Users" value={systemStats?.totalUsers ?? 12} suffix="total" />
          </View>
          <View style={styles.metricCol}>
            <StatCard title="Coaches Registered" value={systemStats?.totalCoaches ?? 4} suffix="coaches" />
          </View>
          <View style={styles.metricCol}>
            <StatCard title="Athletes Registered" value={systemStats?.totalAthletes ?? 8} suffix="athletes" />
          </View>
        </View>
      )}

      {/* Main Content Layout Grid */}
      <View style={styles.contentGrid}>
        
        {/* Left Column - Personal and Relational Details */}
        <View style={styles.leftCol}>
          
          {/* Profile Card */}
          <Pressable
            onHoverIn={() => setHoveredCard('personal')}
            onHoverOut={() => setHoveredCard(null)}
            style={{ width: '100%', marginBottom: 24 }}
          >
            <Card style={hoveredCard === 'personal' && { borderColor: colors.emerald }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Personal Information</Text>
              
              <View style={styles.infoField}>
                <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Full Name</Text>
                <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>{profile.name}</Text>
              </View>
              
              <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

              <View style={styles.infoField}>
                <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Email Address</Text>
                <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>{profile.email}</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

              <View style={styles.infoField}>
                <Text style={[styles.fieldLabel, { color: colors.textSub }]}>User Role</Text>
                <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>{profile.role.toUpperCase()}</Text>
              </View>

              {role === 'athlete' && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
                  <View style={styles.infoField}>
                    <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Sport Focus</Text>
                    <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>{profile.sport || 'Not Specified'}</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
                  <View style={styles.infoField}>
                    <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Body Weight</Text>
                    <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>
                      {profile.weight ? `${profile.weight} kg` : 'Not Specified'}
                    </Text>
                  </View>
                </>
              )}
            </Card>
          </Pressable>

          {/* Athlete role -> Assigned Coach Card */}
          {role === 'athlete' && (
            <Pressable
              onHoverIn={() => setHoveredCard('coach')}
              onHoverOut={() => setHoveredCard(null)}
              style={{ width: '100%', marginBottom: 24 }}
            >
              <Card style={hoveredCard === 'coach' && { borderColor: colors.emerald }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Assigned Coach</Text>
                {coach ? (
                  <View style={styles.coachBox}>
                    <View style={[styles.coachAvatarSmall, { backgroundColor: '#8b5cf6' }]}>
                      <Text style={styles.avatarTextSmall}>
                        {coach.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.coachNameText, { color: colors.textPrimary }]}>{coach.name}</Text>
                      <Text style={[styles.coachEmailText, { color: colors.textSub }]}>{coach.email}</Text>
                      <View style={{ marginTop: 6 }}>
                        <Badge label="COACH" variant="success" />
                      </View>
                    </View>
                  </View>
                ) : (
                  <EmptyState
                    title="No Coach Assigned"
                    description="This athlete is not currently assigned to any coaching staff."
                    icon="person-add-outline"
                  />
                )}
              </Card>
            </Pressable>
          )}

          {/* Admin role -> System Stats Card */}
          {role === 'admin' && (
            <Pressable
              onHoverIn={() => setHoveredCard('adminRoles')}
              onHoverOut={() => setHoveredCard(null)}
              style={{ width: '100%', marginBottom: 24 }}
            >
              <Card style={hoveredCard === 'adminRoles' && { borderColor: colors.emerald }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>System Summary</Text>
                
                <View style={styles.infoField}>
                  <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Total System Roles</Text>
                  <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>{systemStats?.totalRoles ?? 3}</Text>
                </View>
                
                <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

                <View style={styles.infoField}>
                  <Text style={[styles.fieldLabel, { color: colors.textSub }]}>User Management</Text>
                  <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>Full Access (Admin)</Text>
                </View>
              </Card>
            </Pressable>
          )}

        </View>

        {/* Right Column - Workouts, Athletes, Logs Table Sections */}
        <View style={styles.rightCol}>
          
          {/* Athlete view content: Workouts & Performance tables */}
          {role === 'athlete' && (
            <>
              {/* Workout History */}
              <Pressable
                onHoverIn={() => setHoveredCard('workouts')}
                onHoverOut={() => setHoveredCard(null)}
                style={{ width: '100%', marginBottom: 24 }}
              >
                <Card style={hoveredCard === 'workouts' && { borderColor: colors.emerald }}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 16 }]}>Workout Assignments</Text>
                  
                  {workouts.length === 0 ? (
                    <EmptyState
                      title="No Workouts"
                      description="No workouts have been assigned to this athlete."
                      icon="barbell-outline"
                    />
                  ) : (
                    <Table
                      headers={['Workout Title', 'Status', 'Assigned Date']}
                      data={workouts}
                      renderRow={(w) => (
                        <React.Fragment key={w.workout_id}>
                          <View style={styles.cellWide}>
                            <Text style={[styles.tableMainText, { color: colors.textPrimary }]}>{w.title}</Text>
                            {w.description ? (
                              <Text style={[styles.tableSubText, { color: colors.textSub }]} numberOfLines={1}>
                                {w.description}
                              </Text>
                            ) : null}
                          </View>
                          <View style={styles.cellBadge}>
                            <Badge
                              label={w.status.toUpperCase()}
                              variant={w.status === 'completed' ? 'success' : 'warning'}
                            />
                          </View>
                          <View style={styles.cellDate}>
                            <Text style={[styles.tableSubText, { color: colors.textMuted }]}>
                              {w.completed_at || w.date}
                            </Text>
                          </View>
                        </React.Fragment>
                      )}
                    />
                  )}
                </Card>
              </Pressable>

              {/* Performance & Feedback History */}
              <Pressable
                onHoverIn={() => setHoveredCard('performance')}
                onHoverOut={() => setHoveredCard(null)}
                style={{ width: '100%', marginBottom: 24 }}
              >
                <Card style={hoveredCard === 'performance' && { borderColor: colors.emerald }}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 16 }]}>Performance Records & Feedback</Text>
                  
                  {performances.length === 0 ? (
                    <EmptyState
                      title="No Performance Logs"
                      description="No training metrics or performance logs have been entered."
                      icon="analytics-outline"
                    />
                  ) : (
                    <Table
                      headers={['Event Focus', 'Recorded Value', 'Remarks & Feedback']}
                      data={performances}
                      renderRow={(perf) => {
                        const valStr = perf.value !== undefined ? `${perf.value} ${perf.unit || ''}` : `${perf.sprint_time || 0}s`;
                        const feedbackStr = perf.feedback || perf.coach_remarks || 'No remarks provided';
                        return (
                          <React.Fragment key={perf.performance_id}>
                            <View style={styles.cellWide}>
                              <Text style={[styles.tableMainText, { color: colors.textPrimary }]}>
                                {perf.sport_event || 'Sprint Time'}
                              </Text>
                              <Text style={[styles.tableSubText, { color: colors.textMuted }]}>
                                {perf.recorded_at || perf.date || 'N/A'}
                              </Text>
                            </View>
                            <View style={styles.cellValue}>
                              <View style={[styles.valueTag, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
                                <Text style={[styles.valueTagText, { color: colors.emerald }]}>{valStr}</Text>
                              </View>
                            </View>
                            <View style={styles.cellFeedback}>
                              <Text style={[styles.feedbackText, { color: colors.textSub }]} numberOfLines={2}>
                                {feedbackStr}
                              </Text>
                            </View>
                          </React.Fragment>
                        );
                      }}
                    />
                  )}
                </Card>
              </Pressable>
            </>
          )}

          {/* Coach view content: Assigned Athletes table */}
          {role === 'coach' && (
            <>
              {/* Assigned Athletes */}
              <Pressable
                onHoverIn={() => setHoveredCard('athletes')}
                onHoverOut={() => setHoveredCard(null)}
                style={{ width: '100%', marginBottom: 24 }}
              >
                <Card style={hoveredCard === 'athletes' && { borderColor: colors.emerald }}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 16 }]}>Assigned Athletes</Text>
                  
                  {athletes.length === 0 ? (
                    <EmptyState
                      title="No Assigned Athletes"
                      description="No athletes are currently assigned to this coach."
                      icon="people-outline"
                    />
                  ) : (
                    <Table
                      headers={['Athlete Details', 'ID Reference', 'Sport Focus', 'Weight']}
                      data={athletes}
                      renderRow={(athlete) => (
                        <React.Fragment key={athlete.athlete_id}>
                          <View style={styles.cellWide}>
                            <Text style={[styles.tableMainText, { color: colors.textPrimary }]}>{athlete.name}</Text>
                          </View>
                          <View style={styles.cellId}>
                            <Text style={[styles.tableSubText, { color: colors.textMuted }]}>{athlete.athlete_id}</Text>
                          </View>
                          <View style={styles.cellSport}>
                            <Badge label={athlete.sport || 'ATHLETE'} variant="info" />
                          </View>
                          <View style={styles.cellWeight}>
                            <Text style={[styles.tableSubText, { color: colors.textSub }]}>
                              {athlete.weight ? `${athlete.weight} kg` : 'N/A'}
                            </Text>
                          </View>
                        </React.Fragment>
                      )}
                    />
                  )}
                </Card>
              </Pressable>

              {/* Assigned Workouts & Tracking */}
              <Pressable
                onHoverIn={() => setHoveredCard('assignedLogs')}
                onHoverOut={() => setHoveredCard(null)}
                style={{ width: '100%', marginBottom: 24 }}
              >
                <Card style={hoveredCard === 'assignedLogs' && { borderColor: colors.emerald }}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 16 }]}>Assigned Workouts & History</Text>
                  
                  {workouts.length === 0 ? (
                    <EmptyState
                      title="No Workouts Assigned"
                      description="You have not assigned any workouts."
                      icon="clipboard-outline"
                    />
                  ) : (
                    <Table
                      headers={['Workout Name', 'Status', 'Date Assigned']}
                      data={workouts}
                      renderRow={(w) => (
                        <React.Fragment key={w.workout_id}>
                          <View style={styles.cellWide}>
                            <Text style={[styles.tableMainText, { color: colors.textPrimary }]}>{w.title}</Text>
                            {w.description ? (
                              <Text style={[styles.tableSubText, { color: colors.textSub }]} numberOfLines={1}>
                                {w.description}
                              </Text>
                            ) : null}
                          </View>
                          <View style={styles.cellBadge}>
                            <Badge
                              label={w.status.toUpperCase()}
                              variant={w.status === 'completed' ? 'success' : 'warning'}
                            />
                          </View>
                          <View style={styles.cellDate}>
                            <Text style={[styles.tableSubText, { color: colors.textMuted }]}>
                              {w.completed_at || w.date}
                            </Text>
                          </View>
                        </React.Fragment>
                      )}
                    />
                  )}
                </Card>
              </Pressable>
            </>
          )}

          {/* Admin view content: User statistics & System actions list */}
          {role === 'admin' && (
            <>
              {/* User management and system audits */}
              <Pressable
                onHoverIn={() => setHoveredCard('adminAudits')}
                onHoverOut={() => setHoveredCard(null)}
                style={{ width: '100%', marginBottom: 24 }}
              >
                <Card style={hoveredCard === 'adminAudits' && { borderColor: colors.emerald }}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 16 }]}>Recent Administrative Activities</Text>
                  
                  {recentActivities.length === 0 ? (
                    <EmptyState
                      title="No Admin Activities Logs"
                      description="No administrative activities have been logged in the system."
                      icon="shield-checkmark-outline"
                    />
                  ) : (
                    <Table
                      headers={['Action Triggered', 'Impacted ID', 'Timestamp']}
                      data={recentActivities}
                      renderRow={(act, index) => (
                        <React.Fragment key={index}>
                          <View style={styles.cellWide}>
                            <Text style={[styles.tableMainText, { color: colors.textPrimary }]}>{act.action}</Text>
                            <Text style={[styles.tableSubText, { color: colors.textSub }]}>{act.details}</Text>
                          </View>
                          <View style={styles.cellId}>
                            <Text style={[styles.tableSubText, { color: colors.textMuted }]} numberOfLines={1}>
                              {act.target_id || 'SYSTEM'}
                            </Text>
                          </View>
                          <View style={styles.cellDate}>
                            <Text style={[styles.tableSubText, { color: colors.textMuted }]}>{act.time}</Text>
                          </View>
                        </React.Fragment>
                      )}
                    />
                  )}
                </Card>
              </Pressable>
            </>
          )}

        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollInner: {
    padding: 24,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  topNav: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  headerCard: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    ...Platform.select({
      default: {
        flexDirection: 'row',
      },
      web: {
        flexWrap: 'wrap',
      } as any,
    }),
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerInfo: {
    flex: 1,
    gap: 6,
    minWidth: 260,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  fullName: {
    fontSize: 24,
    fontWeight: '800',
  },
  refId: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '500',
  },
  headerMetaList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  metricCol: {
    flex: 1,
    minWidth: 220,
  },
  contentGrid: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
    alignItems: 'flex-start',
    ...Platform.select({
      default: {
        flexDirection: 'row',
      },
      web: {
        flexWrap: 'wrap',
      } as any,
    }),
  },
  leftCol: {
    flex: 1,
    minWidth: 320,
  },
  rightCol: {
    flex: 2,
    minWidth: 360,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoField: {
    gap: 4,
    paddingVertical: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  coachBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
  },
  coachAvatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextSmall: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  coachNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  coachEmailText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Table custom cell layouts
  cellWide: {
    flex: 2,
    minWidth: 160,
    paddingHorizontal: 16,
    gap: 2,
  },
  cellBadge: {
    flex: 1,
    minWidth: 100,
    paddingHorizontal: 16,
  },
  cellDate: {
    flex: 1,
    minWidth: 120,
    paddingHorizontal: 16,
  },
  cellValue: {
    flex: 1,
    minWidth: 100,
    paddingHorizontal: 16,
  },
  cellFeedback: {
    flex: 2,
    minWidth: 180,
    paddingHorizontal: 16,
  },
  cellId: {
    flex: 1,
    minWidth: 110,
    paddingHorizontal: 16,
  },
  cellSport: {
    flex: 1,
    minWidth: 110,
    paddingHorizontal: 16,
  },
  cellWeight: {
    flex: 1,
    minWidth: 90,
    paddingHorizontal: 16,
  },
  tableMainText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tableSubText: {
    fontSize: 12,
    fontWeight: '500',
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  valueTag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  valueTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
