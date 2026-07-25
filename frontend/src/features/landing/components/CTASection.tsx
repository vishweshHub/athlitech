import { Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useThemeColors } from '@/styles/tokens';

const REGISTER_ROUTE = '/register' as Href;
const LOGIN_ROUTE = '/login' as Href;

export default function CTASection() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isNarrow = width < 768;
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        {/* Glow */}
        <View style={styles.glow} />

        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Limited Early Access</Text>
        </View>

        <Text style={[styles.title, isNarrow ? styles.titleNarrow : styles.titleWide]}>
          Ready to elevate your{'\n'}
          <Text style={styles.titleAccent}>sports program?</Text>
        </Text>

        <Text style={styles.subtitle}>
          Join thousands of athletes, coaches, and academies already using AthliTech
          to unlock their full potential.
        </Text>

        <View style={[styles.btnRow, isNarrow ? styles.btnRowNarrow : styles.btnRowWide]}>
          <Pressable
            onPress={() => router.push(REGISTER_ROUTE)}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          >
            <Text style={styles.primaryBtnText}>Start for Free →</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push(LOGIN_ROUTE)}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
          >
            <Text style={styles.secondaryBtnText}>Sign In</Text>
          </Pressable>
        </View>

        <Text style={styles.finePrint}>No credit card required · Cancel anytime</Text>
      </View>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  section: {
    backgroundColor: 'transparent',
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 780,
    backgroundColor: colors.bgGlass || '#0f1d2e',
    borderColor: colors.emeraldGlow || 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 52,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: colors.emeraldDim || 'rgba(16,185,129,0.08)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.emeraldDim || 'rgba(16,185,129,0.1)',
    borderColor: colors.emeraldGlow || 'rgba(16,185,129,0.25)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 24,
    gap: 7,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.emerald,
  },
  badgeText: {
    color: colors.emerald,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  titleNarrow: {
    fontSize: 28,
    lineHeight: 36,
  },
  titleWide: {
    fontSize: 40,
    lineHeight: 52,
  },
  titleAccent: {
    color: colors.emerald,
  },
  subtitle: {
    color: colors.textSub,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 480,
    marginBottom: 36,
  },
  btnRow: {
    gap: 14,
    marginBottom: 20,
  },
  btnRowNarrow: {
    flexDirection: 'column',
    width: '100%',
  },
  btnRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.emerald,
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: colors.emerald,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnPressed: {
    backgroundColor: colors.emeraldPressed,
  },
  primaryBtnText: {
    color: '#ffffff', // keep white on emerald
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: colors.inputBg || 'rgba(255,255,255,0.04)',
  },
  secondaryBtnPressed: {
    backgroundColor: colors.borderSubtle,
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  finePrint: {
    color: colors.textDimmed,
    fontSize: 13,
  },
});
