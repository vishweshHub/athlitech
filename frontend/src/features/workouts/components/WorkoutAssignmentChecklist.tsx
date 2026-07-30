import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ViewStyle } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { TodayAssignment } from '../../../types';
import { useThemeColors, RADIUS } from '@/styles/tokens';

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
  const colors = useThemeColors();

  if (!assignments || assignments.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={[styles.emptyText, { color: colors.textSub }]}>No workout assignments scheduled for this session.</Text>
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
            <Card
              style={[
                styles.card,
                isDone && { borderColor: colors.borderEmerald, backgroundColor: colors.emeraldDim },
              ]}
              variant="elevated"
            >
              <View style={styles.row}>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: colors.info },
                    isDone && { borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
                  ]}
                >
                  <Text
                    style={[
                      styles.checkboxText,
                      { color: colors.info },
                      isDone && { color: colors.emerald },
                    ]}
                  >
                    {isDone ? '✓' : '○'}
                  </Text>
                </View>

                <View style={styles.content}>
                  <View style={styles.headerRow}>
                    <Text
                      style={[
                        styles.title,
                        { color: colors.textPrimary },
                        isDone && [styles.titleDone, { color: colors.textMuted }],
                      ]}
                    >
                      {title}
                    </Text>
                    <Badge label={categoryLabel} variant={isDone ? 'success' : 'info'} />
                  </View>

                  {assignment.assignment_note ? (
                    <Text style={[styles.notesText, { color: colors.textSub }]}>{assignment.assignment_note}</Text>
                  ) : null}

                  {assignment.overrides && Object.keys(assignment.overrides).length > 0 ? (
                    <View style={styles.overridesRow}>
                      {Object.entries(assignment.overrides).map(([k, v]) => (
                        <Text
                          key={k}
                          style={[
                            styles.overrideBadge,
                            { color: colors.info, backgroundColor: colors.infoDim },
                          ]}
                        >
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxText: {
    fontSize: 16,
    fontWeight: '800',
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
    flex: 1,
    paddingRight: 8,
  },
  titleDone: {
    textDecorationLine: 'line-through',
  },
  notesText: {
    fontSize: 13,
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default WorkoutAssignmentChecklist;
