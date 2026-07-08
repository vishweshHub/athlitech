import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const FEATURES = [
  {
    icon: '📊',
    title: 'Real-Time Analytics',
    description:
      'Track performance metrics, session data, and athlete progress with live dashboards that update automatically.',
  },
  {
    icon: '🎯',
    title: 'Goal Setting & Tracking',
    description:
      'Set measurable targets for each athlete. Monitor weekly, monthly, and seasonal progress against defined benchmarks.',
  },
  {
    icon: '🤝',
    title: 'Coach–Athlete Sync',
    description:
      'Coaches and athletes stay aligned through a shared workspace — feedback, drills, and session notes in one place.',
  },
  {
    icon: '🏫',
    title: 'Academy Management',
    description:
      'Admins can manage multiple teams, assign coaches, oversee rosters, and generate reports from a single control panel.',
  },
  {
    icon: '⚡',
    title: 'Instant Notifications',
    description:
      'Get alerted on upcoming sessions, new assessments, and milestone achievements the moment they happen.',
  },
  {
    icon: '🔒',
    title: 'Secure & Compliant',
    description:
      'Role-based access control and encrypted data storage keep sensitive athlete information safe at every layer.',
  },
];

export default function FeaturesSection() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 768;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
      {/* Section header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Features</Text>
        </View>
        <Text style={[styles.title, isNarrow ? styles.titleNarrow : styles.titleWide]}>
          Everything your team needs
        </Text>
        <Text style={styles.subtitle}>
          Purpose-built tools for modern sports teams — from grassroots academies to elite programs.
        </Text>
      </View>

      {/* Feature grid */}
      <View style={[styles.grid, isNarrow ? styles.gridNarrow : styles.gridWide]}>
        {FEATURES.map((feature, i) => (
          <FeatureCard key={i} feature={feature} index={i} isNarrow={isNarrow} />
        ))}
      </View>
    </Animated.View>
  );
}

function FeatureCard({
  feature,
  index,
  isNarrow,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
  isNarrow: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        isNarrow ? styles.cardNarrow : styles.cardWide,
        { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.cardIcon}>
        <Text style={styles.cardIconText}>{feature.icon}</Text>
      </View>
      <Text style={styles.cardTitle}>{feature.title}</Text>
      <Text style={styles.cardDesc}>{feature.description}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#0d1220',
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 56,
    maxWidth: 600,
  },
  pill: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.25)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  pillText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  title: {
    color: '#f0f4f8',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  titleNarrow: {
    fontSize: 28,
    lineHeight: 36,
  },
  titleWide: {
    fontSize: 38,
    lineHeight: 48,
  },
  subtitle: {
    color: '#8a9ab5',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
  grid: {
    width: '100%',
    maxWidth: 1000,
  },
  gridNarrow: {
    flexDirection: 'column',
    gap: 16,
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#111827',
    borderColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
  },
  cardNarrow: {
    width: '100%',
  },
  cardWide: {
    width: 296,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardIconText: {
    fontSize: 22,
  },
  cardTitle: {
    color: '#e2e8f0',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardDesc: {
    color: '#718096',
    fontSize: 14,
    lineHeight: 22,
  },
});
