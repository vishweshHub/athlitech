import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WorkoutTemplate } from '@/api/workout';
import { Card, Badge, Button } from '@/components/ui';
import { useThemeColors, RADIUS, SPACING } from '@/styles/tokens';

interface WorkoutCardProps {
  workout: WorkoutTemplate;
  onViewDetails: (workout: WorkoutTemplate) => void;
  onAddToMyWorkouts?: (workout: WorkoutTemplate) => void;
  isSaving?: boolean;
}

export default function WorkoutCard({
  workout,
  onViewDetails,
  onAddToMyWorkouts,
  isSaving,
}: WorkoutCardProps) {
  const colors = useThemeColors();

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

  return (
    <Card style={styles.card}>
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

      {/* Duration & Equipment row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={16} color={colors.emerald} />
          <Text style={[styles.metaText, { color: colors.textSub }]}>{workout.duration_minutes} mins</Text>
        </View>
        {workout.equipment && workout.equipment.length > 0 && (
          <View style={styles.metaItem}>
            <Ionicons name="hardware-chip-outline" size={16} color={colors.info} />
            <Text style={[styles.metaText, { color: colors.textSub }]} numberOfLines={1}>
              {workout.equipment.length} equipment
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
        {workout.description || 'No description provided.'}
      </Text>

      {/* Equipment Pills preview */}
      {workout.equipment && workout.equipment.length > 0 && (
        <View style={styles.equipmentContainer}>
          {workout.equipment.slice(0, 3).map((item, idx) => (
            <View key={idx} style={[styles.equipmentTag, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.equipmentText, { color: colors.textSub }]}>{item}</Text>
            </View>
          ))}
          {workout.equipment.length > 3 && (
            <View style={[styles.equipmentTag, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.equipmentText, { color: colors.textMuted }]}>+{workout.equipment.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <Button
          label="View Details"
          onPress={() => onViewDetails(workout)}
          variant="secondary"
          size="sm"
          style={onAddToMyWorkouts ? styles.halfBtn : styles.fullBtn}
        />
        {onAddToMyWorkouts && (
          <Button
            label="➕ Add to My Workouts"
            onPress={() => onAddToMyWorkouts(workout)}
            variant="outline"
            size="sm"
            isLoading={isSaving}
            style={styles.halfBtn}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
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
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  equipmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
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
    paddingTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  fullBtn: {
    width: '100%',
  },
  halfBtn: {
    flex: 1,
  },
});
