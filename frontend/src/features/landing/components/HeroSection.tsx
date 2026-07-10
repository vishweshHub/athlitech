import { Href, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

const LOGIN_ROUTE = '/login' as Href;
const REGISTER_ROUTE = '/register' as Href;

export default function HeroSection() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isNarrow = width < 768;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.section}>
      {/* Decorative orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      <Animated.View
        style={[
          styles.content,
          isNarrow ? styles.contentNarrow : styles.contentWide,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
        ]}
      >
        {/* Badge */}
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Sports Performance Platform</Text>
        </View>

        {/* Headline */}
        <Text style={[styles.headline, isNarrow ? styles.headlineNarrow : styles.headlineWide]}>
          Train Smarter.{'\n'}
          <Text style={styles.headlineAccent}>Perform Better.</Text>
        </Text>

        {/* Sub headline */}
        <Text style={[styles.subheadline, isNarrow ? styles.subNarrow : styles.subWide]}>
          AthliTech connects athletes, coaches, and academies on a single platform — 
          with real-time tracking, intelligent insights, and data-driven coaching.
        </Text>

        {/* CTA Buttons */}
        <View style={[styles.ctaRow, isNarrow ? styles.ctaRowNarrow : styles.ctaRowWide]}>
          <Pressable
            onPress={() => router.push(REGISTER_ROUTE)}
            style={({ pressed }) => [styles.ctaPrimary, pressed && styles.ctaPrimaryPressed]}
          >
            <Text style={styles.ctaPrimaryText}>Get Started Free</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push(LOGIN_ROUTE)}
            style={({ pressed }) => [styles.ctaSecondary, pressed && styles.ctaSecondaryPressed]}
          >
            <Text style={styles.ctaSecondaryText}>Sign In</Text>
          </Pressable>
        </View>

        {/* Stats strip */}
        <View style={[styles.statsRow, isNarrow ? styles.statsRowNarrow : styles.statsRowWide]}>
          {STATS.map((stat, i) => (
            <View key={i} style={[styles.statItem, i < STATS.length - 1 && styles.statItemBorder]}>
              <Text style={styles.statNumber}>{stat.number}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const STATS = [
  { number: '10k+', label: 'Athletes' },
  { number: '500+', label: 'Coaches' },
  { number: '120+', label: 'Academies' },
  { number: '99.9%', label: 'Uptime' },
];

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#0a0f1a',
    minHeight: 620,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 500,
    height: 500,
    backgroundColor: 'rgba(16,185,129,0.07)',
    top: -100,
    right: -120,
  },
  orb2: {
    width: 400,
    height: 400,
    backgroundColor: 'rgba(16,185,129,0.05)',
    bottom: -80,
    left: -100,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  contentNarrow: {
    width: '100%',
  },
  contentWide: {
    maxWidth: 800,
    width: '100%',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.3)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 28,
    gap: 8,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#10b981',
  },
  badgeText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headline: {
    color: '#f0f4f8',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 52,
    marginBottom: 20,
  },
  headlineNarrow: {
    fontSize: 36,
    lineHeight: 44,
  },
  headlineWide: {
    fontSize: 56,
    lineHeight: 68,
  },
  headlineAccent: {
    color: '#10b981',
  },
  subheadline: {
    color: '#8a9ab5',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 36,
    maxWidth: 600,
  },
  subNarrow: {
    fontSize: 16,
  },
  subWide: {
    fontSize: 18,
  },
  ctaRow: {
    marginBottom: 48,
    gap: 14,
  },
  ctaRowNarrow: {
    flexDirection: 'column',
    width: '100%',
  },
  ctaRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 15,
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaPrimaryPressed: {
    backgroundColor: '#059669',
  },
  ctaPrimaryText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ctaArrow: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  ctaSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(240,244,248,0.2)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 15,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  ctaSecondaryPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  ctaSecondaryText: {
    color: '#c8d8e8',
    fontSize: 17,
    fontWeight: '600',
  },
  statsRow: {
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  statsRowNarrow: {
    flexDirection: 'column',
    width: '100%',
  },
  statsRowWide: {
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  statItemBorder: {
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderRightWidth: 1,
  },
  statNumber: {
    color: '#10b981',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: '#8a9ab5',
    fontSize: 13,
    fontWeight: '500',
  },
});
