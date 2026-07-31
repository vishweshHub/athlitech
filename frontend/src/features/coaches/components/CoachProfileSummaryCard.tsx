import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Card, Badge, Button } from '@/components/ui';
import { useThemeColors, RADIUS } from '@/styles/tokens';

interface CoachProfileSummaryCardProps {
  primarySport: string;
  specialization: string;
  yearsExperience: number;
  profileCompleted: boolean;
  totalAthletes?: number;
  bio?: string;
  onEdit?: () => void;
}

export default function CoachProfileSummaryCard({
  primarySport,
  specialization,
  yearsExperience,
  profileCompleted,
  totalAthletes = 0,
  bio,
  onEdit,
}: CoachProfileSummaryCardProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const handleEdit = onEdit || (() => router.push('/complete-profile'));

  const getSeniorityTier = (years: number) => {
    if (years >= 10) return { label: 'Master Coach', variant: 'success' as const };
    if (years >= 5) return { label: 'Senior Coach', variant: 'info' as const };
    return { label: 'Certified Coach', variant: 'warning' as const };
  };

  const seniority = getSeniorityTier(yearsExperience);

  return (
    <Card style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {/* Top Hero Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={[styles.avatarBox, { backgroundColor: colors.emeraldDim, borderColor: colors.borderEmerald }]}>
            <Ionicons name="ribbon-sharp" size={26} color={colors.emerald} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Badge label={primarySport || 'General Athletics'} variant="success" />
              <Badge label={seniority.label} variant={seniority.variant} />
              <Badge label="Verified Staff" variant="neutral" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Coaching Staff Profile & Credentials</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSub }]}>
              AthliTech High Performance Program Director
            </Text>
          </View>
        </View>
        <Pressable onPress={handleEdit} style={({ pressed }) => [styles.editBtn, { borderColor: colors.borderEmerald, backgroundColor: colors.emeraldDim, opacity: pressed ? 0.7 : 1 }]}>
          <Ionicons name="create-outline" size={16} color={colors.emerald} />
          <Text style={[styles.editBtnText, { color: colors.emerald }]}>Edit Profile</Text>
        </Pressable>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

      {/* High-Density 4-Column Details Grid */}
      <View style={styles.detailsGrid}>
        <View style={[styles.detailItem, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>PRIMARY SPORT</Text>
          <View style={styles.valueRow}>
            <Ionicons name="trophy-outline" size={16} color={colors.emerald} />
            <Text style={[styles.detailValue, { color: colors.textPrimary }]} numberOfLines={1}>{primarySport || 'Not specified'}</Text>
          </View>
          <Text style={[styles.subTag, { color: colors.textMuted }]}>Main Discipline</Text>
        </View>

        <View style={[styles.detailItem, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>SPECIALIZATION</Text>
          <View style={styles.valueRow}>
            <Ionicons name="fitness-outline" size={16} color={colors.info} />
            <Text style={[styles.detailValue, { color: colors.textPrimary }]} numberOfLines={1}>{specialization || 'General Performance'}</Text>
          </View>
          <Text style={[styles.subTag, { color: colors.textMuted }]}>Primary Focus</Text>
        </View>

        <View style={[styles.detailItem, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>EXPERIENCE</Text>
          <View style={styles.valueRow}>
            <Ionicons name="time-outline" size={16} color={colors.warning} />
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{yearsExperience} {yearsExperience === 1 ? 'Year' : 'Years'}</Text>
          </View>
          <Text style={[styles.subTag, { color: colors.textMuted }]}>{seniority.label}</Text>
        </View>

        <View style={[styles.detailItem, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>ACTIVE ROSTER</Text>
          <View style={styles.valueRow}>
            <Ionicons name="people-outline" size={16} color={colors.emerald} />
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{totalAthletes} {totalAthletes === 1 ? 'Athlete' : 'Athletes'}</Text>
          </View>
          <Text style={[styles.subTag, { color: colors.textMuted }]}>Under Supervision</Text>
        </View>
      </View>

      {/* Lower Split Layout: Philosophy & Certifications */}
      <View style={styles.bottomSplitRow}>
        <View style={[styles.bioBox, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Ionicons name="document-text-outline" size={14} color={colors.emerald} />
            <Text style={[styles.bioLabel, { color: colors.textMuted }]}>COACHING PHILOSOPHY & BIO</Text>
          </View>
          <Text style={[styles.bioText, { color: colors.textSub }]}>
            {bio && bio.trim() ? bio : 'No biography provided yet. Update your credentials to share your training philosophy, athletic background, and methodology with athletes.'}
          </Text>
        </View>

        <View style={[styles.certBox, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.info} />
            <Text style={[styles.bioLabel, { color: colors.textMuted }]}>CERTIFICATIONS & SKILLS</Text>
          </View>
          <View style={styles.certChipsWrap}>
            <Badge label="Periodization & Load Management" variant="neutral" />
            <Badge label="Biomechanical Movement Analysis" variant="neutral" />
            <Badge label="High Performance Recovery" variant="neutral" />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: 140,
    minHeight: 88,
    padding: 14,
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 6,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  subTag: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  bottomSplitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  bioBox: {
    flex: 1,
    minWidth: 280,
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 4,
  },
  certBox: {
    flex: 1,
    minWidth: 280,
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 6,
  },
  certChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bioLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
