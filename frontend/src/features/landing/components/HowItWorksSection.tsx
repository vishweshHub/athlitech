/**
 * HowItWorksSection (Redesigned)
 *
 * Scroll Stack Section 2 — Visual flow:
 * Register → Connect → Receive Workouts → Train → Record Performance → Coach Feedback
 *
 * Premium stepped flow with animated connectors and scroll-reveal.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useThemeColors } from '@/styles/tokens';

const FLOW_STEPS = [
  {
    step: '01',
    icon: '✦',
    title: 'Register',
    desc: 'Create your account as an athlete, coach, or academy admin.',
    color: '#10b981',
    colorDim: 'rgba(16,185,129,0.12)',
    colorBorder: 'rgba(16,185,129,0.25)',
  },
  {
    step: '02',
    icon: '⟳',
    title: 'Connect with Coach',
    desc: 'Athletes are linked to their assigned coach. Roles and permissions are applied.',
    color: '#6366f1',
    colorDim: 'rgba(99,102,241,0.12)',
    colorBorder: 'rgba(99,102,241,0.25)',
  },
  {
    step: '03',
    icon: '◈',
    title: 'Receive Workouts',
    desc: 'Coaches build and assign personalized training plans directly to athletes.',
    color: '#0ea5e9',
    colorDim: 'rgba(14,165,233,0.12)',
    colorBorder: 'rgba(14,165,233,0.25)',
  },
  {
    step: '04',
    icon: '▲',
    title: 'Train',
    desc: 'Athletes follow their program, update workout status, and add session notes.',
    color: '#f59e0b',
    colorDim: 'rgba(245,158,11,0.12)',
    colorBorder: 'rgba(245,158,11,0.25)',
  },
  {
    step: '05',
    icon: '◉',
    title: 'Record Performance',
    desc: 'Coaches log metrics — sprint times, weight, performance scores — after each session.',
    color: '#ec4899',
    colorDim: 'rgba(236,72,153,0.12)',
    colorBorder: 'rgba(236,72,153,0.25)',
  },
  {
    step: '06',
    icon: '★',
    title: 'Coach Feedback',
    desc: 'Athletes receive structured feedback and annotations on their sessions.',
    color: '#10b981',
    colorDim: 'rgba(16,185,129,0.12)',
    colorBorder: 'rgba(16,185,129,0.25)',
  },
  {
    step: '07',
    icon: '📈',
    title: 'Improve Performance',
    desc: 'Performance trends show continuous improvement based on data, not guesswork.',
    color: '#6366f1',
    colorDim: 'rgba(99,102,241,0.12)',
    colorBorder: 'rgba(99,102,241,0.25)',
  },
];

function useScrollReveal(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(36)).current;
  const ref = useRef<any>(null);
  const hasAnimated = useRef(false);

  function animate() {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 650,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 650,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }

  useEffect(() => {
    if (Platform.OS !== 'web') { animate(); return; }
    const node = ref.current;
    if (!node) { animate(); return; }
    const domNode = typeof node.getDOMNode === 'function' ? node.getDOMNode() : node;
    if (!domNode || typeof IntersectionObserver === 'undefined') { animate(); return; }
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) { animate(); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(domNode);
    return () => observer.disconnect();
  }, []); // eslint-disable-line

  return { ref, opacity, translateY };
}

export default function HowItWorksSection() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 768;
  const isMid = width < 1100 && width >= 768;
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const header = useScrollReveal(0);
  const step0 = useScrollReveal(0);
  const step1 = useScrollReveal(80);
  const step2 = useScrollReveal(160);
  const step3 = useScrollReveal(240);
  const step4 = useScrollReveal(320);
  const step5 = useScrollReveal(400);
  const step6 = useScrollReveal(480);
  const stepReveal = [step0, step1, step2, step3, step4, step5, step6];

  // 2 columns on mid, 3 on wide, 1 on narrow
  const cols = isNarrow ? 1 : isMid ? 2 : 3;
  const cardWidthPct = isNarrow ? '100%' : isMid ? '47%' : '31%';

  return (
    <View style={styles.section}>
      {/* Emerald glow top center */}
      <View style={styles.glowTop} />

      {/* Header */}
      <Animated.View
        ref={header.ref}
        style={[
          styles.header,
          { opacity: header.opacity, transform: [{ translateY: header.translateY }] },
        ]}
      >
        <View style={styles.pill}>
          <Text style={styles.pillText}>How It Works</Text>
        </View>
        <Text style={[styles.title, isNarrow ? styles.titleNarrow : styles.titleWide]}>
          Seven steps from{' '}
          <Text style={styles.titleAccent}>signup to excellence</Text>
        </Text>
        <Text style={styles.subtitle}>
          A seamless loop of training, feedback, and growth — designed to keep improving itself.
        </Text>
      </Animated.View>

      {/* Flow steps grid */}
      <View style={[styles.flowGrid, isNarrow ? styles.flowGridNarrow : styles.flowGridWide]}>
        {FLOW_STEPS.map((step, i) => (
          <Animated.View
            key={i}
            ref={stepReveal[i].ref}
            style={[
              styles.stepCard,
              {
                width: cardWidthPct as any,
                borderColor: step.colorBorder,
                opacity: stepReveal[i].opacity,
                transform: [{ translateY: stepReveal[i].translateY }],
              },
            ]}
          >
            {/* Step number + connector dot */}
            <View style={styles.stepTopRow}>
              <View style={[styles.stepBadge, { backgroundColor: step.colorDim, borderColor: step.colorBorder }]}>
                <Text style={[styles.stepNum, { color: step.color }]}>{step.step}</Text>
              </View>
              {/* Connector line only on desktop, non-last in row */}
              {!isNarrow && i % cols !== cols - 1 && i < FLOW_STEPS.length - 1 && (
                <View style={[styles.connectorDots, { right: -28 }]}>
                  {[0, 1, 2].map((d) => (
                    <View
                      key={d}
                      style={[styles.connectorDot, { backgroundColor: step.color, opacity: 0.3 - d * 0.08 }]}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Icon */}
            <Text style={[styles.stepIcon, { color: step.color }]}>{step.icon}</Text>

            {/* Text */}
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDesc}>{step.desc}</Text>

            {/* Mobile arrow */}
            {isNarrow && i < FLOW_STEPS.length - 1 && (
              <Text style={[styles.mobileArrow, { color: FLOW_STEPS[i + 1].color }]}>↓</Text>
            )}
          </Animated.View>
        ))}
      </View>

      {/* Closing tagline */}
      <Animated.View style={styles.closingRow}>
        <View style={styles.closingLine} />
        <Text style={styles.closingText}>The cycle continues — every session smarter than the last.</Text>
        <View style={styles.closingLine} />
      </Animated.View>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  section: {
    backgroundColor: 'transparent',
    paddingVertical: 100,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: colors.emeraldDim || 'rgba(16,185,129,0.06)',
  },
  header: {
    alignItems: 'center',
    maxWidth: 640,
    marginBottom: 64,
    width: '100%',
  },
  pill: {
    backgroundColor: colors.emeraldDim || 'rgba(16,185,129,0.12)',
    borderColor: colors.emeraldGlow || 'rgba(16,185,129,0.28)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 24,
  },
  pillText: {
    color: colors.emerald,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  titleNarrow: { fontSize: 28, lineHeight: 38 },
  titleWide: { fontSize: 40, lineHeight: 52 },
  titleAccent: { color: colors.emerald },
  subtitle: {
    color: colors.textSub,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 500,
  },

  // Grid
  flowGrid: {
    width: '100%',
    maxWidth: 1040,
  },
  flowGridNarrow: {
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
  },
  flowGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },

  // Step card
  stepCard: {
    backgroundColor: colors.bgGlass || '#0f1928',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    position: 'relative',
    minWidth: 260,
  },
  stepTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  stepBadge: {
    width: 34,
    height: 34,
    borderRadius: 99,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  connectorDots: {
    position: 'absolute',
    top: 16,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  connectorDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
  },
  stepIcon: {
    fontSize: 28,
    marginBottom: 12,
    fontWeight: '900',
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  stepDesc: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  mobileArrow: {
    fontSize: 22,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.6,
  },

  // Closing
  closingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 64,
    maxWidth: 600,
    width: '100%',
  },
  closingLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle || 'rgba(255,255,255,0.06)',
  },
  closingText: {
    color: colors.textDimmed,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    flexShrink: 1,
  },
});
