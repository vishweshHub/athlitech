import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SHADOW, useThemeColors } from '@/styles/tokens';
import PressButton from '@/components/ui/PressButton';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import {
  MiniAthletePreview,
  MiniCoachPreview,
  MiniOrgPreview,
} from './MiniDashboardPreviews';

import { RoleStatusInfo } from '@/api/roleHub';

export type RoleCardType = 'athlete' | 'coach' | 'organization';

interface RoleCardProps {
  type: RoleCardType;
  isActive: boolean;
  roleInfo?: RoleStatusInfo | null;
  isLoading?: boolean;
  onOpenDashboard: () => void;
  onExploreRole: () => void;
  onReactivateWorkspace?: () => void;
  onOpenManageSubscription?: () => void;
}

const CARD_DATA = {
  athlete: {
    title: 'Athlete Workspace',
    outcome: 'Never lose another training session. Track personal records and monitor recovery in real time.',
    capabilities: [
      'Real-time set, rep, & intensity logging',
      'Personal Best & metric sparkline tracking',
      'Direct workout sync from your coaching staff',
    ],
    accentColor: '#10B981',
    icon: 'fitness' as const,
  },
  coach: {
    title: 'Coach Platform',
    outcome: 'Eliminate spreadsheet chaos. Keep your entire squad accountable with instant workout distribution.',
    capabilities: [
      'Manage team rosters & group assignments',
      'Construct multi-week periodized plans',
      'Real-time squad completion analytics',
    ],
    accentColor: '#3B82F6',
    icon: 'clipboard' as const,
  },
  organization: {
    title: 'Organization Hub',
    outcome: 'Unify your entire athletic club. Manage multi-team rosters, staff permissions, and central billing.',
    capabilities: [
      'Multi-team data partitioning & RBAC roles',
      'Custom staff permissions & audit trails',
      'Centralized subscription seat control',
    ],
    accentColor: '#8B5CF6',
    icon: 'business' as const,
  },
};

export default function RoleCard({
  type,
  isActive,
  roleInfo,
  isLoading = false,
  onOpenDashboard,
  onExploreRole,
  onReactivateWorkspace,
  onOpenManageSubscription,
}: RoleCardProps) {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const styles = getStyles(colors, width);
  const data = CARD_DATA[type];

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const hasExistingProfile = Boolean(roleInfo?.has_existing_profile || roleInfo?.role_profile_id);

  const handleMouseEnter = () => {
    if (Platform.OS === 'web') {
      translateY.value = withSpring(-6, { damping: 12, stiffness: 200 });
      scale.value = withSpring(1.015, { damping: 12, stiffness: 200 });
      glowOpacity.value = withTiming(1, { duration: 300 });
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      translateY.value = withSpring(0, { damping: 12, stiffness: 200 });
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    borderColor: glowOpacity.value === 1 ? data.accentColor : colors.border,
    shadowColor: data.accentColor,
    shadowOpacity: glowOpacity.value * 0.25,
    shadowRadius: 20,
  }));

  const renderPreview = () => {
    if (type === 'athlete') return <MiniAthletePreview />;
    if (type === 'coach') return <MiniCoachPreview />;
    return <MiniOrgPreview />;
  };

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SkeletonLoader width={44} height={44} borderRadius={RADIUS.md} />
          <SkeletonLoader width={90} height={24} borderRadius={RADIUS.full} />
        </View>
        <SkeletonLoader width="70%" height={26} style={{ marginBottom: 12 }} />
        <SkeletonLoader width="100%" height={40} style={{ marginBottom: 20 }} />
        <SkeletonLoader width="100%" height={160} style={{ marginBottom: 24 }} />
        <SkeletonLoader width="100%" height={48} borderRadius={RADIUS.md} />
      </View>
    );
  }

  const isWideCard = width >= 900;

  const getStatusLabel = () => {
    if (isActive) return 'Active Workspace';
    if (hasExistingProfile) return 'Reactivate Workspace';
    return 'Available';
  };

  const getPrimaryButtonLabel = () => {
    if (isActive) return 'Open Workspace →';
    if (hasExistingProfile) return 'Reactivate Workspace ↻';
    return 'Unlock Workspace →';
  };

  return (
    <Animated.View
      style={[
        styles.card,
        isActive && styles.cardActiveBorder,
        isWideCard ? styles.cardWideLayout : styles.cardColumnLayout,
        animatedCardStyle,
      ]}
      // @ts-ignore
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left Column: Details, Capabilities, & Context-Aware Actions */}
      <View style={isWideCard ? styles.leftSection : styles.fullSection}>
        {/* Header & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.iconTitleRow}>
            <View style={[styles.iconWrap, { backgroundColor: `${data.accentColor}1A` }]}>
              <Ionicons name={data.icon} size={26} color={data.accentColor} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{data.title}</Text>
              <Text style={styles.cardSubtitle}>
                {type === 'athlete' ? 'For Individual Competitors' : type === 'coach' ? 'For Head Coaches & Trainers' : 'For Sports Clubs & Enterprises'}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              isActive ? styles.badgeActive : hasExistingProfile ? styles.badgeWarning : styles.badgeInactive,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isActive ? styles.dotActive : hasExistingProfile ? styles.dotWarning : styles.dotInactive,
              ]}
            />
            <Text
              style={[
                styles.statusBadgeText,
                isActive ? styles.textActive : hasExistingProfile ? styles.textWarning : styles.textInactive,
              ]}
            >
              {getStatusLabel()}
            </Text>
          </View>
        </View>

        {/* Outcome Copy */}
        <Text style={styles.cardOutcome}>{data.outcome}</Text>

        {/* Capability Highlights Checklist */}
        <View style={styles.capabilitiesBox}>
          <Text style={styles.capabilitiesTitle}>KEY UNLOCKED CAPABILITIES</Text>
          {data.capabilities.map((cap, idx) => (
            <View key={idx} style={styles.capabilityRow}>
              <Ionicons name="checkmark-circle" size={16} color={data.accentColor} />
              <Text style={styles.capabilityText}>{cap}</Text>
            </View>
          ))}
        </View>

        {/* Action Footer */}
        <View style={styles.cardFooter}>
          {isActive ? (
            <View style={styles.actionRow}>
              <PressButton
                label={getPrimaryButtonLabel()}
                onPress={onOpenDashboard}
                style={{ flex: 1, backgroundColor: data.accentColor }}
              />
              {onOpenManageSubscription ? (
                <TouchableOpacity style={styles.subBtnLink} onPress={onOpenManageSubscription}>
                  <Ionicons name="card-outline" size={15} color={colors.textMuted} />
                  <Text style={styles.subBtnLinkText}>Manage Subscription</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : hasExistingProfile ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.reactivateBtn, { backgroundColor: data.accentColor, flex: 1 }]}
                onPress={onReactivateWorkspace}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={16} color="#FFF" />
                <Text style={styles.reactivateBtnText}>{getPrimaryButtonLabel()}</Text>
              </TouchableOpacity>
              {onOpenManageSubscription ? (
                <TouchableOpacity style={styles.subBtnLink} onPress={onOpenManageSubscription}>
                  <Ionicons name="card-outline" size={15} color={colors.textMuted} />
                  <Text style={styles.subBtnLinkText}>Manage Subscription</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtnOutline, { borderColor: data.accentColor, flex: 1 }]}
                onPress={onExploreRole}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionBtnOutlineText, { color: data.accentColor }]}>{getPrimaryButtonLabel()}</Text>
                <Ionicons name="arrow-forward" size={16} color={data.accentColor} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Right Column: Visual Dashboard Mockup Preview */}
      <View style={isWideCard ? styles.rightSection : styles.fullPreviewSection}>
        <View style={styles.previewContainerHeader}>
          <Text style={styles.previewHeaderText}>WORKSPACE DASHBOARD PREVIEW</Text>
        </View>
        <View style={styles.previewWrap}>{renderPreview()}</View>
      </View>
    </Animated.View>
  );
}

const getStyles = (colors: ReturnType<typeof useThemeColors>, width: number = 1024) =>
  StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: colors.bgGlass,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.xl,
      padding: width < 480 ? 16 : 24,
      marginBottom: 24,
      ...SHADOW.card,
    },
    cardWideLayout: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 28,
    },
    cardColumnLayout: {
      flexDirection: 'column',
      gap: 20,
    },
    cardActiveBorder: {
      borderColor: 'rgba(16, 185, 129, 0.4)',
      borderWidth: 2,
    },
    leftSection: {
      flex: 1.2,
      justifyContent: 'space-between',
    },
    fullSection: {
      width: '100%',
    },
    rightSection: {
      flex: 1,
      minWidth: width < 480 ? '100%' : 320,
      maxWidth: '100%',
      justifyContent: 'center',
    },
    fullPreviewSection: {
      width: '100%',
      marginTop: 8,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      flexWrap: 'wrap',
      gap: 12,
    },
    iconTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roleTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    roleSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 2,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.full,
    },
    activeBadge: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    inactiveBadge: {
      backgroundColor: colors.bgMid,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 99,
    },
    activeDot: {
      backgroundColor: colors.emerald,
    },
    inactiveDot: {
      backgroundColor: colors.textMuted,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    activeStatusText: {
      color: colors.emerald,
    },
    inactiveStatusText: {
      color: colors.textMuted,
    },
    description: {
      color: colors.textSub,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 16,
    },
    checklistContainer: {
      gap: 8,
      marginBottom: 20,
    },
    checkItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    checkText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '500',
    },
    previewContainerHeader: {
      marginBottom: 8,
    },
    previewHeaderText: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },
    previewWrap: {
      width: '100%',
    },
    cardFooter: {
      marginTop: 'auto',
      paddingTop: 12,
    },
    actionRow: {
      flexDirection: width < 480 ? 'column' : 'row',
      alignItems: width < 480 ? 'stretch' : 'center',
      gap: 12,
      width: '100%',
      flexWrap: 'wrap',
    },
    subBtnLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      width: width < 480 ? '100%' : 'auto',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    subBtnLinkText: {
      color: colors.textSub,
      fontSize: 13,
      fontWeight: '600',
    },
    reactivateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: RADIUS.md,
    },
    reactivateBtnText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '800',
    },
    actionBtnOutline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1.5,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: RADIUS.md,
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    actionBtnOutlineText: {
      fontSize: 14,
      fontWeight: '800',
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    cardSubtitle: {
      color: colors.textSub,
      fontSize: 12,
      fontWeight: '600',
      marginTop: 2,
    },
    badgeActive: {
      backgroundColor: colors.emeraldDim,
      borderColor: 'rgba(16, 185, 129, 0.3)',
      borderWidth: 1,
    },
    badgeWarning: {
      backgroundColor: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      borderWidth: 1,
    },
    badgeInactive: {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderColor: colors.border,
      borderWidth: 1,
    },
    dotActive: {
      backgroundColor: colors.emerald,
    },
    dotWarning: {
      backgroundColor: '#F59E0B',
    },
    dotInactive: {
      backgroundColor: colors.textDimmed,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    textActive: {
      color: colors.emerald,
    },
    textWarning: {
      color: '#F59E0B',
    },
    textInactive: {
      color: colors.textMuted,
    },
    cardOutcome: {
      color: colors.textSub,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 16,
    },
    capabilitiesBox: {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      padding: 16,
      borderRadius: RADIUS.md,
      gap: 10,
      marginBottom: 20,
    },
    capabilitiesTitle: {
      color: colors.textDimmed,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 2,
    },
    capabilityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    capabilityText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '500',
      flex: 1,
    },
  });
