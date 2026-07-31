import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Platform,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WorkoutTemplate } from '@/api/workout';
import { fetchWorkoutTemplates, createWorkout, fetchWorkoutMetadata } from '@/api/workout';
import { fetchMyProfile } from '@/api/profile';
import { fetchCoachAthletes } from '@/api/admin';
import { Button, Card, EmptyState, SearchBar, Badge } from '@/components/ui';
import WorkoutCard from '../components/WorkoutCard';
import WorkoutDetailsModal from '../components/WorkoutDetailsModal';
import { useRouter, Href } from 'expo-router';
import { useSavedWorkouts } from '@/hooks/useSavedWorkouts';

import { useThemeColors, RADIUS, SPACING } from '@/styles/tokens';

interface WorkoutLibraryScreenProps {
  token: string;
  userRole: 'athlete' | 'coach' | string;
}

const DEFAULT_CATEGORY_CHIPS = ['All', 'Strength', 'Speed', 'Endurance', 'Mobility', 'Technique', 'Recovery'];
const DEFAULT_SPORTS_CATALOG = ['Track & Field', 'Football', 'Basketball', 'Cricket', 'General Fitness'];

export default function WorkoutLibraryScreen({ token, userRole }: WorkoutLibraryScreenProps) {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();

  // Responsive Breakpoints:
  // Desktop (≥1200px) -> 3 cards per row
  // Tablet (768px–1199px) -> 2 cards per row
  // Mobile (<768px) -> 1 card per row
  const getColumnsCount = (w: number) => {
    if (w >= 1200) return 3;
    if (w >= 768) return 2;
    return 1;
  };

  const numColumns = getColumnsCount(width);

  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [primarySport, setPrimarySport] = useState<string>('Track & Field');
  const [categoryChips, setCategoryChips] = useState<string[]>(DEFAULT_CATEGORY_CHIPS);
  const [allSportsCatalog, setAllSportsCatalog] = useState<string[]>(DEFAULT_SPORTS_CATALOG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Selected Workout Modal
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Coach Workout Assignment State
  const [selectedWorkoutForAssign, setSelectedWorkoutForAssign] = useState<WorkoutTemplate | null>(null);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [coachAthletes, setCoachAthletes] = useState<any[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [assignDate, setAssignDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [assignNotes, setAssignNotes] = useState<string>('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);
  const [coachUserId, setCoachUserId] = useState<string>('');

  const { savedWorkouts, saveWorkout } = useSavedWorkouts();
  const router = useRouter();

  const isSelectedWorkoutSaved = Boolean(
    selectedWorkout &&
      savedWorkouts.some(
        (item) =>
          item.workout_template_id === selectedWorkout.id ||
          item.workout_template?.id === selectedWorkout.id
      )
  );

  const handleOpenAssignModal = async (workout: WorkoutTemplate) => {
    setSelectedWorkoutForAssign(workout);
    setIsAssignModalVisible(true);
    if (token && coachUserId) {
      try {
        const athletes = await fetchCoachAthletes(token, coachUserId);
        setCoachAthletes(athletes);
        if (athletes.length > 0) {
          setSelectedAthleteId(athletes[0].athlete_id);
        }
      } catch (err) {
        console.warn('Failed to load coach athletes:', err);
      }
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedWorkoutForAssign || !selectedAthleteId || !token) {
      Alert.alert('Missing Selection', 'Please select an athlete to assign this workout to.');
      return;
    }
    setIsSubmittingAssign(true);
    try {
      await createWorkout(token, {
        workout_template_id: selectedWorkoutForAssign.id,
        title: selectedWorkoutForAssign.title,
        description: assignNotes.trim() || selectedWorkoutForAssign.description,
        athlete_id: selectedAthleteId,
        exercises: [],
        date: assignDate,
        status: 'pending',
      });
      Alert.alert('Success', `Workout "${selectedWorkoutForAssign.title}" assigned successfully!`);
      setIsAssignModalVisible(false);
      setSelectedWorkoutForAssign(null);
      setAssignNotes('');
    } catch (err: any) {
      Alert.alert('Assignment Failed', err.message || 'Failed to assign workout to athlete.');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const handleAddToMyWorkouts = async (workout: WorkoutTemplate) => {
    setSavingId(workout.id);
    try {
      await saveWorkout(workout.id);
      Alert.alert('Success', 'Workout added to My Workouts.');
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to save workout.';
      Alert.alert('Saved Workout', message);
    } finally {
      setSavingId(null);
    }
  };

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [workoutsData, profileData, metadata] = await Promise.all([
        fetchWorkoutTemplates(token),
        fetchMyProfile(token).catch(() => null),
        fetchWorkoutMetadata(token).catch(() => null),
      ]);

      setWorkouts(workoutsData);

      if (metadata) {
        if (metadata.categories && metadata.categories.length > 0) {
          setCategoryChips(['All', ...metadata.categories]);
        }
        if (metadata.sports && metadata.sports.length > 0) {
          setAllSportsCatalog(metadata.sports);
        }
      }

      if (profileData?.athlete_data?.sport) {
        setPrimarySport(profileData.athlete_data.sport);
      } else if (profileData?.coach_data?.primary_sport) {
        setPrimarySport(profileData.coach_data.primary_sport);
      }
      if (profileData?.user_id || profileData?.id || profileData?.coach_data?.coach_id) {
        setCoachUserId(profileData.user_id || profileData.id || profileData.coach_data?.coach_id);
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to load workout library';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering by search query and category
  const filteredWorkouts = workouts.filter((w) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      w.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      w.title.toLowerCase().includes(q) ||
      w.category.toLowerCase().includes(q) ||
      w.sport.toLowerCase().includes(q) ||
      (w.description && w.description.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  // Group workouts into Primary Sport vs General Performance
  const isPrimarySport = (sportName: string) => {
    const s = (sportName || '').toLowerCase();
    const p = (primarySport || '').toLowerCase();
    if (s === p) return true;
    if (
      (p.includes('track') || p.includes('athletics')) &&
      (s.includes('track') || s.includes('athletics') || s.includes('running'))
    ) {
      return true;
    }
    return false;
  };

  const primarySportWorkouts = filteredWorkouts.filter((w) => isPrimarySport(w.sport));
  const generalWorkouts = filteredWorkouts.filter(
    (w) => w.sport.toLowerCase().includes('general') || !isPrimarySport(w.sport)
  );

  // Identify Locked Sports for Athletes
  const lockedSports = allSportsCatalog.filter((sport) => {
    if (userRole !== 'athlete') return false;
    if (sport === 'General Fitness') return false;
    return !isPrimarySport(sport);
  });

  const handleViewDetails = (workout: WorkoutTemplate) => {
    setSelectedWorkout(workout);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedWorkout(null);
  };

  // Dynamic CSS Grid Layout parameters
  const gridContainerStyle: ViewStyle = Platform.OS === 'web'
    ? ({
        display: 'grid' as any,
        gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))`,
        gap: 20,
        width: '100%',
        alignItems: 'stretch',
      } as any)
    : {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        width: '100%',
      };

  const gridItemStyle: ViewStyle = Platform.OS === 'web'
    ? ({
        width: '100%',
        height: '100%',
        display: 'flex' as any,
        flexDirection: 'column' as any,
      } as any)
    : {
        width: numColumns === 3 ? '31.5%' : numColumns === 2 ? '48.5%' : '100%',
        marginBottom: 16,
      };

  return (
    <View style={styles.container}>
      {/* Search & Filter Header Section */}
      <Card style={styles.filterCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Workout Library</Text>
            <Text style={[styles.screenSubtitle, { color: colors.textSub }]}>
              Personalized training programs tailored for {primarySport} athletes.
            </Text>
          </View>
          <Badge label={primarySport} variant="success" />
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${primarySport} and General workouts...`}
          />
        </View>

        {/* Category Chips Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {categoryChips.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.emerald : colors.bgMid,
                    borderColor: isSelected ? colors.emerald : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? '#ffffff' : colors.textSub },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Card>

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        {isLoading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={colors.emerald} />
            <Text style={[styles.loadingText, { color: colors.textSub }]}>Loading personalized library...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <View style={{ alignItems: 'center', padding: 24, gap: 16 }}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              <Button label="Retry" onPress={loadData} variant="primary" />
            </View>
          </Card>
        ) : filteredWorkouts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon="journal-outline"
              title={workouts.length === 0 ? 'No workouts available' : 'No workouts match your filters'}
              description={
                workouts.length === 0
                  ? 'Workout templates will appear here once added to the library.'
                  : 'Try clearing your search query or selecting a different category filter.'
              }
              actionLabel={searchQuery || selectedCategory !== 'All' ? 'Clear Filters' : undefined}
              onActionPress={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
            />
          </Card>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollGrid}>
            {/* Section 1: Recommended for You (Primary Sport) */}
            {primarySportWorkouts.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="sparkles" size={20} color={colors.emerald} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Recommended for You ({primarySport})
                  </Text>
                </View>
                <View style={gridContainerStyle}>
                  {primarySportWorkouts.map((workout) => (
                    <View key={workout.id} style={gridItemStyle}>
                      <WorkoutCard
                        workout={workout}
                        onViewDetails={handleViewDetails}
                        onAddToMyWorkouts={userRole === 'athlete' ? handleAddToMyWorkouts : undefined}
                        onAssignToAthlete={userRole === 'coach' ? handleOpenAssignModal : undefined}
                        isSaving={savingId === workout.id}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Section 2: General Performance Workouts */}
            {generalWorkouts.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="fitness" size={20} color={colors.info} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    General Performance & Conditioning
                  </Text>
                </View>
                <View style={gridContainerStyle}>
                  {generalWorkouts.map((workout) => (
                    <View key={workout.id} style={gridItemStyle}>
                      <WorkoutCard
                        workout={workout}
                        onViewDetails={handleViewDetails}
                        onAddToMyWorkouts={userRole === 'athlete' ? handleAddToMyWorkouts : undefined}
                        onAssignToAthlete={userRole === 'coach' ? handleOpenAssignModal : undefined}
                        isSaving={savingId === workout.id}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Section 3: Locked Sports Preview (Placeholder Cards) */}
            {lockedSports.length > 0 && !searchQuery && selectedCategory === 'All' && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                  <Text style={[styles.sectionTitle, { color: colors.textSub }]}>
                    Explore Other Sports (Locked Previews)
                  </Text>
                </View>
                <View style={gridContainerStyle}>
                  {lockedSports.map((sport) => (
                    <View key={sport} style={gridItemStyle}>
                      <Card style={[styles.lockedCard, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
                        <View style={styles.lockedHeader}>
                          <View style={[styles.lockIconBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed" size={22} color={colors.textMuted} />
                          </View>
                          <Badge label="Coming Soon" variant="neutral" />
                        </View>
                        <Text style={[styles.lockedTitle, { color: colors.textPrimary }]}>{sport}</Text>
                        <Text style={[styles.lockedSub, { color: colors.textSub }]}>
                          Unlock {sport} Training Library
                        </Text>
                      </Card>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Workout Details Modal */}
      <WorkoutDetailsModal
        visible={isModalVisible}
        workout={selectedWorkout}
        userRole={userRole}
        onClose={handleCloseModal}
        isSaved={isSelectedWorkoutSaved}
        onAddToMyWorkouts={handleAddToMyWorkouts}
        onOpenMyWorkouts={() => router.push('/my-workouts' as Href)}
        onAssignToAthlete={handleOpenAssignModal}
        onCustomizeAndAssign={handleOpenAssignModal}
        isSaving={savingId === selectedWorkout?.id}
      />

      {/* Coach Workout Assignment Modal */}
      {isAssignModalVisible && selectedWorkoutForAssign && (
        <View style={styles.modalOverlay}>
          <Card style={styles.assignCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Assign Workout
                </Text>
                <Text style={[{ fontSize: 13, color: colors.textSub, marginTop: 2 }]}>
                  {selectedWorkoutForAssign.title}
                </Text>
              </View>
              <Pressable onPress={() => setIsAssignModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textSub} />
              </Pressable>
            </View>

            <View style={{ gap: 14, marginVertical: 12 }}>
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textSub }]}>SELECT ATHLETE</Text>
                {coachAthletes.length === 0 ? (
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                    No assigned athletes found. Add an athlete to your roster to assign workouts.
                  </Text>
                ) : (
                  <View style={{ gap: 8, marginTop: 6 }}>
                    {coachAthletes.map((ath) => {
                      const athId = ath.athlete_id;
                      const isSelected = selectedAthleteId === athId;
                      return (
                        <Pressable
                          key={athId}
                          onPress={() => setSelectedAthleteId(athId)}
                          style={[
                            styles.athleteSelectOption,
                            {
                              backgroundColor: isSelected ? colors.emeraldDim : colors.bgMid,
                              borderColor: isSelected ? colors.borderEmerald : colors.borderSubtle,
                            },
                          ]}
                        >
                          <Ionicons
                            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={18}
                            color={isSelected ? colors.emerald : colors.textMuted}
                          />
                          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
                            {ath.name || ath.athlete_name || 'Athlete'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              <View>
                <Text style={[styles.fieldLabel, { color: colors.textSub }]}>ASSIGNMENT DATE</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginTop: 4 }}>
                  {assignDate}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <Button
                label="Cancel"
                onPress={() => setIsAssignModalVisible(false)}
                variant="secondary"
              />
              <Button
                label="Confirm Assignment"
                onPress={handleConfirmAssignment}
                variant="primary"
                isLoading={isSubmittingAssign}
                disabled={!selectedAthleteId || coachAthletes.length === 0}
              />
            </View>
          </Card>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  filterCard: {
    padding: SPACING.md,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 20,
  },
  searchWrapper: {
    marginTop: 2,
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
  },
  scrollGrid: {
    paddingBottom: 32,
    gap: 28,
  },
  sectionContainer: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  lockedCard: {
    padding: SPACING.md,
    gap: 12,
    opacity: 0.85,
    height: '100%',
    minHeight: 180,
    justifyContent: 'space-between',
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  lockedSub: {
    fontSize: 13,
  },
  centeredState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorCard: {
    margin: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    padding: SPACING.md,
  },
  assignCard: {
    width: '100%',
    maxWidth: 520,
    padding: 20,
    borderRadius: RADIUS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  athleteSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
});
