import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Button, Card, EmptyState, SearchBar, CollectionGrid, CollectionGridItem } from '@/components/ui';
import WorkoutCard from '../components/WorkoutCard';
import WorkoutDetailsModal from '../components/WorkoutDetailsModal';
import { useThemeColors, RADIUS, SPACING } from '@/styles/tokens';

interface WorkoutLibraryScreenProps {
  token: string;
  userRole: 'athlete' | 'coach' | string;
}

const CATEGORY_CHIPS = ['All', 'Strength', 'Speed', 'Endurance', 'Mobility', 'Technique', 'Recovery'];

export default function WorkoutLibraryScreen({ token, userRole }: WorkoutLibraryScreenProps) {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const isMediumScreen = width > 500 && width <= 768;

  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Selected Workout Modal
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const loadWorkouts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWorkoutTemplates(token);
      setWorkouts(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load workout library';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

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

  const handleViewDetails = (workout: WorkoutTemplate) => {
    setSelectedWorkout(workout);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedWorkout(null);
  };

  // Determine card item width for grid responsiveness
  const cardWidth = isLargeScreen ? 340 : isMediumScreen ? '48%' : '100%';

  return (
    <View style={styles.container}>
      {/* Search & Filter Header Section */}
      <Card style={styles.filterCard}>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Workout Library</Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSub }]}>
          Discover and explore structured workout templates tailored for your athletic goals.
        </Text>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search workouts by title, category, or sport..."
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
            <Text style={[styles.loadingText, { color: colors.textSub }]}>Loading workout library...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <View style={{ alignItems: 'center', padding: 24, gap: 16 }}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              <Button label="Retry" onPress={loadWorkouts} variant="primary" />
            </View>
          </Card>
        ) : filteredWorkouts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon="journal-outline"
              title={workouts.length === 0 ? 'No workouts available in library' : 'No workouts match your filters'}
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
            <CollectionGrid gap={16}>
              {filteredWorkouts.map((workout) => (
                <CollectionGridItem key={workout.id} itemWidth={cardWidth}>
                  <WorkoutCard workout={workout} onViewDetails={handleViewDetails} />
                </CollectionGridItem>
              ))}
            </CollectionGrid>
          </ScrollView>
        )}
      </View>

      {/* Workout Details Modal */}
      <WorkoutDetailsModal
        visible={isModalVisible}
        workout={selectedWorkout}
        userRole={userRole}
        onClose={handleCloseModal}
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
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  screenSubtitle: {
    fontSize: 14,
    marginTop: -4,
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
