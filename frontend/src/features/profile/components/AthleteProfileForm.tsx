import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Input, Button, Badge } from '@/components/ui';
import { useThemeColors, RADIUS } from '@/styles/tokens';
import { AthleteProfilePayload } from '@/api/profile';
import { fetchSports } from '@/api/workout';

interface AthleteProfileFormProps {
  onSubmit: (payload: AthleteProfilePayload) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  initialData?: AthleteProfilePayload | null;
}

const GOAL_TIMELINES = ['3 Months', '6 Months', '1 Year', 'Custom'];
const DEFAULT_SPORTS = ['Track & Field', 'Football', 'Basketball', 'Cricket', 'General Fitness'];

export default function AthleteProfileForm({ onSubmit, isLoading, error, initialData }: AthleteProfileFormProps) {
  const colors = useThemeColors();

  // Dynamic Sports from Backend
  const [availableSports, setAvailableSports] = useState<string[]>(DEFAULT_SPORTS);

  // Required
  const [sport, setSport] = useState(initialData?.sport || '');
  const [event, setEvent] = useState(initialData?.event || '');

  // Fetch dynamic sports list from Workout Library
  useEffect(() => {
    async function loadSports() {
      try {
        const sportsList = await fetchSports();
        if (sportsList && sportsList.length > 0) {
          setAvailableSports(sportsList);
          if (!sport && sportsList.length > 0) {
            setSport(sportsList[0]);
          }
        }
      } catch (err) {
        console.warn('Failed to load dynamic sports list:', err);
      }
    }
    loadSports();
  }, []);

  // Recommended
  const [height, setHeight] = useState(initialData?.height !== undefined && initialData?.height !== null ? String(initialData.height) : '');
  const [weight, setWeight] = useState(initialData?.weight !== undefined && initialData?.weight !== null ? String(initialData.weight) : '');
  const [dob, setDob] = useState(initialData?.dob || '');

  // Optional
  const [personalBest, setPersonalBest] = useState(initialData?.personal_best || '');
  const [primaryGoal, setPrimaryGoal] = useState(initialData?.primary_goal || '');
  const [goalTimeline, setGoalTimeline] = useState(initialData?.goal_timeline || '6 Months');

  // Synchronize when initialData is loaded asynchronously
  useEffect(() => {
    if (initialData) {
      if (initialData.sport) setSport(initialData.sport);
      if (initialData.event) setEvent(initialData.event);
      if (initialData.height !== undefined && initialData.height !== null) setHeight(String(initialData.height));
      if (initialData.weight !== undefined && initialData.weight !== null) setWeight(String(initialData.weight));
      if (initialData.dob) setDob(initialData.dob);
      if (initialData.personal_best) setPersonalBest(initialData.personal_best);
      if (initialData.primary_goal) setPrimaryGoal(initialData.primary_goal);
      if (initialData.goal_timeline) setGoalTimeline(initialData.goal_timeline);
    }
  }, [initialData]);

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
            {initialData ? 'Manage and update your athletic profile and goals.' : 'Complete your sports details to unlock personalized workout recommendations & tracking.'}
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

        <Text style={[styles.inputLabel, { color: colors.textSub }]}>Primary Sport *</Text>
        <View style={styles.timelineContainer}>
          {availableSports.map((s) => {
            const isSelected = sport.toLowerCase().trim() === s.toLowerCase().trim();
            return (
              <Pressable
                key={s}
                onPress={() => {
                  setSport(s);
                  if (validationErrors.sport) setValidationErrors((prev) => ({ ...prev, sport: undefined }));
                }}
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
                  {s}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {validationErrors.sport && (
          <Text style={{ fontSize: 12, color: colors.error, marginTop: -4 }}>{validationErrors.sport}</Text>
        )}

        <Input
          label="Or Custom Sport Name"
          placeholder="Enter sport if not listed above"
          value={sport}
          onChangeText={(t) => {
            setSport(t);
            if (validationErrors.sport) setValidationErrors((prev) => ({ ...prev, sport: undefined }));
          }}
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
        label={isLoading ? 'Saving Profile...' : (initialData ? 'Update Profile' : 'Save & Unlock Experience')}
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
