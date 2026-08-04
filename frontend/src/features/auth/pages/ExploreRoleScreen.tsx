import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { activateRole } from '@/api/roleHub';
import GridMotion from '@/components/animations/GridMotion';
import PressButton from '@/components/ui/PressButton';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Toast from '@/components/ui/Toast';
import { RADIUS, SHADOW, useThemeColors } from '@/styles/tokens';
import {
  MiniAthletePreview,
  MiniCoachPreview,
  MiniOrgPreview,
} from '../components/MiniDashboardPreviews';

type RoleType = 'athlete' | 'coach' | 'organization';

const ROLE_INFO = {
  athlete: {
    title: 'Athlete Workspace',
    subtitle: 'Never lose another training session. Track personal records and monitor recovery in real time.',
    badgeColor: '#10B981',
    icon: 'fitness' as const,
    whoIsItFor: 'Sprinters, endurance athletes, weightlifters, and competitive team sports players seeking structured, outcome-driven training.',
    problemsSolves: 'Eliminates lost paper logs, provides instant feedback on personal record improvements, and bridges seamless athlete-coach communication.',
    keyFeatures: [
      { title: 'Never Lose Another Log', desc: 'Real-time set, rep, & intensity logging with timer integration.' },
      { title: 'Track Personal Records', desc: 'Automated PR calculation across sprint times, loads, and power output.' },
      { title: 'Seamless Coach Alignment', desc: 'Direct workout pushing from your coach with target benchmarks.' },
      { title: 'Train Anywhere, Anytime', desc: 'Log sessions offline and sync automatically once reconnected.' },
    ],
    pricingTiers: [
      { name: 'Starter Athlete', price: 'Free', period: 'Forever Preview', features: ['Core workout logging', 'Recent session history', 'Direct coach sync'], current: true },
      { name: 'Athlete Pro', price: '$9.99', period: '/month (Mock)', features: ['Unlimited PR analytics', 'Video form upload', 'Export CSV performance data'] },
      { name: 'High Performance', price: '$19.99', period: '/month (Mock)', features: ['AI recovery insights', 'Biomechanics breakdown', 'Priority coach support'] },
    ],
  },
  coach: {
    title: 'Coach Platform',
    subtitle: 'Eliminate spreadsheet chaos. Keep your entire squad accountable with instant workout distribution.',
    badgeColor: '#3B82F6',
    icon: 'clipboard' as const,
    whoIsItFor: 'Head coaches, strength & conditioning specialists, private trainers, and sports academy staff managing high-performance rosters.',
    problemsSolves: 'Stops spreadsheet fragmentation, accelerates bulk workout assignment across squad rosters, and provides real-time readiness metrics.',
    keyFeatures: [
      { title: 'Keep Your Roster Accountable', desc: 'Organize and track athletes by sport, group, or performance tier.' },
      { title: 'Build Periodized Cycles', desc: 'Construct multi-week training programs with built-in exercise libraries.' },
      { title: 'Define Custom Sport KPIs', desc: 'Define specialized performance metrics unique to your program.' },
      { title: 'Monitor Squad Completion', desc: 'Instant status feedback on completed, pending, or skipped workouts.' },
    ],
    pricingTiers: [
      { name: 'Coach Starter', price: '$29', period: '/month (Mock)', features: ['Up to 15 Athletes', 'Core Workout Builder', 'Standard Metrics'] },
      { name: 'Coach Pro', price: '$79', period: '/month (Mock)', features: ['Up to 50 Athletes', 'Advanced Analytics', 'Custom KPI Definitions'], current: true },
      { name: 'Elite Academy', price: '$199', period: '/month (Mock)', features: ['Unlimited Athletes', 'Multi-Assistant Coaches', 'Export API Access'] },
    ],
  },
  organization: {
    title: 'Organization Hub',
    subtitle: 'Unify your entire athletic club. Manage multi-team rosters, staff permissions, and central billing.',
    badgeColor: '#8B5CF6',
    icon: 'business' as const,
    whoIsItFor: 'Club directors, university athletic departments, sports federations, and multi-sport training facilities.',
    problemsSolves: 'Centralizes club administration, enforces data security boundaries across departments, and unifies team subscriptions.',
    keyFeatures: [
      { title: 'Partition Multi-Team Programs', desc: 'Isolate data across different sports programs, campuses, & age divisions.' },
      { title: 'Granular Staff Permissions', desc: 'Role-based access control for Head Coaches, Physios, & Admin staff.' },
      { title: 'Custom Club Branding', desc: 'Personalized organization branding across mobile & web portals.' },
      { title: 'Centralized Seat Control', desc: 'Manage global quota seats and billing tiers across all teams.' },
    ],
    pricingTiers: [
      { name: 'Club Tier', price: '$299', period: '/month (Mock)', features: ['5 Teams Included', '250 Active Athletes', 'Standard Admin RBAC'] },
      { name: 'Franchise Tier', price: '$599', period: '/month (Mock)', features: ['15 Teams Included', '1,000 Active Athletes', 'Branded Mobile Portal'], current: true },
      { name: 'Enterprise', price: 'Custom', period: 'Contact Sales', features: ['Unlimited Teams', 'Dedicated SSO / SAML', 'SLA Support & Onboarding'] },
    ],
  },
};

export default function ExploreRoleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const roleParam = (params.role || 'athlete').toLowerCase() as RoleType;
  const roleInfo = ROLE_INFO[roleParam] || ROLE_INFO.athlete;

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const handleProceedToPlanSelection = () => {
    router.push({ pathname: '/plan-selection', params: { role: roleParam } } as Href);
  };

  const renderDashboardPreview = () => {
    if (roleParam === 'athlete') return <MiniAthletePreview />;
    if (roleParam === 'coach') return <MiniCoachPreview />;
    return <MiniOrgPreview />;
  };


  return (
    <SafeAreaView style={styles.screen}>
      <GridMotion opacity={0.025} animDuration={28} zIndex={1} />
      <Toast
        visible={toastVisible}
        message={`${roleInfo.title} Activated Successfully! 🎉`}
        type="success"
        onDismiss={() => setToastVisible(false)}
      />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/role-hub' as Href)}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={styles.backBtnText}>Back to Role Hub</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <ThemeToggle />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrap}>
          
          {/* Hero Banner */}
          <View style={styles.heroBox}>
            <View style={[styles.iconWrap, { backgroundColor: `${roleInfo.badgeColor}1F` }]}>
              <Ionicons name={roleInfo.icon} size={32} color={roleInfo.badgeColor} />
            </View>

            <View style={styles.heroTextCol}>
              <Text style={styles.roleTitle}>{roleInfo.title}</Text>
              <Text style={styles.roleSubtitle}>{roleInfo.subtitle}</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Grid Layout: Information Sections */}
          <View style={[styles.infoGrid, isWide ? styles.infoGridWide : styles.infoGridNarrow]}>
            
            {/* Who It's For */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="people" size={20} color={roleInfo.badgeColor} />
                <Text style={styles.infoCardTitle}>Who This Role Is For</Text>
              </View>
              <Text style={styles.infoCardBody}>{roleInfo.whoIsItFor}</Text>
            </View>

            {/* Problems Solved */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="shield-checkmark" size={20} color={roleInfo.badgeColor} />
                <Text style={styles.infoCardTitle}>Problems It Solves</Text>
              </View>
              <Text style={styles.infoCardBody}>{roleInfo.problemsSolves}</Text>
            </View>
          </View>

          {/* Key Features List */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Core Capabilities & Outcomes</Text>
            <View style={styles.featuresGrid}>
              {roleInfo.keyFeatures.map((feat, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={roleInfo.badgeColor} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>{feat.title}</Text>
                    <Text style={styles.featureDesc}>{feat.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Realistic Dashboard Preview Component */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Live Dashboard Interface Preview</Text>
            {renderDashboardPreview()}
          </View>

          {/* Future Pricing Section */}
          <View style={styles.sectionCard}>
            <View style={styles.pricingTitleRow}>
              <Text style={styles.sectionHeading}>Future Pricing Tiers</Text>
              <View style={styles.futureBadge}>
                <Text style={styles.futureBadgeText}>Simulation Only</Text>
              </View>
            </View>
            <Text style={styles.pricingSub}>
              Role activation is 100% free during the unified platform preview phase. No credit card required.
            </Text>

            <View style={[styles.pricingGrid, isWide ? styles.pricingGridWide : styles.pricingGridNarrow]}>
              {roleInfo.pricingTiers.map((tier, idx) => (
                <View key={idx} style={[styles.priceCard, tier.current && styles.priceCardFeatured]}>
                  {tier.current && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>POPULAR</Text>
                    </View>
                  )}
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceVal}>{tier.price}</Text>
                    <Text style={styles.pricePeriod}>{tier.period}</Text>
                  </View>

                  <View style={styles.tierFeatures}>
                    {tier.features.map((f, fIdx) => (
                      <View key={fIdx} style={styles.tierFeatureRow}>
                        <Ionicons name="checkmark" size={16} color={colors.emerald} />
                        <Text style={styles.tierFeatureText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Activation CTA Footer */}
          <View style={styles.ctaBox}>
            <View style={styles.ctaTextCol}>
              <Text style={styles.ctaHeading}>Ready to activate {roleInfo.title}?</Text>
              <Text style={styles.ctaSub}>Instant activation creates your RoleProfile & Membership in MongoDB.</Text>
            </View>

            <PressButton
              label={`Choose Plan & Activate ${roleInfo.title}`}
              onPress={handleProceedToPlanSelection}
              style={{ minWidth: 240, backgroundColor: roleInfo.badgeColor }}
            />

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
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backBtnText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    container: {
      padding: 24,
      paddingBottom: 60,
      alignItems: 'center',
    },
    contentWrap: {
      width: '100%',
      maxWidth: 1000,
      gap: 28,
    },

    heroBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      backgroundColor: colors.bgGlass,
      padding: 24,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...SHADOW.card,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTextCol: {
      flex: 1,
    },
    roleTitle: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    roleSubtitle: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },

    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.errorDim,
      padding: 16,
      borderRadius: RADIUS.md,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      flex: 1,
    },

    infoGrid: {
      gap: 20,
    },
    infoGridWide: {
      flexDirection: 'row',
    },
    infoGridNarrow: {
      flexDirection: 'column',
    },
    infoCard: {
      flex: 1,
      backgroundColor: colors.bgGlass,
      padding: 20,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    infoCardTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
    },
    infoCardBody: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },

    sectionCard: {
      backgroundColor: colors.bgGlass,
      padding: 24,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionHeading: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 16,
    },

    featuresGrid: {
      gap: 16,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    featureTitle: {
      color: colors.textSub,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 2,
    },
    featureDesc: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },

    pricingTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    futureBadge: {
      backgroundColor: colors.emeraldDim,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: RADIUS.sm,
    },
    futureBadgeText: {
      color: colors.emerald,
      fontSize: 11,
      fontWeight: '700',
    },
    pricingSub: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 20,
    },
    pricingGrid: {
      gap: 16,
    },
    pricingGridWide: {
      flexDirection: 'row',
    },
    pricingGridNarrow: {
      flexDirection: 'column',
    },
    priceCard: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      padding: 18,
      position: 'relative',
    },
    priceCardFeatured: {
      borderColor: colors.emerald,
      backgroundColor: 'rgba(16,185,129,0.03)',
    },
    popularBadge: {
      position: 'absolute',
      top: -10,
      right: 14,
      backgroundColor: colors.emerald,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: RADIUS.sm,
    },
    popularText: {
      color: '#000',
      fontSize: 10,
      fontWeight: '800',
    },
    tierName: {
      color: colors.textSub,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 8,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      marginBottom: 16,
    },
    priceVal: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '800',
    },
    pricePeriod: {
      color: colors.textMuted,
      fontSize: 12,
    },
    tierFeatures: {
      gap: 8,
    },
    tierFeatureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    tierFeatureText: {
      color: colors.textSub,
      fontSize: 12,
    },

    ctaBox: {
      flexDirection: Platform.OS === 'web' ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.bgGlass,
      padding: 24,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 20,
      ...SHADOW.card,
    },
    ctaTextCol: {
      flex: 1,
    },
    ctaHeading: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 4,
    },
    ctaSub: {
      color: colors.textMuted,
      fontSize: 14,
    },
  });
