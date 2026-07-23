import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Input, Button, Badge } from '@/components/ui';
import { useThemeColors, RADIUS } from '@/styles/tokens';
import { AthleteProfilePayload } from '@/api/profile';

interface AthleteProfileFormProps {
  onSubmit: (payload: AthleteProfilePayload) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const GOAL_TIMELINES = ['3 Months', '6 Months', '1 Year', 'Custom'];

export default function AthleteProfileForm({ onSubmit, isLoading, error }: AthleteProfileFormProps) {
  const colors = useThemeColors();

  // Required
  const [sport, setSport] = useState('');
  const [event, setEvent] = useState('');

  // Recommended
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [dob, setDob] = useState('');

  // Optional
  const [personalBest, setPersonalBest] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [goalTimeline, setGoalTimeline] = useState('6 Months');

  // Validation
  const [validationErrors, setValidationErrors] = useState<{ sport?: string; event?: string }>({});

  const validate = () => {
    const errs: { sport?: string; event?: string } = {};
    if (!sport.trim()) errs.sport = 'Sport is required';
    if (!event.trim()) errs.event = 'Event is required';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: AthleteProfilePayload = {
      sport: sport.trim(),
      event: event.trim(),
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      dob: dob.trim() || undefined,
      personal_best: personalBest.trim() || undefined,
      primary_goal: primaryGoal.trim() || undefined,
      goal_timeline: goalTimeline,
    };

    await onSubmit(payload);
  };

  return (
    <Card style={styles.formCard}>
      <View style={styles.header}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.emeraldDim }]}>
          <Ionicons name="fitness-outline" size={24} color={colors.emerald} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Athlete Profile</Text>
          <Text style={[styles.formSubtitle, { color: colors.textSub }]}>
            Complete your sports details to unlock personalized workout recommendations & tracking.
          </Text>
        </View>
      </View>

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.errorDim }]}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      {/* REQUIRED SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Required Details</Text>
          <Badge label="Required" variant="error" />
        </View>

        <Input
          label="Primary Sport *"
          placeholder="e.g. Athletics, Swimming, Basketball"
          value={sport}
          onChangeText={(t) => {
            setSport(t);
            if (validationErrors.sport) setValidationErrors((prev) => ({ ...prev, sport: undefined }));
          }}
          error={validationErrors.sport}
        />

        <Input
          label="Primary Event / Position *"
          placeholder="e.g. 100m Sprint, Point Guard, Freestyle 100m"
          value={event}
          onChangeText={(t) => {
            setEvent(t);
            if (validationErrors.event) setValidationErrors((prev) => ({ ...prev, event: undefined }));
          }}
          error={validationErrors.event}
        />
      </View>

      {/* RECOMMENDED SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recommended Physical Info</Text>
          <Badge label="Recommended" variant="info" />
        </View>

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label="Height (cm)"
              placeholder="e.g. 178"
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="Weight (kg)"
              placeholder="e.g. 72"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
          </View>
        </View>

        <Input
          label="Date of Birth"
          placeholder="YYYY-MM-DD"
          value={dob}
          onChangeText={setDob}
        />
      </View>

      {/* OPTIONAL SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Goals & Personal Bests</Text>
          <Badge label="Optional" variant="neutral" />
        </View>

        <Input
          label="Personal Best (PB)"
          placeholder="e.g. 10.45s (100m) or 24.2s"
          value={personalBest}
          onChangeText={setPersonalBest}
        />

        <Input
          label="Primary Training Goal"
          placeholder="e.g. Break 10.30s mark in upcoming championship"
          value={primaryGoal}
          onChangeText={setPrimaryGoal}
        />

        <Text style={[styles.inputLabel, { color: colors.textSub }]}>Goal Timeline</Text>
        <View style={styles.timelineContainer}>
          {GOAL_TIMELINES.map((tl) => {
            const isSelected = goalTimeline === tl;
            return (
              <Pressable
                key={tl}
                onPress={() => setGoalTimeline(tl)}
                style={[
                  styles.timelinePill,
                  {
                    backgroundColor: isSelected ? colors.emeraldDim : colors.bgMid,
                    borderColor: isSelected ? colors.emerald : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timelinePillText,
                    { color: isSelected ? colors.emerald : colors.textSub, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {tl}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        label={isLoading ? 'Saving Profile...' : 'Save & Unlock Experience'}
        onPress={handleSubmit}
        variant="primary"
        loading={isLoading}
        style={{ marginTop: 12 }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  formCard: {
    padding: 24,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  timelineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timelinePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  timelinePillText: {
    fontSize: 13,
  },
});
