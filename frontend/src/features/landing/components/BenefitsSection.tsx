import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const BENEFITS = {
  athletes: {
    emoji: '🏃',
    title: 'For Athletes',
    color: '#10b981',
    colorBg: 'rgba(16,185,129,0.08)',
    colorBorder: 'rgba(16,185,129,0.2)',
    tagline: 'Own your performance journey.',
    points: [
      'View your personalized training schedule daily',
      'Track personal records and performance over time',
      'Receive real-time feedback from your coach',
      'Access session notes and recovery recommendations',
      'Monitor your fitness score and progress trends',
    ],
  },
  coaches: {
    emoji: '🎽',
    title: 'For Coaches',
    color: '#6366f1',
    colorBg: 'rgba(99,102,241,0.08)',
    colorBorder: 'rgba(99,102,241,0.2)',
    tagline: 'Coach smarter, not harder.',
    points: [
      'Manage all your athletes from one dashboard',
      'Create and assign custom training plans',
      'Annotate sessions with notes and media',
      'Compare athlete metrics side-by-side',
      'Generate performance reports in seconds',
    ],
  },
  academies: {
    emoji: '🏛️',
    title: 'For Academies',
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,0.08)',
    colorBorder: 'rgba(245,158,11,0.2)',
    tagline: 'Run your academy like a pro.',
    points: [
      'Centralized management for coaches and athletes',
      'Assign coaches to teams and track workloads',
      'Academy-wide analytics and performance overview',
      'Billing and enrollment management built in',
      'Role-based access for full organizational control',
    ],
  },
};

export default function BenefitsSection() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 768;

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Benefits</Text>
        </View>
        <Text style={[styles.title, isNarrow ? styles.titleNarrow : styles.titleWide]}>
          Built for everyone in the team
        </Text>
        <Text style={styles.subtitle}>
          Whether you're an athlete pushing limits, a coach designing programs, or an admin running the academy —
          AthliTech has you covered.
        </Text>
      </View>

      {/* Benefit cards */}
      <View style={[styles.cardsContainer, isNarrow ? styles.cardsNarrow : styles.cardsWide]}>
        {Object.values(BENEFITS).map((benefit, i) => (
          <BenefitCard key={i} benefit={benefit} isNarrow={isNarrow} />
        ))}
      </View>
    </View>
  );
}

function BenefitCard({
  benefit,
  isNarrow,
}: {
  benefit: (typeof BENEFITS)[keyof typeof BENEFITS];
  isNarrow: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        { borderColor: benefit.colorBorder, backgroundColor: benefit.colorBg },
        isNarrow ? styles.cardNarrow : styles.cardWide,
      ]}
    >
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardEmoji, { borderColor: benefit.colorBorder }]}>
          <Text style={styles.cardEmojiText}>{benefit.emoji}</Text>
        </View>
        <View>
          <Text style={[styles.cardTitle, { color: benefit.color }]}>{benefit.title}</Text>
          <Text style={styles.cardTagline}>{benefit.tagline}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: benefit.colorBorder }]} />

      {/* Points */}
      {benefit.points.map((point, j) => (
        <View key={j} style={styles.point}>
          <View style={[styles.pointDot, { backgroundColor: benefit.color }]} />
          <Text style={styles.pointText}>{point}</Text>
        </View>
      ))}
    </View>
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
    maxWidth: 640,
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
  cardsContainer: {
    width: '100%',
    maxWidth: 1040,
  },
  cardsNarrow: {
    flexDirection: 'column',
    gap: 20,
  },
  cardsWide: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 28,
  },
  cardNarrow: {
    width: '100%',
  },
  cardWide: {
    flex: 1,
    maxWidth: 320,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  cardEmoji: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardEmojiText: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardTagline: {
    color: '#8a9ab5',
    fontSize: 13,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 20,
    opacity: 0.5,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  pointDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    marginTop: 7,
    flexShrink: 0,
  },
  pointText: {
    color: '#c8d8e8',
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
});
