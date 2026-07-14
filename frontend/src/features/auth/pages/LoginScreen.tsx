import { Href, Link, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { fetchCurrentUser, getStoredToken, login, storeToken } from '@/api/auth';
import GridMotion from '@/components/animations/GridMotion';
import SplitText from '@/components/animations/SplitText';
import GlassInput from '@/components/ui/GlassInput';
import PressButton from '@/components/ui/PressButton';
import { COLORS, RADIUS, SHADOW } from '@/styles/tokens';

const DASHBOARD_ROUTE = '/dashboard' as Href;
const REGISTER_ROUTE = '/register' as Href;

/**
 * Validates a password against the application policy.
 * Returns an error string if invalid, or null if valid.
 * Rules: 8–20 characters, uppercase, lowercase, digit, special character.
 */
function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 20) return 'Password must be at most 20 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/\d/.test(password)) return 'Password must contain at least one number.';
  if (!/[!@#$%^&*()\-_=+\[\]{};':",.<>/?`~\\|]/.test(password))
    return 'Password must contain at least one special character (e.g. !@#$%).';
  return null;
}

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Card entrance animation
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    let isMounted = true;

    async function validateExistingSession() {
      const token = getStoredToken();
      if (!token) {
        if (isMounted) setIsCheckingSession(false);
        return;
      }
      try {
        const currentUser = await fetchCurrentUser(token);
        if (isMounted) {
          if (currentUser.role === 'coach') router.replace('/coach-dashboard' as Href);
          else if (currentUser.role === 'athlete') router.replace('/athlete-dashboard' as Href);
          else router.replace(DASHBOARD_ROUTE);
        }
      } catch {
        if (isMounted) setIsCheckingSession(false);
      }
    }

    validateExistingSession();
    return () => { isMounted = false; };
  }, [router]);

  // Animate card in once session check completes
  useEffect(() => {
    if (!isCheckingSession) {
      Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 600,
          delay: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 600,
          delay: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isCheckingSession]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);
      storeToken(result.access_token);
      const currentUser = await fetchCurrentUser(result.access_token);
      if (currentUser.role === 'coach') router.replace('/coach-dashboard' as Href);
      else if (currentUser.role === 'athlete') router.replace('/athlete-dashboard' as Href);
      else router.replace(DASHBOARD_ROUTE);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Session check loading state ───────────────────────────────────────────
  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.screen}>
        {Platform.OS === 'web' && <GridMotion opacity={0.025} zIndex={0} />}
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={COLORS.emerald} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Animated dark gradient background */}
      {Platform.OS === 'web' &&
        React.createElement('div', {
          'aria-hidden': true,
          style: {
            position: 'fixed',
            inset: 0,
            background: [
              'radial-gradient(ellipse 80% 55% at 30% -10%, rgba(16,185,129,0.14) 0%, transparent 60%)',
              'radial-gradient(ellipse 60% 45% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%)',
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
        {/* Left panel — branding (wide layout only) */}
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
              Athlete management and performance tracking for focused teams.
            </Text>
            <View style={styles.brandQuote}>
              <Text style={styles.brandQuoteText}>
                "The only platform that gives coaches and athletes a truly shared view of progress."
              </Text>
              <Text style={styles.brandQuoteAuthor}>— AthliTech Beta User</Text>
            </View>
          </Animated.View>
        )}

        {/* Right panel — glass login card */}
        <Animated.View
          style={[
            styles.card,
            { opacity: cardFade, transform: [{ translateY: cardSlide }] },
          ]}
        >
          {/* Glass blur overlay (web) */}
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

            {/* Split text heading */}
            <SplitText
              text="Welcome back."
              textStyle={styles.headingText}
              containerStyle={styles.headingContainer}
              initialDelay={200}
              staggerMs={80}
              duration={500}
              slideDistance={28}
            />

            <Text style={styles.subtitle}>Sign in to your account to continue.</Text>

            {/* Form */}
            <View style={styles.form}>
              <GlassInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                error={error && !password ? error : undefined}
              />

              <GlassInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                password
                error={error && password ? error : undefined}
              />

              {/* General error (e.g. wrong credentials) */}
              {error && !(!email.trim() || !password) && (
                <View style={styles.errorBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color={COLORS.error}
                    style={{ marginTop: 1 }}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <PressButton
                id="login-submit"
                label="Sign in"
                onPress={handleLogin}
                loading={isLoading}
                style={styles.submitBtn}
              />
            </View>

            <Text style={styles.footerText}>
              New to AthliTech?{' '}
              <Link href={REGISTER_ROUTE} style={styles.footerLink}>
                Create account
              </Link>
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    position: 'relative',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shell: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: '100%' as any,
  },
  shellWide: {
    flexDirection: 'row',
    gap: 60,
  },
  shellNarrow: {
    flexDirection: 'column',
  },

  // Brand panel (wide layout)
  brandPanel: {
    flex: 1,
    maxWidth: 380,
    paddingRight: 20,
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
    fontSize: 18,
    lineHeight: 30,
    fontWeight: '600',
    marginBottom: 36,
  },
  brandQuote: {
    borderLeftColor: COLORS.emerald,
    borderLeftWidth: 2,
    paddingLeft: 16,
  },
  brandQuoteText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  brandQuoteAuthor: {
    color: COLORS.textDimmed,
    fontSize: 12,
    fontWeight: '600',
  },

  // Glass login card
  card: {
    width: '100%',
    maxWidth: 420,
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

  mobileBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },

  headingContainer: {
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  headingText: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },

  form: {
    gap: 0,
  },
  submitBtn: {
    marginTop: 8,
    width: '100%',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.errorDim,
    borderColor: 'rgba(239,68,68,0.25)',
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 13,
    lineHeight: 20,
  },

  footerText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  footerLink: {
    color: COLORS.emerald,
    fontWeight: '700',
  },
});
