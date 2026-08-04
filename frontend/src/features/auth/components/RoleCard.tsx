import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

export type RoleCardType = 'athlete' | 'coach' | 'organization';

interface RoleCardProps {
  type: RoleCardType;
  isActive: boolean;
  isLoading?: boolean;
  onOpenDashboard: () => void;
  onExploreRole: () => void;
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
  isLoading = false,
  onOpenDashboard,
  onExploreRole,
}: RoleCardProps) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const data = CARD_DATA[type];

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

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

  return (
    <Animated.View
      style={[styles.card, isActive && styles.cardActiveBorder, animatedCardStyle]}
      // @ts-ignore
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: `${data.accentColor}1A` }]}>
          <Ionicons name={data.icon} size={24} color={data.accentColor} />
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            isActive ? styles.badgeActive : styles.badgeInactive,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isActive ? styles.dotActive : styles.dotInactive,
            ]}
          />
          <Text
            style={[
              styles.statusBadgeText,
              isActive ? styles.textActive : styles.textInactive,
            ]}
          >
            {isActive ? 'Active' : 'Not Activated'}
          </Text>
        </View>
      </View>

      {/* Role Title & Outcome Copy */}
      <Text style={styles.cardTitle}>{data.title}</Text>
      <Text style={styles.cardOutcome}>{data.outcome}</Text>

      {/* Capability Highlights */}
      <View style={styles.capabilitiesBox}>
        <Text style={styles.capabilitiesTitle}>KEY CAPABILITIES</Text>
        {data.capabilities.map((cap, idx) => (
          <View key={idx} style={styles.capabilityRow}>
            <Ionicons name="checkmark-circle" size={15} color={data.accentColor} />
            <Text style={styles.capabilityText}>{cap}</Text>
          </View>
        ))}
      </View>

      {/* Visual Miniature Dashboard Preview */}
      <View style={styles.previewWrap}>{renderPreview()}</View>

      {/* Action Footer */}
      <View style={styles.cardFooter}>
        {isActive ? (
          <PressButton
            label="Open Dashboard"
            onPress={onOpenDashboard}
            style={{ width: '100%', backgroundColor: data.accentColor }}
          />
        ) : (
          <TouchableOpacity
            style={[styles.actionBtnOutline, { borderColor: colors.border }]}
            onPress={onExploreRole}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnOutlineText, { color: colors.textPrimary }]}>Explore Role</Text>
            <Ionicons name="arrow-forward" size={16} color={data.accentColor} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const getStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.bgGlass,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      padding: 24,
      justifyContent: 'space-between',
      ...SHADOW.card,
    },
    cardActiveBorder: {
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },

    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: RADIUS.full,
    },
    badgeActive: {
      backgroundColor: colors.emeraldDim,
      borderColor: 'rgba(16, 185, 129, 0.2)',
      borderWidth: 1,
    },
    badgeInactive: {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderColor: colors.border,
      borderWidth: 1,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 99,
    },
    dotActive: {
      backgroundColor: colors.emerald,
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
    textInactive: {
      color: colors.textMuted,
    },

    cardTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 8,
    },
    cardOutcome: {
      color: colors.textSub,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 18,
    },

    capabilitiesBox: {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderColor: colors.border,
      borderWidth: 1,
      padding: 14,
      borderRadius: RADIUS.md,
      gap: 8,
      marginBottom: 18,
    },
    capabilitiesTitle: {
      color: colors.textDimmed,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    capabilityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    capabilityText: {
      color: colors.textSub,
      fontSize: 13,
      flex: 1,
    },

    previewWrap: {
      marginBottom: 20,
    },

    cardFooter: {
      marginTop: 'auto',
    },
    actionBtnOutline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1.5,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: RADIUS.md,
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    actionBtnOutlineText: {
      fontSize: 14,
      fontWeight: '700',
    },
  });
