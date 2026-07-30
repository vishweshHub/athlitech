import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Badge, Button } from '@/components/ui';
import { useThemeColors, RADIUS } from '@/styles/tokens';
import { AthleteProfilePayload } from '@/api/profile';

interface AthleteProfileDetailsCardProps {
  userName: string;
  userEmail: string;
  profile: AthleteProfilePayload | null;
  onEdit: () => void;
  coachName?: string;
  coachEmail?: string;
}

export default function AthleteProfileDetailsCard({
  userName,
  userEmail,
  profile,
  onEdit,
  coachName,
  coachEmail,
}: AthleteProfileDetailsCardProps) {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const initial = userName ? userName.charAt(0).toUpperCase() : 'A';

  return (
    <View style={styles.container}>
      {/* ── 1. HERO PROFILE HEADER ── */}
      <Card style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.infoDim, borderColor: colors.info }]}>
            <Text style={[styles.avatarText, { color: colors.info }]}>{initial}</Text>
          </View>

          <View style={styles.heroDetails}>
            <View style={styles.heroNameRow}>
              <Text style={[styles.heroName, { color: colors.textPrimary }]}>{userName}</Text>
              <Badge label="100% Complete" variant="success" />
            </View>

            <Text style={[styles.heroEmail, { color: colors.textSub }]}>{userEmail}</Text>

            <View style={styles.heroBadgesRow}>
              <Badge label="Athlete" variant="info" />
              {profile?.sport && <Badge label={profile.sport} variant="neutral" />}
              {profile?.event && <Badge label={profile.event} variant="primary" />}
            </View>
          </View>

          <Button
            label="Edit Profile"
            onPress={onEdit}
            variant="primary"
            size="md"
            prefix={<Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />}
            style={styles.editBtn}
          />
        </View>
      </Card>

      {/* ── 2. RESPONSIVE MULTI-CARD SECTION GRID ── */}
      <View style={[styles.gridContainer, isDesktop ? styles.gridDesktop : isTablet ? styles.gridTablet : styles.gridMobile]}>
        
        {/* SECTION A: Personal Information */}
        <Card style={[styles.sectionCard, isDesktop || isTablet ? styles.colHalf : styles.colFull]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.infoDim }]}>
              <Ionicons name="person-outline" size={20} color={colors.info} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Personal Information</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Physical characteristics & bio data</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.fieldsList}>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Height</Text>
              <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>
                {profile?.height ? `${profile.height} cm` : 'Not specified'}
              </Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Weight</Text>
              <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>
                {profile?.weight ? `${profile.weight} kg` : 'Not specified'}
              </Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Date of Birth</Text>
              <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>
                {profile?.dob || 'Not specified'}
              </Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Account Status</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.activeDot, { backgroundColor: colors.emerald }]} />
                <Text style={[styles.fieldValue, { color: colors.emerald }]}>Active Athlete</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* SECTION B: Athletic Information */}
        <Card style={[styles.sectionCard, isDesktop || isTablet ? styles.colHalf : styles.colFull]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.emeraldDim }]}>
              <Ionicons name="trophy-outline" size={20} color={colors.emerald} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Athletic Profile</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Sport specialization & coaching</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.fieldsList}>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Primary Sport</Text>
              <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>
                {profile?.sport || 'Not specified'}
              </Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Primary Event / Position</Text>
              <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>
                {profile?.event || 'Not specified'}
              </Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Assigned Coach</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>
                  {coachName || 'No coach assigned'}
                </Text>
                {coachEmail ? (
                  <Text style={{ fontSize: 12, color: colors.textSub }}>{coachEmail}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Roster Discipline</Text>
              <Badge label={profile?.sport || 'Athletics'} variant="info" />
            </View>
          </View>
        </Card>

        {/* SECTION C: Performance Goals */}
        <Card style={[styles.sectionCard, styles.colFull]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.infoDim }]}>
              <Ionicons name="flag-outline" size={20} color={colors.warning} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Performance Goals & Targets</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Personal records and achievement timeline</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.goalsGrid}>
            <View style={[styles.goalTile, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
              <Ionicons name="stopwatch-outline" size={22} color={colors.info} />
              <View style={{ gap: 2 }}>
                <Text style={[styles.goalTileLabel, { color: colors.textMuted }]}>PERSONAL BEST (PB)</Text>
                <Text style={[styles.goalTileValue, { color: colors.textPrimary }]}>
                  {profile?.personal_best || 'Not specified'}
                </Text>
              </View>
            </View>

            <View style={[styles.goalTile, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
              <Ionicons name="disc-outline" size={22} color={colors.warning} />
              <View style={{ gap: 2, flex: 1 }}>
                <Text style={[styles.goalTileLabel, { color: colors.textMuted }]}>PRIMARY GOAL</Text>
                <Text style={[styles.goalTileValue, { color: colors.textPrimary }]} numberOfLines={2}>
                  {profile?.primary_goal || 'Not specified'}
                </Text>
              </View>
            </View>

            <View style={[styles.goalTile, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
              <Ionicons name="calendar-outline" size={22} color={colors.emerald} />
              <View style={{ gap: 2 }}>
                <Text style={[styles.goalTileLabel, { color: colors.textMuted }]}>TARGET TIMELINE</Text>
                <Text style={[styles.goalTileValue, { color: colors.textPrimary }]}>
                  {profile?.goal_timeline || 'Not specified'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 20,
  },
  heroCard: {
    padding: 24,
    borderRadius: RADIUS.lg,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '800',
  },
  heroDetails: {
    flex: 1,
    minWidth: 240,
    gap: 6,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroEmail: {
    fontSize: 14,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  editBtn: {
    alignSelf: 'center',
  },
  gridContainer: {
    width: '100%',
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  gridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridMobile: {
    flexDirection: 'column',
    gap: 16,
  },
  colHalf: {
    width: '48.5%',
    flexGrow: 1,
  },
  colFull: {
    width: '100%',
  },
  sectionCard: {
    padding: 20,
    borderRadius: RADIUS.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  fieldsList: {
    gap: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  goalTile: {
    flex: 1,
    minWidth: 200,
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  goalTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  goalTileValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});
