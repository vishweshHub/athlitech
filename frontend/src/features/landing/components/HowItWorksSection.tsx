import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const STEPS = [
  {
    step: '01',
    title: 'Create Your Academy',
    description:
      'Admins register the academy, configure sport disciplines, and set up the base system in under 10 minutes.',
    icon: '🏛️',
  },
  {
    step: '02',
    title: 'Onboard Coaches & Athletes',
    description:
      'Invite coaches and athletes via email. Role-based access is automatically configured — no manual setup needed.',
    icon: '👥',
  },
  {
    step: '03',
    title: 'Plan & Assign Sessions',
    description:
      'Coaches create training plans, schedule sessions, and assign drills. Athletes receive instant notifications.',
    icon: '📋',
  },
  {
    step: '04',
    title: 'Track & Improve',
    description:
      'Performance data flows into analytics dashboards. Coaches refine plans based on real metrics, not guesswork.',
    icon: '📈',
  },
];

export default function HowItWorksSection() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 768;

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>How It Works</Text>
        </View>
        <Text style={[styles.title, isNarrow ? styles.titleNarrow : styles.titleWide]}>
          Up and running in minutes
        </Text>
        <Text style={styles.subtitle}>
          A simple four-step process gets your entire organization on the platform — fast.
        </Text>
      </View>

      {/* Steps */}
      <View style={[styles.stepsContainer, isNarrow ? styles.stepsNarrow : styles.stepsWide]}>
        {STEPS.map((step, i) => (
          <View key={i} style={[styles.stepWrapper, isNarrow ? styles.stepWrapperNarrow : styles.stepWrapperWide]}>
            <View style={styles.stepCard}>
              {/* Connector line (desktop) */}
              {!isNarrow && i < STEPS.length - 1 && <View style={styles.connectorLine} />}

              {/* Step number */}
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{step.step}</Text>
              </View>

              {/* Icon circle */}
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>{step.icon}</Text>
              </View>

              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.description}</Text>
            </View>

            {/* Mobile connector */}
            {isNarrow && i < STEPS.length - 1 && (
              <View style={styles.mobileConnector}>
                <View style={styles.mobileConnectorLine} />
                <Text style={styles.mobileConnectorArrow}>↓</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#0a0f1a',
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
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
  stepsContainer: {
    width: '100%',
    maxWidth: 1000,
  },
  stepsNarrow: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  stepsWide: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 0,
  },
  stepWrapper: {},
  stepWrapperNarrow: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  stepWrapperWide: {
    flex: 1,
    maxWidth: 240,
    position: 'relative',
  },
  stepCard: {
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    top: 70,
    right: -60,
    width: 120,
    height: 2,
    backgroundColor: 'rgba(16,185,129,0.25)',
    zIndex: 0,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 99,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.4)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111827',
    borderColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  iconText: {
    fontSize: 26,
  },
  stepTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDesc: {
    color: '#718096',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  mobileConnector: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  mobileConnectorLine: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(16,185,129,0.3)',
  },
  mobileConnectorArrow: {
    color: '#10b981',
    fontSize: 16,
    marginTop: -4,
  },
});
