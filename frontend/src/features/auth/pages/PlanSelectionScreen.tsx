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

import GridMotion from '@/components/animations/GridMotion';
import PressButton from '@/components/ui/PressButton';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { RADIUS, SHADOW, useThemeColors } from '@/styles/tokens';

type RoleType = 'athlete' | 'coach' | 'organization';

const PLAN_DATA = {
  athlete: {
    roleTitle: 'Athlete Workspace',
    accentColor: '#10B981',
    icon: 'fitness' as const,
    plans: [
      {
        id: 'starter',
        name: 'Starter Athlete',
        price: '$0',
        period: '/month',
        priceVal: 0,
        badge: 'FOREVER FREE',
        recommended: false,
        features: [
          'Core workout & set logger',
          'Recent 30-day session history',
          'Direct coach training sync',
          'Standard performance graphs',
        ],
      },
      {
        id: 'pro',
        name: 'Athlete Pro',
        price: '$9.99',
        period: '/month',
        priceVal: 9.99,
        badge: 'MOST POPULAR',
        recommended: true,
        features: [
          'Everything in Starter',
          'Unlimited PR & metric history',
          'AI recovery & readiness score',
          'Export CSV performance data',
          'Video movement analysis',
        ],
      },
      {
        id: 'elite',
        name: 'High Performance',
        price: '$19.99',
        period: '/month',
        priceVal: 19.99,
        badge: 'ULTIMATE',
        recommended: false,
        features: [
          'Everything in Athlete Pro',
          'Advanced biomechanics breakdown',
          '1-on-1 priority coach channel',
          'Custom sport KPI tracking',
          'Early access to new features',
        ],
      },
    ],
  },
  coach: {
    roleTitle: 'Coach Platform',
    accentColor: '#3B82F6',
    icon: 'clipboard' as const,
    plans: [
      {
        id: 'starter',
        name: 'Coach Starter',
        price: '$29',
        period: '/month',
        priceVal: 29,
        badge: 'UP TO 15 ATHLETES',
        recommended: false,
        features: [
          'Up to 15 roster athletes',
          'Core workout builder',
          'Standard team completion logs',
          'Basic exercise library',
        ],
      },
      {
        id: 'pro',
        name: 'Coach Pro',
        price: '$79',
        period: '/month',
        priceVal: 79,
        badge: 'MOST POPULAR',
        recommended: true,
        features: [
          'Up to 50 roster athletes',
          'Multi-week periodized builder',
          'Advanced squad readiness analytics',
          'Custom sport KPI definitions',
          'Assistant coach permissions',
        ],
      },
      {
        id: 'elite',
        name: 'Elite Academy',
        price: '$199',
        period: '/month',
        priceVal: 199,
        badge: 'UNLIMITED',
        recommended: false,
        features: [
          'Unlimited roster athletes',
          'Multi-team & multi-assistant RBAC',
          'Export API & webhook access',
          'White-label athlete portal',
          'Dedicated support manager',
        ],
      },
    ],
  },
  organization: {
    roleTitle: 'Organization Hub',
    accentColor: '#8B5CF6',
    icon: 'business' as const,
    plans: [
      {
        id: 'starter',
        name: 'Club Tier',
        price: '$299',
        period: '/month',
        priceVal: 299,
        badge: '5 TEAMS INCLUDED',
        recommended: false,
        features: [
          'Up to 5 active teams',
          '250 total club members',
          'Standard Admin RBAC permissions',
          'Central billing control',
        ],
      },
      {
        id: 'pro',
        name: 'Franchise Tier',
        price: '$599',
        period: '/month',
        priceVal: 599,
        badge: 'MOST POPULAR',
        recommended: true,
        features: [
          'Up to 15 active teams',
          '1,000 total club members',
          'Branded mobile & web portal',
          'Custom staff audit logging',
          'Priority phone & email SLA',
        ],
      },
      {
        id: 'elite',
        name: 'Enterprise',
        price: '$999',
        period: '/month',
        priceVal: 999,
        badge: 'ENTERPRISE SLA',
        recommended: false,
        features: [
          'Unlimited teams & members',
          'Dedicated SAML / SSO integration',
          'Custom data pipeline export',
          'On-premise / isolated cluster',
          '24/7 dedicated account manager',
        ],
      },
    ],
  },
};

export default function PlanSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const roleKey = (params.role || 'athlete').toLowerCase() as RoleType;
  const roleMeta = PLAN_DATA[roleKey] || PLAN_DATA.athlete;

  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro');

  const selectedPlan = roleMeta.plans.find((p) => p.id === selectedPlanId) || roleMeta.plans[1];

  const handleContinueToCheckout = () => {
    router.push({
      pathname: '/mock-checkout',
      params: { role: roleKey, plan: selectedPlan.id },
    } as Href);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <GridMotion opacity={0.025} animDuration={28} zIndex={1} />

      {/* Top Navigation */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push({ pathname: '/explore-role', params: { role: roleKey } } as Href)}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={styles.backBtnText}>Back to Explore</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <ThemeToggle />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrap}>

          {/* Hero Heading */}
          <View style={styles.heroBox}>
            <View style={[styles.iconWrap, { backgroundColor: `${roleMeta.accentColor}1F` }]}>
              <Ionicons name={roleMeta.icon} size={28} color={roleMeta.accentColor} />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.headingTitle}>Select Your {roleMeta.roleTitle} Plan</Text>
              <Text style={styles.headingSub}>
                Choose the subscription tier that best fits your athletic goals. You can upgrade or modify anytime.
              </Text>
            </View>
          </View>

          {/* Plan Cards Grid */}
          <View style={[styles.plansGrid, isDesktop ? styles.plansGridDesktop : styles.plansGridMobile]}>
            {roleMeta.plans.map((plan) => {
              const isSelected = plan.id === selectedPlanId;

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    isSelected && {
                      borderColor: roleMeta.accentColor,
                      backgroundColor: `${roleMeta.accentColor}0A`,
                      ...SHADOW.card,
                    },
                  ]}

                  onPress={() => setSelectedPlanId(plan.id)}
                  activeOpacity={0.85}
                >
                  {/* Recommended Badge */}
                  {plan.recommended && (
                    <View style={[styles.badgeTag, { backgroundColor: roleMeta.accentColor }]}>
                      <Text style={styles.badgeTagText}>{plan.badge}</Text>
                    </View>
                  )}

                  {/* Header Row */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected ? { borderColor: roleMeta.accentColor, backgroundColor: roleMeta.accentColor } : { borderColor: colors.border },
                      ]}
                    >
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                  </View>

                  {/* Pricing */}
                  <View style={styles.priceRow}>
                    <Text style={styles.priceVal}>{plan.price}</Text>
                    <Text style={styles.pricePeriod}>{plan.period}</Text>
                  </View>

                  <View style={styles.divider} />

                  {/* Feature Checklist */}
                  <View style={styles.featureList}>
                    {plan.features.map((feat, fIdx) => (
                      <View key={fIdx} style={styles.featureRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={isSelected ? roleMeta.accentColor : colors.emerald}
                        />
                        <Text style={styles.featureText}>{feat}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pricing Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View>
                <Text style={styles.summarySubTitle}>SELECTED PLAN SUMMARY</Text>
                <Text style={styles.summaryPlanName}>{selectedPlan.name}</Text>
              </View>

              <View style={styles.summaryPriceCol}>
                <Text style={[styles.summaryPriceVal, { color: roleMeta.accentColor }]}>
                  {selectedPlan.price}
                </Text>
                <Text style={styles.summaryPricePeriod}>{selectedPlan.period}</Text>
              </View>
            </View>

            <PressButton
              label={`Continue to Checkout (${selectedPlan.price})`}
              onPress={handleContinueToCheckout}
              style={{ width: '100%', backgroundColor: roleMeta.accentColor, marginTop: 8 }}
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
      maxWidth: 1050,
      gap: 28,
    },

    heroBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: colors.bgGlass,
      padding: 24,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...SHADOW.card,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTextCol: {
      flex: 1,
    },
    headingTitle: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    headingSub: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },

    plansGrid: {
      gap: 20,
    },
    plansGridDesktop: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    plansGridMobile: {
      flexDirection: 'column',
    },

    planCard: {
      flex: 1,
      backgroundColor: colors.bgGlass,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      padding: 22,
      position: 'relative',
      justifyContent: 'space-between',
      ...SHADOW.card,
    },
    badgeTag: {
      position: 'absolute',
      top: -12,
      right: 18,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: RADIUS.full,
    },
    badgeTagText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    planName: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '800',
    },
    radioCircle: {
      width: 22,
      height: 22,
      borderRadius: 99,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      marginBottom: 16,
    },
    priceVal: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '800',
    },
    pricePeriod: {
      color: colors.textMuted,
      fontSize: 13,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 16,
    },
    featureList: {
      gap: 10,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    featureText: {
      color: colors.textSub,
      fontSize: 13,
      flex: 1,
    },

    summaryCard: {
      backgroundColor: colors.bgGlass,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      padding: 24,
      gap: 16,
      ...SHADOW.card,
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    summarySubTitle: {
      color: colors.textDimmed,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    summaryPlanName: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
    },
    summaryPriceCol: {
      alignItems: 'flex-end',
    },
    summaryPriceVal: {
      fontSize: 28,
      fontWeight: '800',
    },
    summaryPricePeriod: {
      color: colors.textMuted,
      fontSize: 12,
    },
  });
