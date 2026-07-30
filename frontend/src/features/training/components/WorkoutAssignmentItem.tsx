import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { TodayAssignment } from '../../../types';
import { useThemeColors, RADIUS } from '@/styles/tokens';

interface WorkoutAssignmentItemProps {
  assignment: TodayAssignment;
  isCompleted?: boolean;
  style?: ViewStyle;
}

export const WorkoutAssignmentItem: React.FC<WorkoutAssignmentItemProps> = ({
  assignment,
  isCompleted = false,
  style,
}) => {
  const colors = useThemeColors();
  const categoryLabel = assignment.category.replace('_', ' ').toUpperCase();
  const templateTitle = assignment.workout_template?.title || `Workout #${assignment.order}`;
  const notes = assignment.assignment_note;

  return (
    <Card style={[styles.card, style]} variant="elevated">
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={[styles.statusIcon, { color: isCompleted ? colors.emerald : colors.info }]}>
            {isCompleted ? '✓' : '○'}
          </Text>
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary },
              isCompleted && [styles.completedText, { color: colors.textMuted }],
            ]}
          >
            {templateTitle}
          </Text>
        </View>
        <Badge label={categoryLabel} variant="info" />
      </View>

      {notes ? <Text style={[styles.notesText, { color: colors.textSub }]}>{notes}</Text> : null}

      {assignment.overrides && Object.keys(assignment.overrides).length > 0 ? (
        <View style={styles.overridesRow}>
          {Object.entries(assignment.overrides).map(([k, v]) => (
            <Text key={k} style={[styles.overrideBadge, { color: colors.info, backgroundColor: colors.infoDim }]}>
              {k}: {String(v)}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: '800',
    marginRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  notesText: {
    fontSize: 13,
    marginTop: 6,
    marginLeft: 26,
    lineHeight: 18,
  },
  overridesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginLeft: 26,
  },
  overrideBadge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
});

export default WorkoutAssignmentItem;
