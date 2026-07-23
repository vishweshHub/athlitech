import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Input, Button, Badge } from '@/components/ui';
import { useThemeColors, RADIUS } from '@/styles/tokens';
import { CoachProfilePayload } from '@/api/profile';

interface CoachProfileFormProps {
  onSubmit: (payload: CoachProfilePayload) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export default function CoachProfileForm({ onSubmit, isLoading, error }: CoachProfileFormProps) {
  const colors = useThemeColors();

  // Required
  const [primarySport, setPrimarySport] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');

  // Optional
  const [bio, setBio] = useState('');

  // Validation
  const [validationErrors, setValidationErrors] = useState<{
    primarySport?: string;
    specialization?: string;
    yearsExperience?: string;
  }>({});

  const validate = () => {
    const errs: { primarySport?: string; specialization?: string; yearsExperience?: string } = {};
    if (!primarySport.trim()) errs.primarySport = 'Primary sport is required';
    if (!specialization.trim()) errs.specialization = 'Coaching specialization is required';
    if (!yearsExperience.trim()) {
      errs.yearsExperience = 'Years of experience is required';
    } else if (isNaN(parseInt(yearsExperience, 10)) || parseInt(yearsExperience, 10) < 0) {
      errs.yearsExperience = 'Please enter a valid number';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: CoachProfilePayload = {
      primary_sport: primarySport.trim(),
      specialization: specialization.trim(),
      years_experience: parseInt(yearsExperience, 10),
      bio: bio.trim() || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <Card style={styles.formCard}>
      <View style={styles.header}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.infoDim }]}>
          <Ionicons name="school-outline" size={24} color={colors.info} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Coach Profile</Text>
          <Text style={[styles.formSubtitle, { color: colors.textSub }]}>
            Complete your coaching credentials to personalize your roster & workout builder tools.
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
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Professional Required Details</Text>
          <Badge label="Required" variant="error" />
        </View>

        <Input
          label="Primary Sport *"
          placeholder="e.g. Athletics, Swimming, Football"
          value={primarySport}
          onChangeText={(t) => {
            setPrimarySport(t);
            if (validationErrors.primarySport) setValidationErrors((prev) => ({ ...prev, primarySport: undefined }));
          }}
          error={validationErrors.primarySport}
        />

        <Input
          label="Coaching Specialization *"
          placeholder="e.g. Sprinting & High Velocity Mechanics"
          value={specialization}
          onChangeText={(t) => {
            setSpecialization(t);
            if (validationErrors.specialization) setValidationErrors((prev) => ({ ...prev, specialization: undefined }));
          }}
          error={validationErrors.specialization}
        />

        <Input
          label="Years of Experience *"
          placeholder="e.g. 8"
          keyboardType="numeric"
          value={yearsExperience}
          onChangeText={(t) => {
            setYearsExperience(t);
            if (validationErrors.yearsExperience) setValidationErrors((prev) => ({ ...prev, yearsExperience: undefined }));
          }}
          error={validationErrors.yearsExperience}
        />
      </View>

      {/* OPTIONAL BIO SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Coaching Bio & Philosophy</Text>
          <Badge label="Optional" variant="neutral" />
        </View>

        <Input
          label="Coaching Bio"
          placeholder="Describe your coaching philosophy, experience, and specialties..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: 'top' }}
        />
      </View>

      <Button
        label={isLoading ? 'Saving Profile...' : 'Save & Unlock Coach Suite'}
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
});
