import React, { useEffect } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WorkoutTemplate } from '@/api/workout';
import { Badge, Button } from '@/components/ui';
import { useThemeColors, RADIUS, SPACING } from '@/styles/tokens';

interface WorkoutDetailsModalProps {
  visible: boolean;
  workout: WorkoutTemplate | null;
  userRole: 'athlete' | 'coach' | string;
  onClose: () => void;
  isSaved?: boolean;
  onAddToMyWorkouts?: (workout: WorkoutTemplate) => void;
  onOpenMyWorkouts?: () => void;
  isSaving?: boolean;
}

export default function WorkoutDetailsModal({
  visible,
  workout,
  userRole,
  onClose,
  isSaved = false,
  onAddToMyWorkouts,
  onOpenMyWorkouts,
  isSaving = false,
}: WorkoutDetailsModalProps) {
  const colors = useThemeColors();

  const { width, height } = useWindowDimensions();

  const isLargeScreen = width >= 1024;
  const isMediumScreen = width >= 768 && width < 1024;

  // ESC key listener for web accessibility
  useEffect(() => {
    if (Platform.OS === 'web' && visible) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onClose]);

  if (!workout) return null;

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

  // Helper to render formatted instructions as a clean numbered list
  const renderInstructions = (instructions?: string) => {
    if (!instructions || !instructions.trim()) {
      return (
        <Text style={[styles.sectionTextMuted, { color: colors.textMuted }]}>
          Follow standard warm-up, execution, and cool-down protocols for this category.
        </Text>
      );
    }

    const lines = instructions
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 1 && !lines[0].match(/^\d+[\.\)]/)) {
      return <Text style={[styles.sectionText, { color: colors.textSub }]}>{lines[0]}</Text>;
    }

    return (
      <View style={styles.instructionsList}>
        {lines.map((line, idx) => {
          const cleanText = line.replace(/^\d+[\.\)]\s*/, '');
          return (
            <View
              key={idx}
              style={[
                styles.stepCard,
                { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle },
              ]}
            >
              <View
                style={[
                  styles.stepBadge,
                  { backgroundColor: colors.emeraldDim, borderColor: colors.borderEmerald },
                ]}
              >
                <Text style={[styles.stepNumber, { color: colors.emerald }]}>{idx + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textPrimary }]}>{cleanText}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const modalWidth = isLargeScreen ? 780 : isMediumScreen ? 640 : '94%';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop for click outside */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
              width: modalWidth as any,
              maxHeight: isLargeScreen ? '85%' : '90%',
            },
          ]}
        >
          {/* 1. Header (Badges + Title + Close Button) */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <View style={styles.headerTitleContainer}>
              {/* 2. Badges */}
              <View style={styles.badgeRow}>
                <Badge label={workout.sport} variant="neutral" />
                <Badge label={workout.category} variant="info" />
                <Badge label={workout.difficulty} variant={getDifficultyVariant(workout.difficulty)} />
              </View>

              {/* 1. Workout Title */}
              <Text style={[styles.title, { color: colors.textPrimary }]}>{workout.title}</Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close modal">
              <Ionicons name="close" size={24} color={colors.textSub} />
            </Pressable>
          </View>

          {/* Scrollable Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyInner}
            showsVerticalScrollIndicator={true}
          >
            {/* 3. Duration & Metrics Bar */}
            <View style={[styles.metricsBar, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
              <View style={styles.metricCell}>
                <Ionicons name="time-outline" size={22} color={colors.emerald} />
                <View>
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Duration</Text>
                  <Text style={[styles.metricVal, { color: colors.textPrimary }]}>{workout.duration_minutes} mins</Text>
                </View>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />

              <View style={styles.metricCell}>
                <Ionicons name="trophy-outline" size={22} color={colors.info} />
                <View>
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Sport</Text>
                  <Text style={[styles.metricVal, { color: colors.textPrimary }]}>{workout.sport}</Text>
                </View>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />

              <View style={styles.metricCell}>
                <Ionicons name="layers-outline" size={22} color={colors.warning} />
                <View>
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Category</Text>
                  <Text style={[styles.metricVal, { color: colors.textPrimary }]}>{workout.category}</Text>
                </View>
              </View>
            </View>

            {/* 4. Description */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Description</Text>
              <Text style={[styles.sectionText, { color: colors.textSub }]}>
                {workout.description || 'No detailed description available for this workout template.'}
              </Text>
            </View>

            {/* 5. Equipment Required */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Equipment Required</Text>
              {workout.equipment && workout.equipment.length > 0 ? (
                <View style={styles.equipmentWrap}>
                  {workout.equipment.map((item, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.equipmentChip,
                        { backgroundColor: colors.bgMid, borderColor: colors.border },
                      ]}
                    >
                      <Ionicons name="hardware-chip-outline" size={16} color={colors.emerald} />
                      <Text style={[styles.equipmentChipText, { color: colors.textPrimary }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.sectionTextMuted, { color: colors.textMuted }]}>
                  No special equipment required.
                </Text>
              )}
            </View>

            {/* 6. Instructions */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Instructions</Text>
              {renderInstructions(workout.instructions)}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.borderSubtle }]}>
            {userRole === 'athlete' ? (
              <View style={styles.actionWrapper}>
                {isSaved ? (
                  <Button
                    label="Open in My Workouts"
                    onPress={() => {
                      onClose();
                      onOpenMyWorkouts?.();
                    }}
                    variant="primary"
                  />
                ) : (
                  <Button
                    label="➕ Add to My Workouts"
                    onPress={() => {
                      if (workout) onAddToMyWorkouts?.(workout);
                    }}
                    variant="primary"
                    isLoading={isSaving}
                  />
                )}
              </View>
            ) : userRole === 'coach' ? (
              <View style={styles.actionWrapper}>
                <Button
                  label="Assign Workout (Coming Soon)"
                  onPress={() => {}}
                  variant="primary"
                  disabled
                  style={{ opacity: 0.65 }}
                />
              </View>
            ) : null}
            <Button label="Close" onPress={onClose} variant="secondary" />
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',

    padding: SPACING.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    maxHeight: '88%',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 28,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,

    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  closeBtn: {
    padding: 8,
    borderRadius: RADIUS.full,
    marginTop: -4,
  },
  body: {
    flex: 1,
  },
  bodyInner: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: 24,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'space-between',
  },

  metricCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },

  metricDivider: {
    width: 1,
    height: 32,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  sectionTextMuted: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  equipmentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  equipmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  equipmentChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  instructionsList: {
    gap: 10,
    marginTop: 4,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepNumber: {
    fontSize: 13,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,

  },
  actionWrapper: {
    flex: 1,
  },
});
