import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import GridMotion from '@/components/animations/GridMotion';
import PressButton from '@/components/ui/PressButton';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { RADIUS, SHADOW, useThemeColors } from '@/styles/tokens';

type RoleType = 'athlete' | 'coach' | 'organization';

const ROLE_META = {
  athlete: {
    title: 'Athlete Workspace',
    route: '/athlete-dashboard' as Href,
    color: '#10B981',
    icon: 'fitness' as const,
    features: [
      'Interactive Workout Logger & Timer',
      'Personal Best (PR) Automated Tracking',
      'Direct Coach Training Plan Sync',
      'Performance Trend Sparklines',
    ],
  },
  coach: {
    title: 'Coach Platform',
    route: '/coach-dashboard' as Href,
    color: '#3B82F6',
    icon: 'clipboard' as const,
    features: [
      'Full Squad Roster & Group Management',
      'Multi-Week Training Builder',
      'Real-Time Athlete Completion Analytics',
      'Custom Sport KPI Definitions',
    ],
  },
  organization: {
    title: 'Organization Hub',
    route: '/dashboard' as Href,
    color: '#8B5CF6',
    icon: 'business' as const,
    features: [
      'Multi-Team Data Partitioning',
      'Custom Staff Permissions & Audit Trail',
      'Club Branding & Portal Customization',
      'Central Billing & Seat Management',
    ],
  },
};

export default function PlanConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const roleKey = (params.role || 'athlete').toLowerCase() as RoleType;
  const meta = ROLE_META[roleKey] || ROLE_META.athlete;

  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleCompleteActivation = () => {
    setIsLaunching(true);
    // Route directly to the corresponding workspace dashboard
    router.replace(meta.route);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <GridMotion opacity={0.025} animDuration={28} zIndex={1} />

      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandName}>AthliTech</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Plan Confirmation</Text>
          </View>
        </View>

        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          
          {/* Activation Success Header */}
          <View style={styles.successHeader}>
            <View style={[styles.iconRing, { backgroundColor: `${meta.color}1F` }]}>
              <Ionicons name="checkmark-circle" size={48} color={meta.color} />
            </View>

            <Text style={styles.title}>Workspace Activated!</Text>
            <Text style={styles.subtitle}>
              Your <Text style={{ color: meta.color, fontWeight: '800' }}>{meta.title}</Text> has been created successfully. Confirm your plan to enter your workspace.
            </Text>
          </View>

          {/* Selected Plan Summary Card */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View>
                <View style={styles.selectedTag}>
                  <Text style={styles.selectedTagText}>PRE-SELECTED PLAN</Text>
                </View>
                <Text style={styles.planName}>Starter Workspace</Text>
              </View>

              <View style={styles.priceCol}>
                <Text style={styles.priceVal}>$0</Text>
                <Text style={styles.pricePeriod}>/ Forever Free</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.featuresHeading}>INCLUDED CAPABILITIES</Text>
            <View style={styles.featuresGrid}>
              {meta.features.map((feat, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={meta.color} />
                  <Text style={styles.featureText}>{feat}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* CTA Buttons */}
          <View style={styles.actionsBox}>
            <PressButton
              label={isLaunching ? 'Launching Workspace...' : 'Complete Activation & Launch Workspace'}
              onPress={handleCompleteActivation}
              loading={isLaunching}
              style={{ width: '100%', backgroundColor: meta.color }}
            />

            <TouchableOpacity
              style={styles.roleHubLink}
              onPress={() => router.replace('/role-hub' as Href)}
            >
              <Text style={styles.roleHubLinkText}>Return to Role Hub</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bgGlass,
      zIndex: 10,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    brandDot: {
      width: 10,
      height: 10,
      borderRadius: 99,
      backgroundColor: colors.emerald,
    },
    brandName: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    badge: {
      backgroundColor: colors.emeraldDim,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.full,
    },
    badgeText: {
      color: colors.emerald,
      fontSize: 12,
      fontWeight: '700',
    },

    container: {
      padding: 24,
      paddingBottom: 60,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85%' as any,
    },
    contentCard: {
      width: '100%',
      maxWidth: 640,
      backgroundColor: colors.bgGlass,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      padding: 32,
      gap: 24,
      ...SHADOW.card,
    },

    successHeader: {
      alignItems: 'center',
      textAlign: 'center',
      gap: 8,
    },
    iconRing: {
      width: 80,
      height: 80,
      borderRadius: 99,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
    },

    planCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: RADIUS.md,
      padding: 20,
      gap: 16,
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectedTag: {
      backgroundColor: colors.emeraldDim,
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: RADIUS.sm,
      marginBottom: 4,
    },
    selectedTagText: {
      color: colors.emerald,
      fontSize: 10,
      fontWeight: '800',
    },
    planName: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '800',
    },
    priceCol: {
      alignItems: 'flex-end',
    },
    priceVal: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '800',
    },
    pricePeriod: {
      color: colors.textMuted,
      fontSize: 12,
    },

    divider: {
      height: 1,
      backgroundColor: colors.border,
    },

    featuresHeading: {
      color: colors.textDimmed,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    featuresGrid: {
      gap: 10,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    featureText: {
      color: colors.textSub,
      fontSize: 14,
      fontWeight: '600',
    },

    actionsBox: {
      gap: 12,
      alignItems: 'center',
    },
    roleHubLink: {
      paddingVertical: 8,
    },
    roleHubLinkText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
  });
