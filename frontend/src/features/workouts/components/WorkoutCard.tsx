import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WorkoutTemplate } from '@/api/workout';
import { Badge, Button } from '@/components/ui';
import { useThemeColors, RADIUS, SPACING } from '@/styles/tokens';

interface WorkoutCardProps {
  workout: WorkoutTemplate;
  onViewDetails: (workout: WorkoutTemplate) => void;
  onAddToMyWorkouts?: (workout: WorkoutTemplate) => void;
  onAssignToAthlete?: (workout: WorkoutTemplate) => void;
  isSaving?: boolean;
}

export default function WorkoutCard({
  workout,
  onViewDetails,
  onAddToMyWorkouts,
  onAssignToAthlete,
  isSaving,
}: WorkoutCardProps) {
  const colors = useThemeColors();
  const [hovered, setHovered] = useState(false);

  const getDifficultyVariant = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'success';
      case 'Intermediate':
        return 'warning';
      case 'Advanced':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const exerciseCount = (workout as any).exercises?.length || 0;

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => onViewDetails(workout)}
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.bgCard,
          borderColor: hovered ? colors.emerald : colors.border,
          shadowColor: hovered ? colors.emerald : colors.cardShadow,
          shadowOffset: { width: 0, height: hovered ? 10 : 4 },
          shadowOpacity: hovered ? 0.25 : 0.12,
          shadowRadius: hovered ? 16 : 8,
          elevation: hovered ? 8 : 3,
        },
        Platform.OS === 'web' &&
          ({
            transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
            transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
          } as any),
      ]}
    >
      {/* Content wrapper */}
      <View style={styles.cardContent}>
        {/* Header Badges */}
        <View style={styles.headerRow}>
          <View style={styles.badgeGroup}>
            <Badge label={workout.sport} variant="neutral" />
            <Badge label={workout.category} variant="info" />
          </View>
          <Badge label={workout.difficulty} variant={getDifficultyVariant(workout.difficulty)} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {workout.title}
        </Text>

        {/* Meta Row: Duration & Exercises / Equipment */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={colors.emerald} />
            <Text style={[styles.metaText, { color: colors.textSub }]}>
              {workout.duration_minutes} mins
            </Text>
          </View>
          {exerciseCount > 0 ? (
            <View style={styles.metaItem}>
              <Ionicons name="barbell-outline" size={16} color={colors.info} />
              <Text style={[styles.metaText, { color: colors.textSub }]}>
                {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
              </Text>
            </View>
          ) : workout.equipment && workout.equipment.length > 0 ? (
            <View style={styles.metaItem}>
              <Ionicons name="hardware-chip-outline" size={16} color={colors.info} />
              <Text style={[styles.metaText, { color: colors.textSub }]} numberOfLines={1}>
                {workout.equipment.length} equipment
              </Text>
            </View>
          ) : null}
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSub }]} numberOfLines={2}>
          {workout.description || 'No description provided.'}
        </Text>

        {/* Equipment Pills preview */}
        {workout.equipment && workout.equipment.length > 0 && (
          <View style={styles.equipmentContainer}>
            {workout.equipment.slice(0, 3).map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.equipmentTag,
                  { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle },
                ]}
              >
                <Text style={[styles.equipmentText, { color: colors.textSub }]}>{item}</Text>
              </View>
            ))}
            {workout.equipment.length > 3 && (
              <View
                style={[
                  styles.equipmentTag,
                  { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle },
                ]}
              >
                <Text style={[styles.equipmentText, { color: colors.textMuted }]}>
                  +{workout.equipment.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Action Buttons Row (bottom-aligned) */}
      <View style={[styles.actionRow, { borderTopColor: colors.borderSubtle }]}>
        <Button
          label="View Details"
          onPress={() => onViewDetails(workout)}
          variant="secondary"
          size="sm"
          style={styles.actionBtn}
        />
        {onAddToMyWorkouts ? (
          <Button
            label="➕ Add to My Workouts"
            onPress={() => onAddToMyWorkouts(workout)}
            variant="primary"
            size="sm"
            isLoading={isSaving}
            style={styles.actionBtn}
          />
        ) : onAssignToAthlete ? (
          <Button
            label="Assign Workout"
            onPress={() => onAssignToAthlete(workout)}
            variant="primary"
            size="sm"
            style={styles.actionBtn}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    minHeight: 280,
  },
  cardContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  equipmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  equipmentTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  equipmentText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionRow: {
    marginTop: 'auto',
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
  },
});
