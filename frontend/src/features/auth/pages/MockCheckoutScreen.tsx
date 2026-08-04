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
} from 'react-native';

import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { activateRole } from '@/api/roleHub';
import { useWorkspace } from '@/context/WorkspaceContext';
import GridMotion from '@/components/animations/GridMotion';
import PressButton from '@/components/ui/PressButton';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { RADIUS, SHADOW, useThemeColors } from '@/styles/tokens';


type RoleType = 'athlete' | 'coach' | 'organization';

const PLAN_LOOKUP: Record<string, Record<string, { name: string; priceStr: string; priceVal: number }>> = {
  athlete: {
    starter: { name: 'Starter Athlete (Free)', priceStr: '$0.00', priceVal: 0 },
    pro: { name: 'Athlete Pro', priceStr: '$9.99', priceVal: 9.99 },
    elite: { name: 'High Performance', priceStr: '$19.99', priceVal: 19.99 },
  },
  coach: {
    starter: { name: 'Coach Starter', priceStr: '$29.00', priceVal: 29 },
    pro: { name: 'Coach Pro', priceStr: '$79.00', priceVal: 79 },
    elite: { name: 'Elite Academy', priceStr: '$199.00', priceVal: 199 },
  },
  organization: {
    starter: { name: 'Club Tier', priceStr: '$299.00', priceVal: 299 },
    pro: { name: 'Franchise Tier', priceStr: '$599.00', priceVal: 599 },
    elite: { name: 'Enterprise SLA', priceStr: '$999.00', priceVal: 999 },
  },
};

const ROLE_DASHBOARDS: Record<RoleType, Href> = {
  athlete: '/athlete-dashboard' as Href,
  coach: '/coach-dashboard' as Href,
  organization: '/dashboard' as Href,
};

const ROLE_META = {
  athlete: { title: 'Athlete Workspace', accentColor: '#10B981', icon: 'fitness' as const },
  coach: { title: 'Coach Platform', accentColor: '#3B82F6', icon: 'clipboard' as const },
  organization: { title: 'Organization Hub', accentColor: '#8B5CF6', icon: 'business' as const },
};

export default function MockCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string; plan?: string }>();
  const roleKey = (params.role || 'athlete').toLowerCase() as RoleType;
  const planKey = (params.plan || 'pro').toLowerCase();

  const roleMeta = ROLE_META[roleKey] || ROLE_META.athlete;
  const planInfo = PLAN_LOOKUP[roleKey]?.[planKey] || { name: 'Selected Plan', priceStr: '$0.00', priceVal: 0 };

  const colors = useThemeColors();
  const styles = getStyles(colors);

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'free'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [error, setError] = useState('');

  const subtotal = planInfo.priceVal;
  const tax = 0;
  const total = subtotal + tax;

  const { refreshWorkspaceStatus, setCurrentWorkspace } = useWorkspace();

  const handlePaymentAndActivation = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // 1. Show simulated payment success animation
      setShowSuccessOverlay(true);

      // 2. Call backend role activation endpoint
      await activateRole(roleKey);
      await refreshWorkspaceStatus();

      // 3. Short animation delay (~1s) before redirecting via setCurrentWorkspace
      setTimeout(() => {
        setCurrentWorkspace(roleKey);
      }, 1200);
    } catch (err) {
      setShowSuccessOverlay(false);
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'Activation failed during payment processing.');
    }
  };



  return (
    <SafeAreaView style={styles.screen}>
      <GridMotion opacity={0.025} animDuration={28} zIndex={1} />

      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push({ pathname: '/plan-selection', params: { role: roleKey } } as Href)}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={styles.backBtnText}>Back to Plan Selection</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <ThemeToggle />
        </View>
      </View>

      {/* Full-Screen Payment Success Overlay */}
      {showSuccessOverlay && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.successOverlay}>
          <Animated.View entering={ZoomIn.duration(400)} style={styles.successBox}>
            <View style={[styles.successRing, { backgroundColor: `${roleMeta.accentColor}1F` }]}>
              <Ionicons name="checkmark-circle" size={64} color={roleMeta.accentColor} />
            </View>
            <Text style={styles.successTitle}>Payment Verified & Successful! 🎉</Text>
            <Text style={styles.successSub}>
              Activating your <Text style={{ color: roleMeta.accentColor, fontWeight: '800' }}>{roleMeta.title}</Text> and launching workspace...
            </Text>
          </Animated.View>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrap}>

          {/* Heading */}
          <View style={styles.heroBox}>
            <View style={[styles.iconWrap, { backgroundColor: `${roleMeta.accentColor}1F` }]}>
              <Ionicons name={roleMeta.icon} size={28} color={roleMeta.accentColor} />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.headingTitle}>Checkout & Workspace Activation</Text>
              <Text style={styles.headingSub}>
                Review your order details. Mock checkout simulates subscription confirmation for development.
              </Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Order Summary & Payment Split */}
          <View style={styles.checkoutGrid}>
            
            {/* Left Col: Order Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.cardSectionTitle}>ORDER SUMMARY</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Workspace</Text>
                <Text style={styles.summaryVal}>{roleMeta.title}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Selected Plan</Text>
                <Text style={[styles.summaryVal, { fontWeight: '800' }]}>{planInfo.name}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Monthly Subtotal</Text>
                <Text style={styles.summaryVal}>{planInfo.priceStr}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax / VAT (0% Preview)</Text>
                <Text style={styles.summaryVal}>$0.00</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Due Today</Text>
                <Text style={[styles.totalVal, { color: roleMeta.accentColor }]}>
                  ${total.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Right Col: Payment Method Selector (Razorpay/Stripe Simulator) */}
            <View style={styles.paymentCard}>
              <View style={styles.paymentCardHeader}>
                <Text style={styles.cardSectionTitle}>PAYMENT METHOD SIMULATOR</Text>
                <View style={styles.sandboxBadge}>
                  <Text style={styles.sandboxBadgeText}>DEVELOPMENT SANDBOX</Text>
                </View>
              </View>

              <Text style={styles.paymentSubText}>
                Simulating future Razorpay / Stripe payment gateway integration. Select a test payment method:
              </Text>

              <View style={styles.methodsList}>
                {/* Method 1: Credit Card */}
                <TouchableOpacity
                  style={[
                    styles.methodOption,
                    paymentMethod === 'card' && { borderColor: roleMeta.accentColor, backgroundColor: `${roleMeta.accentColor}0A` },
                  ]}
                  onPress={() => setPaymentMethod('card')}
                >
                  <Ionicons name="card-outline" size={20} color={paymentMethod === 'card' ? roleMeta.accentColor : colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodTitle}>Credit / Debit Card</Text>
                    <Text style={styles.methodDesc}>Simulated Visa •••• 4242</Text>
                  </View>
                  <View style={[styles.radioCircle, paymentMethod === 'card' && { borderColor: roleMeta.accentColor, backgroundColor: roleMeta.accentColor }]}>
                    {paymentMethod === 'card' && <Ionicons name="checkmark" size={12} color="#FFF" />}
                  </View>
                </TouchableOpacity>

                {/* Method 2: UPI */}
                <TouchableOpacity
                  style={[
                    styles.methodOption,
                    paymentMethod === 'upi' && { borderColor: roleMeta.accentColor, backgroundColor: `${roleMeta.accentColor}0A` },
                  ]}
                  onPress={() => setPaymentMethod('upi')}
                >
                  <Ionicons name="qr-code-outline" size={20} color={paymentMethod === 'upi' ? roleMeta.accentColor : colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodTitle}>UPI / Instant NetBanking</Text>
                    <Text style={styles.methodDesc}>Simulated GPay / PhonePe / BHIM</Text>
                  </View>
                  <View style={[styles.radioCircle, paymentMethod === 'upi' && { borderColor: roleMeta.accentColor, backgroundColor: roleMeta.accentColor }]}>
                    {paymentMethod === 'upi' && <Ionicons name="checkmark" size={12} color="#FFF" />}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <PressButton
                  label={isProcessing ? 'Processing Payment...' : `Pay Now & Activate (${planInfo.priceStr})`}
                  onPress={handlePaymentAndActivation}
                  loading={isProcessing}
                  style={{ flex: 1, backgroundColor: roleMeta.accentColor }}
                />

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => router.push({ pathname: '/plan-selection', params: { role: roleKey } } as Href)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>

            </View>

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

    checkoutGrid: {
      gap: 20,
      flexDirection: Platform.OS === 'web' ? 'row' : 'column',
      alignItems: 'flex-start',
    },

    summaryCard: {
      flex: 1,
      width: '100%',
      backgroundColor: colors.bgGlass,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      padding: 24,
      gap: 14,
      ...SHADOW.card,
    },
    cardSectionTitle: {
      color: colors.textDimmed,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    summaryLabel: {
      color: colors.textSub,
      fontSize: 14,
    },
    summaryVal: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    totalLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
    },
    totalVal: {
      fontSize: 24,
      fontWeight: '800',
    },

    paymentCard: {
      flex: 1.3,
      width: '100%',
      backgroundColor: colors.bgGlass,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      padding: 24,
      gap: 16,
      ...SHADOW.card,
    },
    paymentCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sandboxBadge: {
      backgroundColor: colors.emeraldDim,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: RADIUS.sm,
    },
    sandboxBadgeText: {
      color: colors.emerald,
      fontSize: 10,
      fontWeight: '800',
    },
    paymentSubText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },

    methodsList: {
      gap: 12,
      marginVertical: 8,
    },
    methodOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      padding: 14,
    },
    methodTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    methodDesc: {
      color: colors.textMuted,
      fontSize: 12,
    },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 99,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },

    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 8,
    },
    cancelBtn: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelBtnText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },

    successOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 9999,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    successBox: {
      backgroundColor: colors.bgGlass,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.xl,
      padding: 36,
      alignItems: 'center',
      textAlign: 'center',
      gap: 12,
      maxWidth: 480,
      width: '100%',
      ...SHADOW.card,
    },
    successRing: {
      width: 96,
      height: 96,
      borderRadius: 99,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    successTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    successSub: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
    },
  });
