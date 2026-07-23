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
  bio?: string;
  onEdit?: () => void;
}

export default function CoachProfileSummaryCard({
  primarySport,
  specialization,
  yearsExperience,
  profileCompleted,
  bio,
  onEdit,
}: CoachProfileSummaryCardProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const handleEdit = onEdit || (() => router.push('/complete-profile'));

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={[styles.iconBox, { backgroundColor: colors.emeraldDim }]}>
            <Ionicons name="ribbon" size={22} color={colors.emerald} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Coach Profile</Text>
            </View>
            <Text style={[styles.cardSubtitle, { color: colors.textSub }]}>
              Professional coaching summary & specialty details
            </Text>
          </View>
        </View>
        <Pressable onPress={handleEdit} style={({ pressed }) => [styles.editBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
          <Ionicons name="create-outline" size={16} color={colors.emerald} />
          <Text style={[styles.editBtnText, { color: colors.emerald }]}>Edit Profile</Text>
        </Pressable>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.detailsGrid}>
        <View style={[styles.detailItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>PRIMARY SPORT</Text>
          <View style={styles.valueRow}>
            <Ionicons name="trophy-outline" size={16} color={colors.emerald} />
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{primarySport || 'Not specified'}</Text>
          </View>
        </View>

        <View style={[styles.detailItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>SPECIALIZATION</Text>
          <View style={styles.valueRow}>
            <Ionicons name="fitness-outline" size={16} color={colors.info} />
            <Text style={[styles.detailValue, { color: colors.textPrimary }]} numberOfLines={1}>{specialization || 'Not specified'}</Text>
          </View>
        </View>

        <View style={[styles.detailItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>EXPERIENCE</Text>
          <View style={styles.valueRow}>
            <Ionicons name="time-outline" size={16} color={colors.warning} />
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{yearsExperience} {yearsExperience === 1 ? 'Year' : 'Years'}</Text>
          </View>
        </View>
      </View>

      {bio ? (
        <View style={[styles.bioBox, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.bioLabel, { color: colors.textMuted }]}>TELL ATHLETES ABOUT YOU</Text>
          <Text style={[styles.bioText, { color: colors.textPrimary }]}>{bio}</Text>
        </View>
      ) : null}

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
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
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
    padding: 12,
    borderRadius: RADIUS.sm,
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
  bioBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 4,
  },
  bioLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
