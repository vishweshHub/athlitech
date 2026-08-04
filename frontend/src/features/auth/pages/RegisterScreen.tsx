import { Href, Link, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import Reanimated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { login, registerUser, storeToken } from '@/api/auth';
import { useWorkspace } from '@/context/WorkspaceContext';
import GridMotion from '@/components/animations/GridMotion';

import SplitText from '@/components/animations/SplitText';
import GlassInput from '@/components/ui/GlassInput';
import PressButton from '@/components/ui/PressButton';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { RADIUS, useThemeColors } from '@/styles/tokens';

const LOGIN_ROUTE = '/login' as Href;

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

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

export default function RegisterScreen() {
  const router = useRouter();
  const { refreshWorkspaceStatus } = useWorkspace();
  const { width } = useWindowDimensions();

  const isWide = width >= 900;
  const colors = useThemeColors();
  const styles = getStyles(colors);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Touched states
  const [touchedName, setTouchedName] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const [touchedTerms, setTouchedTerms] = useState(false);

  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Entrance animation
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
  }, []);

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
    termsAccepted;

  async function handleRegister() {
    setTouchedName(true);
    setTouchedEmail(true);
    setTouchedPhone(true);
    setTouchedPassword(true);
    setTouchedConfirm(true);
    setTouchedTerms(true);
    setServerError('');

    if (!isFormValid) return;

    setIsLoading(true);
    try {
      const parts = name.trim().split(' ');
      const fName = parts[0] || 'User';
      const lName = parts.slice(1).join(' ') || 'Account';

      await registerUser({
        first_name: fName,
        last_name: lName,
        email: email.trim().toLowerCase(),
        password,
        confirm_password: confirmPassword,
        role: 'none',
      });

      const result = await login(email.trim().toLowerCase(), password);
      await storeToken(result.access_token);
      await refreshWorkspaceStatus();
      router.replace('/role-hub' as Href);

    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  }

  const animatedCardStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(colors.bgGlass, { duration: 400 }),
    borderColor: withTiming(colors.border, { duration: 400 }),
    shadowColor: withTiming(colors.cardShadow || '#000', { duration: 400 }),
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <View style={{ position: 'absolute', top: 16, right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </View>

      <GridMotion opacity={0.025} animDuration={28} zIndex={1} />

      <ScrollView
        contentContainerStyle={[
          styles.shell,
          isWide ? styles.shellWide : styles.shellNarrow,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Left Branding (Wide) */}
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
              One account for your entire athletic journey. Activate workspaces as you grow.
            </Text>
            <View style={styles.brandFeatures}>
              {[
                'Single universal AthliTech identity',
                'Multi-role workspace activation',
                'Instant workspace switching',
                'Secure enterprise-grade encryption',
              ].map((feat) => (
                <View key={feat} style={styles.brandFeatureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.emerald} />
                  <Text style={styles.brandFeatureText}>{feat}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Universal Glass Registration Card */}
        <Animated.View
          style={[
            styles.cardBase,
            { opacity: cardFade, transform: [{ translateY: cardSlide }] },
          ]}
        >
          <Reanimated.View style={[StyleSheet.absoluteFill, animatedCardStyle, { borderRadius: 20 }]} />

          <View style={styles.cardContent}>
            {!isWide && (
              <View style={styles.mobileBrandRow}>
                <View style={styles.brandDot} />
                <Text style={styles.brandName}>AthliTech</Text>
              </View>
            )}

            <SplitText
              text="Create AthliTech Account"
              textStyle={styles.headingText}
              containerStyle={styles.headingContainer}
              initialDelay={120}
              staggerMs={60}
              duration={480}
              slideDistance={24}
            />
            <Text style={styles.subtitle}>
              Universal platform account. Activate Athlete, Coach, or Club workspaces anytime.
            </Text>

            <View style={styles.form}>
              <GlassInput
                label="Full Name *"
                value={name}
                onChangeText={setName}
                placeholder="Jane Smith"
                autoCapitalize="words"
                autoComplete="name"
                error={nameError || undefined}
                onBlur={() => setTouchedName(true)}
              />

              <GlassInput
                label="Email Address *"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                error={emailError || undefined}
                onBlur={() => setTouchedEmail(true)}
              />

              <GlassInput
                label="Phone Number (Optional)"
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 (555) 000-0000"
                keyboardType="phone-pad"
                onBlur={() => setTouchedPhone(true)}
              />

              <View style={{ marginBottom: 18 }}>
                <GlassInput
                  label="Password *"
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
                label="Confirm Password *"
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

              <Pressable
                style={styles.checkboxRow}
                onPress={() => {
                  setTermsAccepted(!termsAccepted);
                  setTouchedTerms(true);
                }}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                  {termsAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  I agree to the Terms & Conditions and Privacy Policy.
                </Text>
              </Pressable>

              {serverError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{serverError}</Text>
                </View>
              ) : null}

              <PressButton
                id="register-submit"
                label="Create AthliTech Account"
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

const getStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: 'transparent',
    },
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
    brandPanel: {
      flex: 1,
      maxWidth: 360,
      paddingRight: 16,
      paddingTop: 20,
    },
    brandLogoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    brandDot: {
      width: 12,
      height: 12,
      borderRadius: 99,
      backgroundColor: colors.emerald,
    },
    brandName: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '800',
    },
    brandTagline: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 24,
    },
    brandFeatures: {
      gap: 12,
    },
    brandFeatureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    brandFeatureText: {
      color: colors.textSub,
      fontSize: 14,
    },
    cardBase: {
      width: '100%',
      maxWidth: 480,
      borderRadius: 20,
    },
    cardContent: {
      padding: 32,
    },
    mobileBrandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 20,
    },
    headingContainer: {
      marginBottom: 8,
    },
    headingText: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 24,
    },
    form: {
      gap: 16,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 4,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxActive: {
      backgroundColor: colors.emerald,
      borderColor: colors.emerald,
    },
    checkboxLabel: {
      color: colors.textMuted,
      fontSize: 12,
      flex: 1,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.errorDim,
      padding: 12,
      borderRadius: RADIUS.sm,
    },
    errorText: {
      color: colors.error,
      fontSize: 13,
      flex: 1,
    },
    submitBtn: {
      marginTop: 8,
    },
    footerText: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 24,
    },
    footerLink: {
      color: colors.emerald,
      fontWeight: '700',
    },
  });
