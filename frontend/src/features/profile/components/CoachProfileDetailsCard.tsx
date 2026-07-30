import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Badge, Button } from '@/components/ui';
import { useThemeColors, RADIUS } from '@/styles/tokens';
import { CoachProfilePayload } from '@/api/profile';

interface CoachProfileDetailsCardProps {
  userName: string;
  userEmail: string;
  profile: CoachProfilePayload | null;
  onEdit: () => void;
}

export default function CoachProfileDetailsCard({
  userName,
  userEmail,
  profile,
  onEdit,
}: CoachProfileDetailsCardProps) {
  const colors = useThemeColors();

  return (
    <Card style={styles.cardContainer}>
      {/* Header with Avatar, Name, Role & Status */}
      <View style={styles.headerRow}>
        <View style={[styles.avatar, { backgroundColor: colors.emeraldDim, borderColor: colors.borderEmerald }]}>
          <Text style={[styles.avatarText, { color: colors.emerald }]}>
            {userName ? userName.charAt(0).toUpperCase() : 'C'}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{userName}</Text>
            <Badge label="Completed" variant="success" />
          </View>
          <Text style={[styles.userEmail, { color: colors.textSub }]}>{userEmail}</Text>
          <View style={styles.badgeRow}>
            <Badge label="Coach" variant="info" />
          </View>
        </View>

        <Button
          label="Edit Profile"
          onPress={onEdit}
          variant="secondary"
          size="sm"
          style={{ alignSelf: 'flex-start' }}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Details Grid */}
      <View style={styles.grid}>
        <View style={[styles.gridItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>PRIMARY SPORT</Text>
          <View style={styles.valueRow}>
            <Ionicons name="trophy-outline" size={16} color={colors.emerald} />
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {profile?.primary_sport || 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={[styles.gridItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>SPECIALIZATION</Text>
          <View style={styles.valueRow}>
            <Ionicons name="fitness-outline" size={16} color={colors.info} />
            <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={1}>
              {profile?.specialization || 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={[styles.gridItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>EXPERIENCE</Text>
          <View style={styles.valueRow}>
            <Ionicons name="time-outline" size={16} color={colors.warning} />
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {profile?.years_experience !== undefined ? `${profile.years_experience} Years` : 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={[styles.gridItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>PROFILE STATUS</Text>
          <View style={styles.valueRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.emerald} />
            <Text style={[styles.value, { color: colors.emerald, fontWeight: '700' }]}>
              Completed
            </Text>
          </View>
        </View>
      </View>

      {/* Tell Athletes About You (Bio) */}
      {profile?.bio ? (
        <View style={[styles.bioContainer, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.bioLabel, { color: colors.textMuted }]}>TELL ATHLETES ABOUT YOU</Text>
          <Text style={[styles.bioText, { color: colors.textPrimary }]}>{profile.bio}</Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: 24,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    flex: 1,
    minWidth: 140,
    padding: 14,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  bioContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 6,
  },
  bioLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
