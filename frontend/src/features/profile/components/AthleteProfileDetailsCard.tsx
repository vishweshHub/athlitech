import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Badge, Button } from '@/components/ui';
import { useThemeColors, RADIUS } from '@/styles/tokens';
import { AthleteProfilePayload } from '@/api/profile';

interface AthleteProfileDetailsCardProps {
  userName: string;
  userEmail: string;
  profile: AthleteProfilePayload | null;
  onEdit: () => void;
}

export default function AthleteProfileDetailsCard({
  userName,
  userEmail,
  profile,
  onEdit,
}: AthleteProfileDetailsCardProps) {
  const colors = useThemeColors();

  return (
    <Card style={styles.cardContainer}>
      {/* Header with Avatar, Name, Role & Status */}
      <View style={styles.headerRow}>
        <View style={[styles.avatar, { backgroundColor: colors.infoDim, borderColor: 'rgba(14,165,233,0.3)' }]}>
          <Text style={[styles.avatarText, { color: colors.info }]}>
            {userName ? userName.charAt(0).toUpperCase() : 'A'}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{userName}</Text>
            <Badge label="Completed" variant="success" />
          </View>
          <Text style={[styles.userEmail, { color: colors.textSub }]}>{userEmail}</Text>
          <View style={styles.badgeRow}>
            <Badge label="Athlete" variant="info" />
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

      {/* Required Sports Details */}
      <View style={styles.grid}>
        <View style={[styles.gridItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>PRIMARY SPORT</Text>
          <View style={styles.valueRow}>
            <Ionicons name="trophy-outline" size={16} color={colors.emerald} />
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {profile?.sport || 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={[styles.gridItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>PRIMARY EVENT / POSITION</Text>
          <View style={styles.valueRow}>
            <Ionicons name="flag-outline" size={16} color={colors.info} />
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {profile?.event || 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={[styles.gridItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>HEIGHT</Text>
          <View style={styles.valueRow}>
            <Ionicons name="resize-outline" size={16} color={colors.warning} />
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {profile?.height ? `${profile.height} cm` : 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={[styles.gridItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>WEIGHT</Text>
          <View style={styles.valueRow}>
            <Ionicons name="body-outline" size={16} color={colors.emerald} />
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {profile?.weight ? `${profile.weight} kg` : 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={[styles.gridItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>PERSONAL BEST (PB)</Text>
          <View style={styles.valueRow}>
            <Ionicons name="stopwatch-outline" size={16} color={colors.info} />
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {profile?.personal_best || 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={[styles.gridItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>PRIMARY GOAL</Text>
          <View style={styles.valueRow}>
            <Ionicons name="disc-outline" size={16} color={colors.warning} />
            <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={1}>
              {profile?.primary_goal || 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={[styles.gridItem, { backgroundColor: colors.bgMid, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>GOAL TIMELINE</Text>
          <View style={styles.valueRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.emerald} />
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {profile?.goal_timeline || 'Not specified'}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: 24,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
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
    minWidth: 160,
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
});
