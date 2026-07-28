import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ViewStyle } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { TodayAssignment } from '../../../types';

interface WorkoutAssignmentChecklistProps {
  assignments: TodayAssignment[];
  completedAssignmentIds: string[];
  onToggleAssignment: (assignmentId: string) => void;
  style?: ViewStyle;
}

export const WorkoutAssignmentChecklist: React.FC<WorkoutAssignmentChecklistProps> = ({
  assignments,
  completedAssignmentIds,
  onToggleAssignment,
  style,
}) => {
  if (!assignments || assignments.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={styles.emptyText}>No workout assignments scheduled for this session.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {assignments.map((assignment, index) => {
        const assignmentId = assignment.id || `assignment-${index}`;
        const isDone = completedAssignmentIds.includes(assignmentId);
        const categoryLabel = assignment.category.replace('_', ' ').toUpperCase();
        const title = assignment.workout_template?.title || `Exercise #${assignment.order}`;

        return (
          <TouchableOpacity
            key={assignmentId}
            onPress={() => onToggleAssignment(assignmentId)}
            activeOpacity={0.8}
          >
            <Card style={[styles.card, isDone && styles.completedCard]} variant="elevated">
              <View style={styles.row}>
                <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                  <Text style={[styles.checkboxText, isDone && styles.checkboxTextDone]}>
                    {isDone ? '✓' : '○'}
                  </Text>
                </View>

                <View style={styles.content}>
                  <View style={styles.headerRow}>
                    <Text style={[styles.title, isDone && styles.titleDone]}>{title}</Text>
                    <Badge label={categoryLabel} variant={isDone ? 'success' : 'info'} />
                  </View>

                  {assignment.assignment_note ? (
                    <Text style={styles.notesText}>{assignment.assignment_note}</Text>
                  ) : null}

                  {assignment.overrides && Object.keys(assignment.overrides).length > 0 ? (
                    <View style={styles.overridesRow}>
                      {Object.entries(assignment.overrides).map(([k, v]) => (
                        <Text key={k} style={styles.overrideBadge}>
                          {k}: {String(v)}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  card: {
    marginVertical: 4,
    padding: 14,
  },
  completedCard: {
    borderColor: 'rgba(74, 222, 128, 0.3)',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxDone: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
  },
  checkboxText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#38BDF8',
  },
  checkboxTextDone: {
    color: '#4ADE80',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
    paddingRight: 8,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  notesText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  overridesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  overrideBadge: {
    fontSize: 11,
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});

export default WorkoutAssignmentChecklist;
