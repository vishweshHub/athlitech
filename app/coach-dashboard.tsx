import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Athlete } from '@/services/admin';
import { fetchCoachAthletes, fetchCoachById } from '@/services/admin';
import type { AuthUser } from '@/services/auth';
import type { Workout, Exercise } from '@/services/workout';
import { createWorkout, fetchCoachWorkouts } from '@/services/workout';
import type { PerformanceRecord } from '@/services/performance';
import { fetchAthletePerformances, createPerformance } from '@/services/performance';
import { Ionicons } from '@expo/vector-icons';


interface CoachDashboardScreenProps {
  user: AuthUser | null;
  token: string;
  onSignOut: () => void;
}

export default function CoachDashboardScreen({ user, token, onSignOut }: CoachDashboardScreenProps) {
  const router = useRouter();
  
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'athletes' | 'workouts' | 'performance'>('athletes');

  // Workouts State
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [workoutFormMessage, setWorkoutFormMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Performance State
  const [selectedAthleteForPerf, setSelectedAthleteForPerf] = useState<Athlete | null>(null);
  const [athletePerformances, setAthletePerformances] = useState<PerformanceRecord[]>([]);
  const [isPerfLoading, setIsPerfLoading] = useState(false);
  const [isSavingPerf, setIsSavingPerf] = useState(false);
  const [perfError, setPerfError] = useState<string | null>(null);
  const [showCreatePerfForm, setShowCreatePerfForm] = useState(false);
  const [perfFormMessage, setPerfFormMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Create Performance Form State
  const [newSprintTime, setNewSprintTime] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newHeight, setNewHeight] = useState('');
  const [newPerfRemarks, setNewPerfRemarks] = useState('');
  const [newPerfDate, setNewPerfDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });


  // Create Workout Form State
  const [newWorkoutTitle, setNewWorkoutTitle] = useState('');
  const [newWorkoutDescription, setNewWorkoutDescription] = useState('');
  const [newWorkoutAthleteId, setNewWorkoutAthleteId] = useState('');
  const [newWorkoutDate, setNewWorkoutDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [newWorkoutExercises, setNewWorkoutExercises] = useState<Exercise[]>([
    { name: '', sets: 3, reps: 10, duration: '' }
  ]);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    async function loadDashboardData() {
      setIsLoading(true);
      setError(null);
      
      try {
        let actualCoachId = user?.coach_id;
        
        // If coach_id is not present directly on user, fetch the full coach details to obtain coach_id.
        if (!actualCoachId && user?.id) {
          const coachData = await fetchCoachById(token, user.id);
          actualCoachId = coachData.coach_id;
        }

        if (!actualCoachId) {
          throw new Error('Coach account is not fully configured (missing Coach ID).');
        }

        const [athletesData, workoutsData] = await Promise.all([
          fetchCoachAthletes(token, actualCoachId),
          fetchCoachWorkouts(token, actualCoachId)
        ]);

        setAthletes(athletesData);
        setFilteredAthletes(athletesData);
        setWorkouts(workoutsData);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load dashboard data';
        console.warn('Error loading dashboard data:', e);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [user, token]);

  useEffect(() => {
    if (!selectedAthleteForPerf || !token) {
      return;
    }
    async function loadAthletePerformances() {
      setIsPerfLoading(true);
      setPerfError(null);
      try {
        const data = await fetchAthletePerformances(token, selectedAthleteForPerf.athlete_id);
        const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
        setAthletePerformances(sorted);
      } catch (err: any) {
        setPerfError(err.message || 'Failed to fetch performance history');
      } finally {
        setIsPerfLoading(false);
      }
    }
    loadAthletePerformances();
  }, [selectedAthleteForPerf, token]);

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
    if (!newPerfDate.trim()) {
      setPerfFormMessage({ text: 'Date cannot be empty.', isError: true });
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
      
      // Reset form
      setNewSprintTime('');
      setNewWeight('');
      setNewHeight('');
      setNewPerfRemarks('');
      
      // Reload performances
      const data = await fetchAthletePerformances(token, selectedAthleteForPerf.athlete_id);
      const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
      setAthletePerformances(sorted);

      setTimeout(() => {
        setShowCreatePerfForm(false);
        setPerfFormMessage(null);
      }, 1500);
    } catch (err: any) {
      setPerfFormMessage({ text: err.message || 'Failed to record performance.', isError: true });
    } finally {
      setIsSavingPerf(false);
    }
  };


  const handleAddExerciseField = () => {
    setNewWorkoutExercises([...newWorkoutExercises, { name: '', sets: 3, reps: 10, duration: '' }]);
  };

  const handleRemoveExerciseField = (index: number) => {
    if (newWorkoutExercises.length === 1) return;
    setNewWorkoutExercises(newWorkoutExercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...newWorkoutExercises];
    updated[index] = { ...updated[index], [field]: value };
    setNewWorkoutExercises(updated);
  };

  const handleCreateWorkoutPlan = async () => {
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
    
    // Validate exercises
    for (let i = 0; i < newWorkoutExercises.length; i++) {
      if (!newWorkoutExercises[i].name.trim()) {
        setWorkoutFormMessage({ text: `Exercise #${i + 1} name cannot be empty.`, isError: true });
        return;
      }
      if (newWorkoutExercises[i].sets <= 0 || newWorkoutExercises[i].reps <= 0) {
        setWorkoutFormMessage({ text: `Exercise #${i + 1} sets and reps must be greater than 0.`, isError: true });
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
      
      // Reset form
      setNewWorkoutTitle('');
      setNewWorkoutDescription('');
      setNewWorkoutAthleteId('');
      setNewWorkoutExercises([{ name: '', sets: 3, reps: 10, duration: '' }]);
      
      // Fetch latest workouts
      let actualCoachId = user?.coach_id;
      if (!actualCoachId && user?.id) {
        const coachData = await fetchCoachById(token, user.id);
        actualCoachId = coachData.coach_id;
      }
      if (actualCoachId) {
        const workoutsData = await fetchCoachWorkouts(token, actualCoachId);
        setWorkouts(workoutsData);
      }
      
      // Close form after a delay
      setTimeout(() => {
        setShowCreateForm(false);
        setWorkoutFormMessage(null);
      }, 1500);
    } catch (e: any) {
      setWorkoutFormMessage({ text: e.message || 'Failed to create workout plan.', isError: true });
    } finally {
      setIsSavingWorkout(false);
    }
  };

  // Filter athletes by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAthletes(athletes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = athletes.filter(
      (athlete) =>
        athlete.name.toLowerCase().includes(query) ||
        athlete.sport.toLowerCase().includes(query)
    );
    setFilteredAthletes(filtered);
  }, [searchQuery, athletes]);

  const handleViewAthlete = (athleteId: string) => {
    router.push(`/athlete-details?athleteId=${athleteId}`);
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
            <Text style={styles.headerTitle}>Coach Dashboard</Text>
            <Text style={styles.headerSubtitle}>{user?.email || 'Coach'}</Text>
          </View>
          <Pressable onPress={onSignOut} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {/* Coach Info Card */}
          <View style={styles.coachInfoCard}>
            <View style={styles.coachAvatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'C'}
              </Text>
            </View>
            <View style={styles.coachDetails}>
              <Text style={styles.coachName}>{user?.name || 'Coach'}</Text>
              <Text style={styles.coachEmail}>{user?.email}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={24} color="#3b82f6" />
                  <Text style={styles.statValue}>{athletes.length}</Text>
                  <Text style={styles.statLabel}>Total Athletes</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tabButton, activeTab === 'athletes' && styles.tabButtonActive]}
              onPress={() => setActiveTab('athletes')}
            >
              <Ionicons name="people-outline" size={20} color={activeTab === 'athletes' ? '#3b82f6' : '#647286'} />
              <Text style={[styles.tabButtonText, activeTab === 'athletes' && styles.tabButtonTextActive]}>
                Athletes
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabButton, activeTab === 'workouts' && styles.tabButtonActive]}
              onPress={() => setActiveTab('workouts')}
            >
              <Ionicons name="fitness-outline" size={20} color={activeTab === 'workouts' ? '#3b82f6' : '#647286'} />
              <Text style={[styles.tabButtonText, activeTab === 'workouts' && styles.tabButtonTextActive]}>
                Workout Plans
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabButton, activeTab === 'performance' && styles.tabButtonActive]}
              onPress={() => setActiveTab('performance')}
            >
              <Ionicons name="speedometer-outline" size={20} color={activeTab === 'performance' ? '#3b82f6' : '#647286'} />
              <Text style={[styles.tabButtonText, activeTab === 'performance' && styles.tabButtonTextActive]}>
                Performance
              </Text>
            </Pressable>
          </View>


          {/* Athletes Tab */}
          {activeTab === 'athletes' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                My Athletes ({filteredAthletes.length})
              </Text>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#647286" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search athletes by name or sport..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Content */}
              {isLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.loaderText}>Loading your athletes...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable
                    onPress={() => router.back()}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>Go Back</Text>
                  </Pressable>
                </View>
              ) : filteredAthletes.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No athletes match your search' : 'No athletes assigned yet.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.athletesList}>
                  {filteredAthletes.map((athlete) => (
                    <View key={athlete.athlete_id} style={styles.athleteCard}>
                      <View style={styles.athleteHeader}>
                        <View style={styles.athleteAvatar}>
                          <Text style={styles.avatarText}>
                            {athlete.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.athleteInfo}>
                          <Text style={styles.athleteName}>{athlete.name}</Text>
                          <Text style={styles.athleteSport}>
                            {athlete.sport || 'No sport specified'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.athleteFooter}>
                        <Text style={styles.athleteWeight}>
                          {athlete.weight ? `${athlete.weight} kg` : 'Weight not specified'}
                        </Text>
                        <Pressable
                          style={styles.viewButton}
                          onPress={() => handleViewAthlete(athlete.athlete_id)}
                        >
                          <Text style={styles.viewButtonText}>View</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Workouts Tab */}
          {activeTab === 'workouts' && (
            <View style={styles.section}>
              <View style={styles.workoutsHeader}>
                <Text style={styles.sectionTitle}>Workout Plans ({workouts.length})</Text>
                <Pressable
                  style={styles.addButton}
                  onPress={() => {
                    setShowCreateForm(!showCreateForm);
                    setWorkoutFormMessage(null);
                  }}
                >
                  <Ionicons name={showCreateForm ? 'close-outline' : 'add-outline'} size={20} color="#fff" />
                  <Text style={styles.addButtonText}>
                    {showCreateForm ? 'Cancel' : 'New Plan'}
                  </Text>
                </Pressable>
              </View>

              {showCreateForm && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Assign Workout Plan</Text>
                  
                  {/* Select Athlete */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Select Athlete</Text>
                    {athletes.length === 0 ? (
                      <Text style={styles.helperText}>No athletes assigned. Assign an athlete first before building plans.</Text>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.athleteSelectorList}>
                        {athletes.map((ath) => (
                          <Pressable
                            key={ath.athlete_id}
                            style={[
                              styles.athleteSelectChip,
                              newWorkoutAthleteId === ath.athlete_id && styles.athleteSelectChipActive
                            ]}
                            onPress={() => setNewWorkoutAthleteId(ath.athlete_id)}
                          >
                            <Text style={[
                              styles.athleteSelectChipText,
                              newWorkoutAthleteId === ath.athlete_id && styles.athleteSelectChipTextActive
                            ]}>
                              {ath.name} ({ath.sport || 'General'})
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  {/* Workout Title */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Workout Title</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Strength Training, Speed Routine"
                      placeholderTextColor="#94a3b8"
                      value={newWorkoutTitle}
                      onChangeText={setNewWorkoutTitle}
                    />
                  </View>

                  {/* Description */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Description (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Instructions, rest intervals, etc."
                      placeholderTextColor="#94a3b8"
                      multiline
                      numberOfLines={3}
                      value={newWorkoutDescription}
                      onChangeText={setNewWorkoutDescription}
                    />
                  </View>

                  {/* Target Date */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Target Date</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={newWorkoutDate}
                      onChangeText={setNewWorkoutDate}
                    />
                  </View>

                  {/* Exercises */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.exercisesHeaderRow}>
                      <Text style={styles.label}>Exercises</Text>
                      <Pressable style={styles.addExerciseBtn} onPress={handleAddExerciseField}>
                        <Ionicons name="add-circle-outline" size={18} color="#3b82f6" />
                        <Text style={styles.addExerciseBtnText}>Add</Text>
                      </Pressable>
                    </View>

                    {newWorkoutExercises.map((exercise, index) => (
                      <View key={index} style={styles.exerciseRowCard}>
                        <View style={styles.exerciseRowHeader}>
                          <Text style={styles.exerciseRowIndex}>Exercise #{index + 1}</Text>
                          {newWorkoutExercises.length > 1 && (
                            <Pressable onPress={() => handleRemoveExerciseField(index)}>
                              <Ionicons name="trash-outline" size={16} color="#ef4444" />
                            </Pressable>
                          )}
                        </View>

                        <TextInput
                          style={styles.exerciseInput}
                          placeholder="Exercise Name (e.g. Squats)"
                          placeholderTextColor="#94a3b8"
                          value={exercise.name}
                          onChangeText={(val) => handleExerciseChange(index, 'name', val)}
                        />

                        <View style={styles.exerciseNumsRow}>
                          <View style={styles.numInputCol}>
                            <Text style={styles.numInputLabel}>Sets</Text>
                            <TextInput
                              style={styles.numInput}
                              keyboardType="numeric"
                              value={String(exercise.sets)}
                              onChangeText={(val) => handleExerciseChange(index, 'sets', parseInt(val) || 0)}
                            />
                          </View>
                          <View style={styles.numInputCol}>
                            <Text style={styles.numInputLabel}>Reps</Text>
                            <TextInput
                              style={styles.numInput}
                              keyboardType="numeric"
                              value={String(exercise.reps)}
                              onChangeText={(val) => handleExerciseChange(index, 'reps', parseInt(val) || 0)}
                            />
                          </View>
                          <View style={styles.numInputCol}>
                            <Text style={styles.numInputLabel}>Duration (Optional)</Text>
                            <TextInput
                              style={styles.numInput}
                              placeholder="e.g. 30s"
                              placeholderTextColor="#94a3b8"
                              value={exercise.duration || ''}
                              onChangeText={(val) => handleExerciseChange(index, 'duration', val)}
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  {workoutFormMessage && (
                    <Text style={[
                      styles.formMessageText,
                      workoutFormMessage.isError ? styles.errorMessage : styles.successMessage
                    ]}>
                      {workoutFormMessage.text}
                    </Text>
                  )}

                  <Pressable
                    disabled={isSavingWorkout}
                    style={[styles.primaryButton, isSavingWorkout && styles.buttonDisabled]}
                    onPress={handleCreateWorkoutPlan}
                  >
                    {isSavingWorkout ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Assign Plan</Text>
                    )}
                  </Pressable>
                </View>
              )}

              {/* Workouts History List */}
              {workouts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="fitness-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No workout plans assigned yet.</Text>
                </View>
              ) : (
                <View style={styles.workoutsList}>
                  {workouts.map((w) => {
                    const mappedAthlete = athletes.find((a) => a.athlete_id === w.athlete_id);
                    return (
                      <View key={w.workout_id} style={styles.workoutCard}>
                        <View style={styles.workoutCardHeader}>
                          <View style={styles.workoutMetaCol}>
                            <Text style={styles.workoutTitleText}>{w.title}</Text>
                            <Text style={styles.workoutAthlete}>
                              Athlete: {mappedAthlete ? mappedAthlete.name : 'Unknown Athlete'}
                            </Text>
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

                        <Text style={styles.workoutDate}>Date: {w.date}</Text>

                        <View style={styles.exercisesList}>
                          <Text style={styles.exercisesListTitle}>Exercises:</Text>
                          {w.exercises.map((ex, idx) => (
                            <View key={idx} style={styles.exerciseItemRow}>
                              <Ionicons name="checkmark-circle-outline" size={16} color="#3b82f6" />
                              <Text style={styles.exerciseItemText}>
                                {ex.name} — {ex.sets} sets × {ex.reps} reps {ex.duration ? `(${ex.duration})` : ''}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <View style={styles.section}>
              {!selectedAthleteForPerf ? (
                <>
                  <Text style={styles.sectionTitle}>
                    Select Athlete for Performance Record
                  </Text>
                  
                  {athletes.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                      <Text style={styles.emptyText}>No athletes assigned yet.</Text>
                    </View>
                  ) : (
                    <View style={styles.athletesList}>
                      {athletes.map((athlete) => (
                        <View key={athlete.athlete_id} style={styles.athleteCard}>
                          <View style={styles.athleteHeader}>
                            <View style={styles.athleteAvatar}>
                              <Text style={styles.avatarText}>
                                {athlete.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.athleteInfo}>
                              <Text style={styles.athleteName}>{athlete.name}</Text>
                              <Text style={styles.athleteSport}>
                                {athlete.sport || 'No sport specified'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.athleteFooter}>
                            <Text style={styles.athleteWeight}>
                              {athlete.weight ? `${athlete.weight} kg` : 'Weight not specified'}
                            </Text>
                            <Pressable
                              style={styles.viewButton}
                              onPress={() => setSelectedAthleteForPerf(athlete)}
                            >
                              <Text style={styles.viewButtonText}>Select</Text>
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.perfDetailHeader}>
                    <Pressable
                      style={styles.backBtn}
                      onPress={() => {
                        setSelectedAthleteForPerf(null);
                        setShowCreatePerfForm(false);
                        setPerfFormMessage(null);
                      }}
                    >
                      <Ionicons name="arrow-back-outline" size={18} color="#3b82f6" />
                      <Text style={styles.backBtnText}>Back to Athletes</Text>
                    </Pressable>
                    <Text style={styles.sectionTitle}>{selectedAthleteForPerf.name}'s Performance</Text>
                  </View>

                  <View style={styles.workoutsHeader}>
                    <Text style={styles.sectionSubtitleText}>Performance History ({athletePerformances.length})</Text>
                    <Pressable
                      style={styles.addButton}
                      onPress={() => {
                        setShowCreatePerfForm(!showCreatePerfForm);
                        setPerfFormMessage(null);
                      }}
                    >
                      <Ionicons name={showCreatePerfForm ? 'close-outline' : 'add-outline'} size={20} color="#fff" />
                      <Text style={styles.addButtonText}>
                        {showCreatePerfForm ? 'Cancel' : 'Record New'}
                      </Text>
                    </Pressable>
                  </View>

                  {showCreatePerfForm && (
                    <View style={styles.formCard}>
                      <Text style={styles.formTitle}>Record Performance Metric</Text>
                      
                      {/* Sprint Time */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Sprint Time (seconds)</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. 4.85"
                          placeholderTextColor="#94a3b8"
                          keyboardType="numeric"
                          value={newSprintTime}
                          onChangeText={setNewSprintTime}
                        />
                      </View>

                      {/* Weight */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Weight (kg)</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. 72"
                          placeholderTextColor="#94a3b8"
                          keyboardType="numeric"
                          value={newWeight}
                          onChangeText={setNewWeight}
                        />
                      </View>

                      {/* Height */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Height (cm)</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. 180"
                          placeholderTextColor="#94a3b8"
                          keyboardType="numeric"
                          value={newHeight}
                          onChangeText={setNewHeight}
                        />
                      </View>

                      {/* Date */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Date</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="#94a3b8"
                          value={newPerfDate}
                          onChangeText={setNewPerfDate}
                        />
                      </View>

                      {/* Remarks */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Remarks / Feedback</Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          placeholder="Performance notes, areas of improvement..."
                          placeholderTextColor="#94a3b8"
                          multiline
                          numberOfLines={3}
                          value={newPerfRemarks}
                          onChangeText={setNewPerfRemarks}
                        />
                      </View>

                      {perfFormMessage && (
                        <Text style={[
                          styles.formMessageText,
                          perfFormMessage.isError ? styles.errorMessage : styles.successMessage
                        ]}>
                          {perfFormMessage.text}
                        </Text>
                      )}

                      <Pressable
                        disabled={isSavingPerf}
                        style={[styles.primaryButton, isSavingPerf && styles.buttonDisabled]}
                        onPress={handleCreatePerformance}
                      >
                        {isSavingPerf ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.primaryButtonText}>Record Metric</Text>
                        )}
                      </Pressable>
                    </View>
                  )}

                  {/* Performance History List */}
                  {isPerfLoading ? (
                    <View style={styles.loaderContainer}>
                      <ActivityIndicator size="large" color="#3b82f6" />
                      <Text style={styles.loaderText}>Loading history...</Text>
                    </View>
                  ) : perfError ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{perfError}</Text>
                    </View>
                  ) : athletePerformances.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="speedometer-outline" size={48} color="#cbd5e1" />
                      <Text style={styles.emptyText}>No performance records logged yet.</Text>
                    </View>
                  ) : (
                    <View style={styles.perfList}>
                      {athletePerformances.map((perf) => (
                        <View key={perf.performance_id} style={styles.perfCard}>
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
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

        </ScrollView>
      </View>
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
  coachInfoCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  coachAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  coachDetails: {
    flex: 1,
    gap: 8,
  },
  coachName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  coachEmail: {
    fontSize: 14,
    color: '#475569',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 14,
    color: '#647286',
    fontWeight: '600',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
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
    textAlign: 'center',
  },
  athletesList: {
    gap: 12,
  },
  athleteCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
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
  athleteSport: {
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
  athleteWeight: {
    fontSize: 13,
    color: '#475569',
  },
  viewButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
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
  },
  tabButtonActive: {
    backgroundColor: '#eff6ff',
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
  workoutsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  formCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
    color: '#0f172a',
  },
  textArea: {
    height: 80,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  athleteSelectorList: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  athleteSelectChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  athleteSelectChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  athleteSelectChipText: {
    fontSize: 13,
    color: '#647286',
    fontWeight: '500',
  },
  athleteSelectChipTextActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  helperText: {
    fontSize: 13,
    color: '#647286',
    fontStyle: 'italic',
  },
  exercisesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addExerciseBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  exerciseRowCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  exerciseRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseRowIndex: {
    fontSize: 12,
    fontWeight: '700',
    color: '#647286',
  },
  exerciseInput: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 36,
    fontSize: 13,
    color: '#0f172a',
  },
  exerciseNumsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  numInputCol: {
    flex: 1,
    gap: 4,
  },
  numInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#647286',
  },
  numInput: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 36,
    fontSize: 13,
    color: '#0f172a',
    textAlign: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  formMessageText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  errorMessage: {
    color: '#ef4444',
  },
  successMessage: {
    color: '#10b981',
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
    gap: 10,
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
  workoutAthlete: {
    fontSize: 12,
    color: '#647286',
    marginTop: 2,
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
    fontWeight: '600',
    color: '#647286',
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
    gap: 6,
  },
  exerciseItemText: {
    fontSize: 13,
    color: '#334155',
  },
  perfDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    gap: 6,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  sectionSubtitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
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
});