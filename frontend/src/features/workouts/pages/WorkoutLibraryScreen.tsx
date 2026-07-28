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

} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WorkoutTemplate } from '@/api/workout';
import { fetchWorkoutTemplates } from '@/api/workout';
import { fetchMyProfile } from '@/api/profile';
import { Button, Card, EmptyState, SearchBar, CollectionGrid, CollectionGridItem, Badge } from '@/components/ui';
import WorkoutCard from '../components/WorkoutCard';
import WorkoutDetailsModal from '../components/WorkoutDetailsModal';
import { useRouter, Href } from 'expo-router';
import { useSavedWorkouts } from '@/hooks/useSavedWorkouts';

import { useThemeColors, RADIUS, SPACING } from '@/styles/tokens';



interface WorkoutLibraryScreenProps {
  token: string;
  userRole: 'athlete' | 'coach' | string;
}

const CATEGORY_CHIPS = ['All', 'Strength', 'Speed', 'Endurance', 'Mobility', 'Technique', 'Recovery'];
const ALL_SPORTS_CATALOG = ['Track & Field', 'Football', 'Basketball', 'Cricket', 'General Fitness'];

export default function WorkoutLibraryScreen({ token, userRole }: WorkoutLibraryScreenProps) {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const isMediumScreen = width > 500 && width <= 768;

  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [primarySport, setPrimarySport] = useState<string>('Track & Field');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Selected Workout Modal
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

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
      const [workoutsData, profileData] = await Promise.all([
        fetchWorkoutTemplates(token),
        fetchMyProfile(token).catch(() => null),
      ]);

      setWorkouts(workoutsData);

      if (profileData?.athlete_data?.sport) {
        setPrimarySport(profileData.athlete_data.sport);
      } else if (profileData?.coach_data?.primary_sport) {
        setPrimarySport(profileData.coach_data.primary_sport);
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
  const lockedSports = ALL_SPORTS_CATALOG.filter((sport) => {
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

  const cardWidth = isLargeScreen ? 340 : isMediumScreen ? '48%' : '100%';

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
          {CATEGORY_CHIPS.map((cat) => {
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
                <CollectionGrid gap={16}>
                  {primarySportWorkouts.map((workout) => (
                    <CollectionGridItem key={workout.id} itemWidth={cardWidth}>
                      <WorkoutCard
                        workout={workout}
                        onViewDetails={handleViewDetails}
                        onAddToMyWorkouts={userRole === 'athlete' ? handleAddToMyWorkouts : undefined}
                        isSaving={savingId === workout.id}
                      />
                    </CollectionGridItem>
                  ))}
                </CollectionGrid>
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
                <CollectionGrid gap={16}>
                  {generalWorkouts.map((workout) => (
                    <CollectionGridItem key={workout.id} itemWidth={cardWidth}>
                      <WorkoutCard
                        workout={workout}
                        onViewDetails={handleViewDetails}
                        onAddToMyWorkouts={userRole === 'athlete' ? handleAddToMyWorkouts : undefined}
                        isSaving={savingId === workout.id}
                      />
                    </CollectionGridItem>
                  ))}
                </CollectionGrid>

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
                <CollectionGrid gap={16}>
                  {lockedSports.map((sport) => (
                    <CollectionGridItem key={sport} itemWidth={cardWidth}>
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
                    </CollectionGridItem>
                  ))}
                </CollectionGrid>
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
        isSaving={savingId === selectedWorkout?.id}
      />

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
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,

  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  screenSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  searchWrapper: {
    marginTop: 4,
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
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
    paddingBottom: 24,
    gap: 24,
  },
  sectionContainer: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  lockedCard: {
    padding: SPACING.md,
    gap: 12,
    opacity: 0.8,
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
  },
});
