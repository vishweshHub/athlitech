import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
} from 'react-native';

import type { Athlete, Coach } from '@/api/admin';
import { fetchAthleteById, fetchCoachById } from '@/api/admin';
import type { AuthUser } from '@/api/auth';
import type { Workout } from '@/api/workout';
import { fetchAthleteWorkouts, updateWorkoutStatus } from '@/api/workout';
import type { PerformanceRecord } from '@/api/performance';
import { fetchAthletePerformances } from '@/api/performance';
import { Ionicons } from '@expo/vector-icons';

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonMeta}>
          <View style={styles.skeletonLineShort} />
          <View style={styles.skeletonLineLong} />
        </View>
      </View>
      <View style={styles.skeletonDivider} />
      <View style={styles.skeletonFooter}>
        <View style={styles.skeletonLineMedium} />
        <View style={styles.skeletonButton} />
      </View>
    </View>
  );
}

interface AthleteDashboardScreenProps {
  user: AuthUser | null;
  token: string;
  onSignOut: () => void;
}

export default function AthleteDashboardScreen({ user, token, onSignOut }: AthleteDashboardScreenProps) {
  const router = useRouter();
  
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'workouts' | 'performance'>('workouts');

  // Workouts State
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  // Performance State
  const [performances, setPerformances] = useState<PerformanceRecord[]>([]);
  const [isPerfLoading, setIsPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState<string | null>(null);

  // Completion modal state
  const [selectedWorkoutForCompletion, setSelectedWorkoutForCompletion] = useState<Workout | null>(null);
  const [completionStatus, setCompletionStatus] = useState<'completed' | 'skipped' | 'pending' | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState('100');
  const [athleteNotes, setAthleteNotes] = useState('');
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);


  // Get athlete_id from user - it should be the same as user.id or we need to fetch it
  const athleteId = user?.id;

  useEffect(() => {
    if (!athleteId || !token) {
      return;
    }

    async function loadDashboardData() {
      setIsLoading(true);
      setError(null);
      
      try {
        let athleteData: Athlete;
        try {
          athleteData = await fetchAthleteById(token, athleteId as string);
          setAthlete(athleteData);

          // Fetch coach details if athlete has a coach assigned
          if (athleteData.coach_id) {
            try {
              const coachData = await fetchCoachById(token, athleteData.coach_id);
              setCoach(coachData);
            } catch (coachError) {
              console.warn('Failed to fetch coach details:', coachError);
              // Coach details are optional, don't fail the whole page
            }
          }
        } catch (e) {
          const errMessage = e instanceof Error ? e.message.toLowerCase() : '';
          const is404 = errMessage.includes('404') || errMessage.includes('not found') || errMessage.includes('no athlete');
          if (is404 && user) {
            athleteData = {
              athlete_id: athleteId as string,
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

        // Fetch athlete workouts
        const workoutsData = await fetchAthleteWorkouts(token, athleteId as string);
        setWorkouts(workoutsData);

      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load dashboard data';
        console.warn('Error loading athlete dashboard data:', e);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [athleteId, token]);

  useEffect(() => {
    if (!athleteId || !token || activeTab !== 'performance') {
      return;
    }

    async function loadPerformanceData() {
      setIsPerfLoading(true);
      setPerfError(null);
      try {
        const data = await fetchAthletePerformances(token, athleteId as string);
        const sorted = [...data].sort((a, b) => {
          const dateA = a.date || a.recorded_at || '';
          const dateB = b.date || b.recorded_at || '';
          return dateB.localeCompare(dateA);
        });
        setPerformances(sorted);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load performance data';
        console.warn('Error loading performance data:', e);
        setPerfError(message);
      } finally {
        setIsPerfLoading(false);
      }
    }

    loadPerformanceData();
  }, [athleteId, token, activeTab]);


  const handleUpdateStatus = async (workoutId: string, status: 'pending' | 'completed' | 'skipped') => {
    try {
      await updateWorkoutStatus(token, workoutId, status);
      
      // Update local state immediately
      setWorkouts(prevWorkouts =>
        prevWorkouts.map(w =>
          w.workout_id === workoutId
            ? {
                ...w,
                status,
                completed_at: undefined,
                completion_percentage: undefined,
                athlete_notes: undefined
              }
            : w
        )
      );
    } catch (e) {
      console.warn('Failed to update workout status:', e);
      alert('Failed to update workout status: ' + (e instanceof Error ? e.message : 'Unknown error'));
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

  if (!user || !token) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredStatus}>
          <Text style={styles.errorText}>Session expired. Please log in again.</Text>
          <Pressable onPress={onSignOut} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Go to Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>My Dashboard</Text>
            <Text style={styles.headerSubtitle}>{user?.email || 'Athlete'}</Text>
          </View>
          <Pressable onPress={onSignOut} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {isLoading ? (
            <View style={styles.skeletonContainer}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => router.back()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Go Back</Text>
              </Pressable>
            </View>
          ) : !athlete ? (
            <View style={styles.errorContainer}>
              <Ionicons name="person-outline" size={48} color="#94a3b8" />
              <Text style={styles.errorText}>Profile not found</Text>
              <Pressable onPress={() => router.back()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Go Back</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Profile Card */}
              <View style={styles.profileCard}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.avatarText}>
                    {athlete.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileDetails}>
                  <Text style={styles.profileName}>{athlete.name}</Text>
                  <Text style={styles.profileSport}>{athlete.sport || 'No sport specified'}</Text>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Athlete ID</Text>
                      <Text style={styles.infoValue}>{athlete.athlete_id}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Weight</Text>
                      <Text style={styles.infoValue}>
                        {athlete.weight ? `${athlete.weight} kg` : 'Not specified'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Role</Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Athlete</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Tab Selector */}
              <View style={styles.tabContainer}>
                <Pressable
                  style={[styles.tabButton, activeTab === 'workouts' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('workouts')}
                >
                  <Ionicons name="fitness-outline" size={20} color={activeTab === 'workouts' ? '#3b82f6' : '#647286'} />
                  <Text style={[styles.tabButtonText, activeTab === 'workouts' && styles.tabButtonTextActive]}>
                    Workouts
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.tabButton, activeTab === 'performance' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('performance')}
                >
                  <Ionicons name="speedometer-outline" size={20} color={activeTab === 'performance' ? '#3b82f6' : '#647286'} />
                  <Text style={[styles.tabButtonText, activeTab === 'performance' && styles.tabButtonTextActive]}>
                    My Performance
                  </Text>
                </Pressable>
              </View>

              {activeTab === 'workouts' && (
                <>
                  {/* Coach Information */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Coach</Text>
                    {coach ? (
                      <View style={styles.coachCard}>
                        <View style={styles.coachHeader}>
                          <View style={styles.coachAvatar}>
                            <Text style={styles.coachAvatarText}>
                              {coach.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.coachInfo}>
                            <Text style={styles.coachName}>{coach.name}</Text>
                            <Text style={styles.coachEmail}>{coach.email}</Text>
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{coach.role}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.emptyCoachCard}>
                        <Ionicons name="person-outline" size={40} color="#cbd5e1" />
                        <Text style={styles.emptyCoachText}>No coach assigned yet</Text>
                      </View>
                    )}
                  </View>

                  {/* My Workouts Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Workouts ({workouts.length})</Text>
                    {workouts.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Ionicons name="fitness-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No workouts assigned to you yet.</Text>
                      </View>
                    ) : (
                      <View style={styles.workoutsList}>
                        {workouts.map((w) => (
                          <View key={w.workout_id} style={styles.workoutCard}>
                            <View style={styles.workoutCardHeader}>
                              <View style={styles.workoutMetaCol}>
                                <Text style={styles.workoutTitleText}>{w.title}</Text>
                                <Text style={styles.workoutDate}>Target Date: {w.date}</Text>
                              </View>
                              <View style={[
                                styles.statusBadge,
                                w.status === 'completed' && styles.statusCompleted,
                                w.status === 'skipped' && styles.statusSkipped
                              ]}>
                                <Text style={[
                                  styles.statusBadgeText,
                                  w.status === 'completed' && styles.statusCompletedText,
                                  w.status === 'skipped' && styles.statusSkippedText
                                ]}>
                                  {w.status.toUpperCase()}
                                </Text>
                              </View>
                            </View>

                            {w.description ? (
                              <Text style={styles.workoutDesc}>{w.description}</Text>
                            ) : null}

                            <View style={styles.exercisesList}>
                              <Text style={styles.exercisesListTitle}>Exercises:</Text>
                              {w.exercises.map((ex, idx) => (
                                <View key={idx} style={styles.exerciseItemRow}>
                                  <Ionicons name="ellipse" size={6} color="#3b82f6" />
                                  <Text style={styles.exerciseItemText}>
                                    {ex.name} — {ex.sets} sets × {ex.reps} reps {ex.duration ? `(${ex.duration})` : ''}
                                  </Text>
                                </View>
                              ))}
                            </View>

                            {/* Status controls */}
                            <View style={styles.statusControlsRow}>
                              <Pressable
                                style={[
                                  styles.statusControlBtn,
                                  w.status === 'pending' && { backgroundColor: '#f1f5f9', borderColor: '#475569' }
                                ]}
                                onPress={() => handleUpdateStatusClick(w, 'pending')}
                              >
                                <Text style={[
                                  styles.statusControlBtnText,
                                  w.status === 'pending' && { color: '#475569', fontWeight: '700' }
                                ]}>Pending</Text>
                              </Pressable>

                              <Pressable
                                style={[
                                  styles.statusControlBtn,
                                  w.status === 'completed' && { backgroundColor: '#d1fae5', borderColor: '#10b981' }
                                ]}
                                onPress={() => handleUpdateStatusClick(w, 'completed')}
                              >
                                <Text style={[
                                  styles.statusControlBtnText,
                                  w.status === 'completed' && { color: '#065f46', fontWeight: '700' }
                                ]}>Completed</Text>
                              </Pressable>

                              <Pressable
                                style={[
                                  styles.statusControlBtn,
                                  w.status === 'skipped' && { backgroundColor: '#fee2e2', borderColor: '#f87171' }
                                ]}
                                onPress={() => handleUpdateStatusClick(w, 'skipped')}
                              >
                                <Text style={[
                                  styles.statusControlBtnText,
                                  w.status === 'skipped' && { color: '#991b1b', fontWeight: '700' }
                                ]}>Skipped</Text>
                              </Pressable>
                            </View>

                            {/* Completion Details Preview */}
                            {(w.status === 'completed' || w.status === 'skipped') && (w.completed_at || w.completion_percentage !== undefined) ? (
                              <View style={styles.completionDetailsCard}>
                                <Text style={styles.completionDetailsTitle}>Completion Record</Text>
                                <Text style={styles.completionDetailsText}>
                                  Date: {w.completed_at || 'Not recorded'}
                                </Text>
                                <Text style={styles.completionDetailsText}>
                                  Percentage: {w.completion_percentage ?? 100}%
                                </Text>
                                {w.athlete_notes ? (
                                  <Text style={styles.completionDetailsText}>
                                    Notes: "{w.athlete_notes}"
                                  </Text>
                                ) : null}
                              </View>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Additional Information */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile Information</Text>
                    <View style={styles.infoCard}>
                      <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={20} color="#647286" />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Full Name</Text>
                          <Text style={styles.infoValue}>{athlete.name}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.divider} />
                      
                      <View style={styles.infoRow}>
                        <Ionicons name="fitness-outline" size={20} color="#647286" />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Sport</Text>
                          <Text style={styles.infoValue}>{athlete.sport || 'Not specified'}</Text>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.infoRow}>
                        <Ionicons name="scale-outline" size={20} color="#647286" />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Weight</Text>
                          <Text style={styles.infoValue}>
                            {athlete.weight ? `${athlete.weight} kg` : 'Not specified'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.infoRow}>
                        <Ionicons name="ribbon-outline" size={20} color="#647286" />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Role</Text>
                          <Text style={styles.infoValue}>Athlete</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </>
              )}

              {activeTab === 'performance' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>My Performance History ({performances.length})</Text>
                  {isPerfLoading ? (
                    <View style={styles.skeletonContainer}>
                      <SkeletonCard />
                      <SkeletonCard />
                    </View>
                  ) : perfError ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{perfError}</Text>
                    </View>
                  ) : performances.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="speedometer-outline" size={48} color="#cbd5e1" />
                      <Text style={styles.emptyText}>No performance records logged by your coach yet.</Text>
                    </View>
                  ) : (
                    <View style={styles.perfList}>
                      {performances.map((perf) => {
                        const linkedWorkout = workouts.find((w) => w.workout_id === perf.workout_id);
                        const isLinked = !!perf.workout_id;
                        
                        return (
                          <View key={perf.performance_id} style={styles.perfCard}>
                            {isLinked ? (
                              <>
                                <View style={styles.perfCardHeader}>
                                  <View style={styles.perfDateCol}>
                                    <Ionicons name="calendar-outline" size={16} color="#647286" />
                                    <Text style={styles.perfDateText}>{perf.recorded_at || (perf.created_at ? String(perf.created_at).substring(0, 10) : '')}</Text>
                                  </View>
                                  <View style={styles.perfTimeBadge}>
                                    <Ionicons name="trophy-outline" size={14} color="#047857" />
                                    <Text style={styles.perfTimeBadgeText}>
                                      {perf.sport_event}: {perf.value} {perf.unit}
                                    </Text>
                                  </View>
                                </View>
                                
                                <View style={styles.perfWorkoutRow}>
                                  <Ionicons name="fitness-outline" size={16} color="#3b82f6" />
                                  <Text style={styles.perfWorkoutTitleText}>
                                    Workout: {linkedWorkout ? linkedWorkout.title : 'Workout Session'}
                                  </Text>
                                </View>

                                {perf.feedback ? (
                                  <View style={styles.remarksBox}>
                                    <Text style={styles.remarksLabel}>Coach Feedback:</Text>
                                    <Text style={styles.remarksText}>{perf.feedback}</Text>
                                  </View>
                                ) : null}
                              </>
                            ) : (
                              <>
                                <View style={styles.perfCardHeader}>
                                  <View style={styles.perfDateCol}>
                                    <Ionicons name="calendar-outline" size={16} color="#647286" />
                                    <Text style={styles.perfDateText}>{perf.date}</Text>
                                  </View>
                                  <View style={styles.perfTimeBadge}>
                                    <Ionicons name="stopwatch-outline" size={14} color="#047857" />
                                    <Text style={styles.perfTimeBadgeText}>{perf.sprint_time}s</Text>
                                  </View>
                                </View>
                                
                                <View style={styles.perfMetricsRow}>
                                  <View style={styles.perfMetricBox}>
                                    <Text style={styles.perfMetricLabel}>Weight</Text>
                                    <Text style={styles.perfMetricVal}>{perf.weight} kg</Text>
                                  </View>
                                  <View style={styles.perfMetricBox}>
                                    <Text style={styles.perfMetricLabel}>Height</Text>
                                    <Text style={styles.perfMetricVal}>{perf.height} cm</Text>
                                  </View>
                                </View>

                                {perf.coach_remarks ? (
                                  <View style={styles.remarksBox}>
                                    <Text style={styles.remarksLabel}>Coach Remarks:</Text>
                                    <Text style={styles.remarksText}>{perf.coach_remarks}</Text>
                                  </View>
                                ) : null}
                              </>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>

      {/* Completion Modal */}
      <Modal
        visible={selectedWorkoutForCompletion !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedWorkoutForCompletion(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Record Completion
            </Text>
            <Text style={styles.modalSubtitle}>
              Workout: {selectedWorkoutForCompletion?.title}
            </Text>
            
            {/* Completion Percentage */}
            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalLabel}>Completion Percentage (0-100%)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={completionPercentage}
                onChangeText={(val) => {
                  const clean = val.replace(/[^0-9]/g, '');
                  const num = parseInt(clean) || 0;
                  if (num > 100) {
                    setCompletionPercentage('100');
                  } else {
                    setCompletionPercentage(clean);
                  }
                }}
              />
            </View>

            {/* Athlete Notes */}
            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalLabel}>Athlete Notes (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="How did it feel? Any issues or highlights?"
                placeholderTextColor="#94a3b8"
                multiline={true}
                numberOfLines={3}
                value={athleteNotes}
                onChangeText={setAthleteNotes}
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setSelectedWorkoutForCompletion(null)}
                disabled={isSavingCompletion}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.submitButton]}
                onPress={async () => {
                  if (!selectedWorkoutForCompletion || !completionStatus) return;
                  setIsSavingCompletion(true);
                  try {
                    const now = new Date();
                    const yyyy = now.getFullYear();
                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                    const dd = String(now.getDate()).padStart(2, '0');
                    const hh = String(now.getHours()).padStart(2, '0');
                    const min = String(now.getMinutes()).padStart(2, '0');
                    const ss = String(now.getSeconds()).padStart(2, '0');
                    const completedAt = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;

                    const pct = parseInt(completionPercentage) || 0;

                    await updateWorkoutStatus(
                      token,
                      selectedWorkoutForCompletion.workout_id,
                      completionStatus,
                      completedAt,
                      pct,
                      athleteNotes.trim() || undefined
                    );

                    // Update local state immediately
                    setWorkouts(prevWorkouts =>
                      prevWorkouts.map(w =>
                        w.workout_id === selectedWorkoutForCompletion.workout_id
                          ? {
                              ...w,
                              status: completionStatus,
                              completed_at: completedAt,
                              completion_percentage: pct,
                              athlete_notes: athleteNotes.trim() || undefined
                            }
                          : w
                      )
                    );

                    setSelectedWorkoutForCompletion(null);
                  } catch (err: any) {
                    alert('Failed to save completion: ' + err.message);
                  } finally {
                    setIsSavingCompletion(false);
                  }
                }}
                disabled={isSavingCompletion}
              >
                {isSavingCompletion ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Completion</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentInner: {
    padding: 24,
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
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
      default: {},
    }),
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  centeredStatus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 24,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  profileDetails: {
    gap: 12,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  profileSport: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#647286',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  coachCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  coachAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  coachInfo: {
    flex: 1,
    gap: 4,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  coachEmail: {
    fontSize: 13,
    color: '#647286',
  },
  emptyCoachCard: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  emptyCoachText: {
    color: '#647286',
    fontSize: 15,
    marginTop: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
  },
  infoContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#647286',
    textAlign: 'center',
  },
  workoutsList: {
    gap: 16,
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  workoutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  workoutMetaCol: {
    flex: 1,
  },
  workoutTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
  },
  statusCompletedText: {
    color: '#065f46',
  },
  statusSkipped: {
    backgroundColor: '#fee2e2',
  },
  statusSkippedText: {
    color: '#991b1b',
  },
  workoutDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  workoutDate: {
    fontSize: 12,
    color: '#647286',
    marginTop: 2,
  },
  exercisesList: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 12,
    gap: 6,
  },
  exercisesListTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  exerciseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseItemText: {
    fontSize: 13,
    color: '#334155',
  },
  statusControlsRow: {
    flexDirection: 'row',
    borderTopColor: '#f1f5f9',
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  statusControlBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderColor: '#cbd5e1',
    borderWidth: 1,
    backgroundColor: '#fff',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
      default: {},
    }),
  },
  statusControlBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#647286',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 8,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
      default: {},
    }),
  },
  tabButtonActive: {
    backgroundColor: '#eff6ff',
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#647286',
  },
  tabButtonTextActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  perfList: {
    gap: 16,
  },
  perfCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  perfCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perfDateCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perfDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  perfTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  perfTimeBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
  },
  perfMetricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  perfMetricBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  perfMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#647286',
    textTransform: 'uppercase',
  },
  perfMetricVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  remarksBox: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  remarksLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7e22ce',
  },
  remarksText: {
    fontSize: 13,
    color: '#581c87',
    lineHeight: 18,
  },
  skeletonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
  },
  skeletonMeta: {
    flex: 1,
    gap: 8,
  },
  skeletonLineShort: {
    height: 14,
    width: '40%',
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  skeletonLineLong: {
    height: 10,
    width: '70%',
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  skeletonLineMedium: {
    height: 12,
    width: '50%',
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonButton: {
    height: 32,
    width: 60,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
  },
  perfWorkoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  perfWorkoutTitleText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  completionDetailsCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  completionDetailsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  completionDetailsText: {
    fontSize: 12,
    color: '#647286',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#647286',
    marginTop: -8,
    marginBottom: 8,
  },
  modalFieldGroup: {
    gap: 8,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  modalInput: {
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  modalTextArea: {
    height: 80,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
      default: {},
    }),
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});