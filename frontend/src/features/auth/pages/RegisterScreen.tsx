/**
 * RegisterScreen
 *
 * Creates Athlete or Coach accounts only.
 * Admin registration is architecturally impossible here — the role
 * is chosen from exactly two cards (athlete | coach) and is passed
 * directly to the API. No admin option exists anywhere in this file.
 *
 * Design: matches LoginScreen — dark glassmorphism, GridMotion bg,
 * radial gradient, SplitText heading, GlassInput fields, PressButton.
 *
 * On success → navigates to /login (not dashboard).
 */

import { Href, Link, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { registerUser, login, storeToken } from '@/api/auth';
import GridMotion from '@/components/animations/GridMotion';
import SplitText from '@/components/animations/SplitText';
import GlassInput from '@/components/ui/GlassInput';
import PressButton from '@/components/ui/PressButton';
import { COLORS, RADIUS, SHADOW } from '@/styles/tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'athlete' | 'coach';

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const LOGIN_ROUTE = '/login' as Href;

// ─── Role card definitions ────────────────────────────────────────────────────
// Only athlete and coach are permitted — admin is intentionally absent.

const ROLES: Array<{
  id: Role;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}> = [
  {
    id: 'athlete',
    icon: 'fitness-outline',
    title: 'Athlete',
    description: 'Track workouts, record performance and achieve your goals.',
  },
  {
    id: 'coach',
    icon: 'people-outline',
    title: 'Coach',
    description: 'Manage athletes, assign workouts and monitor progress.',
  },
];

// ─── Password helpers ─────────────────────────────────────────────────────────

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 20) return 'Password must be at most 20 characters.';
  if (!/[A-Z]/.test(password)) return 'Must contain an uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Must contain a lowercase letter.';
  if (!/\d/.test(password)) return 'Must contain a number.';
  if (!/[!@#$%^&*()\-_=+\[\]{};':",.<>/?`~\\|]/.test(password))
    return 'Must contain a special character (e.g. !@#$%).';
  return null;
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '', color: 'transparent' };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()\-_=+\[\]{};':",.<>/?`~\\|]/.test(password)) score++;

  const map: Record<number, Omit<PasswordStrength, 'score'>> = {
    0: { label: 'Too short', color: '#ef4444' },
    1: { label: 'Weak', color: '#f97316' },
    2: { label: 'Fair', color: '#f59e0b' },
    3: { label: 'Good', color: '#84cc16' },
    4: { label: 'Strong', color: '#10b981' },
  };

  return { score: score as PasswordStrength['score'], ...map[score] };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Four-segment password strength bar */
function StrengthBar({ strength }: { strength: PasswordStrength }) {
  if (!strength.label) return null;

  return (
    <View style={barStyles.wrapper}>
      <View style={barStyles.segments}>
        {[1, 2, 3, 4].map((seg) => (
          <View
            key={seg}
            style={[
              barStyles.segment,
              {
                backgroundColor:
                  seg <= strength.score ? strength.color : 'rgba(255,255,255,0.08)',
              },
            ]}
          />
        ))}
      </View>
      <Text style={[barStyles.label, { color: strength.color }]}>
        {strength.label}
      </Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  segments: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 99,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 46,
    textAlign: 'right',
  },
});

/** Selectable role card with spring-scale press animation */
function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: (typeof ROLES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: selected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.07)', COLORS.emerald],
  });
  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.02)', 'rgba(16,185,129,0.08)'],
  });

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }

  return (
    <Animated.View style={[{ transform: [{ scale }], flex: 1 }]}>
      <Animated.View
        style={[
          roleStyles.card,
          selected && roleStyles.cardSelected,
          { borderColor, backgroundColor: bgColor },
        ]}
      >
        <Pressable
          onPress={onSelect}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={roleStyles.pressable}
        >
          {/* Selection indicator */}
          <View style={[roleStyles.radio, selected && roleStyles.radioSelected]}>
            {selected && <View style={roleStyles.radioDot} />}
          </View>

          {/* Icon */}
          <View
            style={[
              roleStyles.iconWrap,
              selected && roleStyles.iconWrapSelected,
            ]}
          >
            <Ionicons
              name={role.icon}
              size={26}
              color={selected ? COLORS.emerald : COLORS.textMuted}
            />
          </View>

          <Text style={[roleStyles.title, selected && roleStyles.titleSelected]}>
            {role.title}
          </Text>
          <Text style={roleStyles.desc}>{role.description}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const roleStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  cardSelected: {
    // shadow applied via borderColor animation above
    ...SHADOW.emerald,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  pressable: {
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: -4,
  },
  radioSelected: {
    borderColor: COLORS.emerald,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: COLORS.emerald,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: COLORS.emeraldDim,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  title: {
    color: COLORS.textSub,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  titleSelected: {
    color: COLORS.textPrimary,
  },
  desc: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('athlete');

  // Touch tracking — only show errors after field has been interacted with
  const [touchedName, setTouchedName] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Card entrance animation
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 600,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 600,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived validation ──────────────────────────────────────────────────────

  const nameError = touchedName && !name.trim() ? 'Full name is required.' : '';
  const emailError =
    touchedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? 'Enter a valid email address.'
      : '';
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordError = touchedPassword ? validatePassword(password) ?? '' : '';
  const confirmError =
    touchedConfirm && password !== confirmPassword ? 'Passwords do not match.' : '';

  const isFormValid =
    name.trim() !== '' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    validatePassword(password) === null &&
    password === confirmPassword &&
    selectedRole !== undefined;

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleRegister() {
    // Touch all fields to show any remaining errors
    setTouchedName(true);
    setTouchedEmail(true);
    setTouchedPassword(true);
    setTouchedConfirm(true);
    setServerError('');

    if (!isFormValid) return;

    setIsLoading(true);
    try {
      await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: selectedRole, // strictly 'athlete' | 'coach'
      });
      const result = await login(email.trim().toLowerCase(), password);
      storeToken(result.access_token);
      if (selectedRole === 'coach') {
        router.replace('/coach-dashboard' as Href);
      } else {
        router.replace('/athlete-dashboard' as Href);
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen}>
      {/* Animated radial gradient background (web) */}
      {Platform.OS === 'web' &&
        React.createElement('div', {
          'aria-hidden': true,
          style: {
            position: 'fixed',
            inset: 0,
            background: [
              'radial-gradient(ellipse 70% 50% at 70% -5%, rgba(16,185,129,0.13) 0%, transparent 60%)',
              'radial-gradient(ellipse 55% 40% at 15% 100%, rgba(14,165,233,0.07) 0%, transparent 60%)',
              'linear-gradient(160deg, #060b14 0%, #0a0f1a 55%, #0d1525 100%)',
            ].join(', '),
            pointerEvents: 'none',
            zIndex: 0,
          },
        })}

      {/* Subtle moving grid */}
      <GridMotion opacity={0.025} animDuration={28} zIndex={1} />

      <ScrollView
        contentContainerStyle={[
          styles.shell,
          isWide ? styles.shellWide : styles.shellNarrow,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Left branding panel (wide only) ─────────────────────────────── */}
        {isWide && (
          <Animated.View
            style={[
              styles.brandPanel,
              { opacity: cardFade, transform: [{ translateY: cardSlide }] },
            ]}
          >
            <View style={styles.brandLogoRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brandName}>AthliTech</Text>
            </View>
            <Text style={styles.brandTagline}>
              Join thousands of athletes and coaches already on the platform.
            </Text>
            <View style={styles.brandFeatures}>
              {[
                'Real-time performance tracking',
                'Coach-assigned workout plans',
                'Goal setting & milestone alerts',
                'Secure, role-based access',
              ].map((feat) => (
                <View key={feat} style={styles.brandFeatureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.emerald} />
                  <Text style={styles.brandFeatureText}>{feat}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Glass registration card ──────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.card,
            { opacity: cardFade, transform: [{ translateY: cardSlide }] },
          ]}
        >
          {/* Backdrop blur (web) */}
          {Platform.OS === 'web' &&
            React.createElement('div', {
              'aria-hidden': true,
              style: {
                position: 'absolute',
                inset: 0,
                borderRadius: 20,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                pointerEvents: 'none',
                zIndex: 0,
              },
            })}

          <View style={styles.cardContent}>
            {/* Mobile brand row */}
            {!isWide && (
              <View style={styles.mobileBrandRow}>
                <View style={styles.brandDot} />
                <Text style={styles.brandName}>AthliTech</Text>
              </View>
            )}

            {/* Split-text heading */}
            <SplitText
              text="Create account."
              textStyle={styles.headingText}
              containerStyle={styles.headingContainer}
              initialDelay={120}
              staggerMs={75}
              duration={480}
              slideDistance={24}
            />
            <Text style={styles.subtitle}>
              Join as an Athlete or Coach. No credit card required.
            </Text>

            {/* ── Role selector ────────────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>I am a</Text>
            <View style={styles.roleRow}>
              {ROLES.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  selected={selectedRole === role.id}
                  onSelect={() => setSelectedRole(role.id)}
                />
              ))}
            </View>

            {/* ── Form fields ──────────────────────────────────────────────── */}
            <View style={styles.form}>
              <GlassInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Jane Smith"
                autoCapitalize="words"
                autoComplete="name"
                error={nameError || undefined}
                onBlur={() => setTouchedName(true)}
              />

              <GlassInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                error={emailError || undefined}
                onBlur={() => setTouchedEmail(true)}
              />

              {/* Password with strength bar */}
              <View style={{ marginBottom: 18 }}>
                <GlassInput
                  label="Password"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (!touchedPassword) setTouchedPassword(true);
                  }}
                  placeholder="8–20 chars, A-Z, 0-9, !@#$"
                  password
                  error={passwordError || undefined}
                  onBlur={() => setTouchedPassword(true)}
                  containerStyle={{ marginBottom: 0 }}
                />
                <StrengthBar strength={passwordStrength} />
              </View>

              <GlassInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  if (!touchedConfirm) setTouchedConfirm(true);
                }}
                placeholder="Repeat your password"
                password
                error={confirmError || undefined}
                onBlur={() => setTouchedConfirm(true)}
              />

              {/* Server-side error */}
              {serverError ? (
                <View style={styles.errorBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color={COLORS.error}
                    style={{ marginTop: 1 }}
                  />
                  <Text style={styles.errorText}>{serverError}</Text>
                </View>
              ) : null}

              <PressButton
                id="register-submit"
                label="Create account"
                onPress={handleRegister}
                loading={isLoading}
                disabled={!isFormValid}
                style={styles.submitBtn}
              />
            </View>

            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Link href={LOGIN_ROUTE} style={styles.footerLink}>
                Sign In
              </Link>
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    position: 'relative',
  },

  // Layout
  shell: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 48,
    minHeight: '100%' as any,
  },
  shellWide: {
    flexDirection: 'row',
    gap: 60,
    alignItems: 'flex-start',
    paddingTop: 80,
  },
  shellNarrow: {
    flexDirection: 'column',
  },

  // Brand panel
  brandPanel: {
    flex: 1,
    maxWidth: 360,
    paddingRight: 16,
    paddingTop: 20,
    zIndex: 5,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: COLORS.emerald,
  },
  brandName: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    color: COLORS.textSub,
    fontSize: 17,
    lineHeight: 28,
    fontWeight: '600',
    marginBottom: 28,
  },
  brandFeatures: {
    gap: 14,
  },
  brandFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandFeatureText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  mobileBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 22,
  },

  // Glass card
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: COLORS.bgGlass,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 5,
    ...SHADOW.card,
  },
  cardContent: {
    padding: 32,
    zIndex: 2,
  },

  // Heading
  headingContainer: {
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  headingText: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 26,
  },

  // Role selector
  sectionLabel: {
    color: COLORS.textSub,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },

  // Form
  form: {
    gap: 0,
  },
  submitBtn: {
    marginTop: 10,
    width: '100%',
  },

  // Error box
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.errorDim,
    borderColor: 'rgba(239,68,68,0.25)',
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 13,
    lineHeight: 20,
  },

  // Footer
  footerText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 22,
  },
  footerLink: {
    color: COLORS.emerald,
    fontWeight: '700',
  },
});
