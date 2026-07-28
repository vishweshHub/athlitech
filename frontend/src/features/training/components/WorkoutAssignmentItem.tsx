import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { TodayAssignment } from '../../../types';

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
  const categoryLabel = assignment.category.replace('_', ' ').toUpperCase();
  const templateTitle = assignment.workout_template?.title || `Workout #${assignment.order}`;
  const notes = assignment.assignment_note;

  return (
    <Card style={[styles.card, style]} variant="elevated">
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={[styles.statusIcon, isCompleted && styles.completedIcon]}>
            {isCompleted ? '✓' : '○'}
          </Text>
          <Text style={[styles.title, isCompleted && styles.completedText]}>{templateTitle}</Text>
        </View>
        <Badge label={categoryLabel} variant="info" />
      </View>

      {notes ? <Text style={styles.notesText}>{notes}</Text> : null}

      {assignment.overrides && Object.keys(assignment.overrides).length > 0 ? (
        <View style={styles.overridesRow}>
          {Object.entries(assignment.overrides).map(([k, v]) => (
            <Text key={k} style={styles.overrideBadge}>
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
    color: '#38BDF8',
    marginRight: 10,
  },
  completedIcon: {
    color: '#4ADE80',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  notesText: {
    fontSize: 13,
    color: '#94A3B8',
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
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
});

export default WorkoutAssignmentItem;
