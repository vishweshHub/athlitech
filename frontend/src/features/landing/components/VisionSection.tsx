/**
 * VisionSection
 *
 * Scroll Stack Section 4 — The Vision
 * AI-powered athlete development — the future of AthliTech.
 *
 * Full-width cinematic dark section with an animated horizon glow
 * and scroll-reveal text that tells an aspirational story.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

const PILLARS = [
  {
    icon: '🧠',
    title: 'AI-Powered Coaching',
    desc: 'Predictive models that surface fatigue signals, suggest recovery windows, and recommend program adjustments — automatically.',
    color: '#6366f1',
    colorDim: 'rgba(99,102,241,0.1)',
    colorBorder: 'rgba(99,102,241,0.2)',
  },
  {
    icon: '📡',
    title: 'Wearable Integration',
    desc: 'Sync heart rate, sleep data, and movement patterns from any device into a unified athlete health profile.',
    color: '#0ea5e9',
    colorDim: 'rgba(14,165,233,0.1)',
    colorBorder: 'rgba(14,165,233,0.2)',
  },
  {
    icon: '🔮',
    title: 'Predictive Performance',
    desc: 'Know when an athlete is ready to peak — and when to pull back — with data-driven periodization that adapts in real time.',
    color: '#10b981',
    colorDim: 'rgba(16,185,129,0.1)',
    colorBorder: 'rgba(16,185,129,0.2)',
  },
];

function useScrollReveal(delay = 0, threshold = 0.12) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const ref = useRef<any>(null);
  const hasAnimated = useRef(false);

  function animate() {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
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
      { threshold }
    );
    observer.observe(domNode);
    return () => observer.disconnect();
  }, []); // eslint-disable-line

  return { ref, opacity, translateY };
}

export default function VisionSection() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 768;

  const header = useScrollReveal(0, 0.1);
  const quote = useScrollReveal(150, 0.1);
  const pillar0 = useScrollReveal(80);
  const pillar1 = useScrollReveal(180);
  const pillar2 = useScrollReveal(280);
  const pillarReveal = [pillar0, pillar1, pillar2];
  const closing = useScrollReveal(200);

  return (
    <View style={styles.section}>
      {/* Cinematic horizon glow */}
      <View style={styles.horizonGlow} />
      <View style={styles.horizonGlow2} />

      {/* Starfield dots */}
      {[...Array(8)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.starDot,
            {
              top: `${10 + i * 11}%` as any,
              left: `${8 + i * 12}%` as any,
              opacity: 0.06 + (i % 3) * 0.03,
              width: i % 2 === 0 ? 3 : 2,
              height: i % 2 === 0 ? 3 : 2,
            },
          ]}
        />
      ))}

      {/* Section header */}
      <Animated.View
        ref={header.ref}
        style={[
          styles.header,
          { opacity: header.opacity, transform: [{ translateY: header.translateY }] },
        ]}
      >
        <View style={styles.pill}>
          <Text style={styles.pillText}>Vision</Text>
        </View>

        <Text style={[styles.title, isNarrow ? styles.titleNarrow : styles.titleWide]}>
          The future of{'\n'}
          <Text style={styles.titleAccent}>athlete development</Text>
          {'\n'}is intelligent.
        </Text>

        <Text style={styles.subtitle}>
          AthliTech today is the foundation. What we're building next redefines what it means to train, coach, and develop human athletic potential.
        </Text>
      </Animated.View>

      {/* Pull quote */}
      <Animated.View
        ref={quote.ref}
        style={[
          styles.quoteCard,
          { opacity: quote.opacity, transform: [{ translateY: quote.translateY }] },
        ]}
      >
        <Text style={styles.quoteBar} />
        <View style={styles.quoteContent}>
          <Text style={styles.quoteText}>
            "Every champion was once a contender who refused to give up.{'\n'}
            We're building the infrastructure that turns that refusal into results."
          </Text>
          <Text style={styles.quoteAuthor}>— The AthliTech Team</Text>
        </View>
      </Animated.View>

      {/* Future pillars */}
      <View style={[styles.pillarsGrid, isNarrow ? styles.pillarsNarrow : styles.pillarsWide]}>
        {PILLARS.map((pillar, i) => (
          <Animated.View
            key={i}
            ref={pillarReveal[i].ref}
            style={[
              styles.pillarCard,
              {
                borderColor: pillar.colorBorder,
                backgroundColor: pillar.colorDim,
                opacity: pillarReveal[i].opacity,
                transform: [{ translateY: pillarReveal[i].translateY }],
                width: isNarrow ? '100%' : '31%' as any,
              },
            ]}
          >
            {/* Glow circle */}
            <View style={[styles.pillarGlow, { backgroundColor: pillar.colorDim }]} />

            <Text style={styles.pillarIcon}>{pillar.icon}</Text>
            <Text style={[styles.pillarTitle, { color: pillar.color }]}>{pillar.title}</Text>
            <Text style={styles.pillarDesc}>{pillar.desc}</Text>

            {/* Coming soon tag */}
            <View style={[styles.comingSoonTag, { borderColor: pillar.colorBorder }]}>
              <View style={[styles.comingSoonDot, { backgroundColor: pillar.color }]} />
              <Text style={[styles.comingSoonText, { color: pillar.color }]}>Coming soon</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Closing statement */}
      <Animated.View
        ref={closing.ref}
        style={[
          styles.closingBlock,
          { opacity: closing.opacity, transform: [{ translateY: closing.translateY }] },
        ]}
      >
        <View style={styles.closingSeparator} />
        <Text style={[styles.closingTitle, isNarrow ? styles.closingTitleNarrow : styles.closingTitleWide]}>
          This is just the beginning.
        </Text>
        <Text style={styles.closingSubtitle}>
          Join AthliTech now and grow alongside a platform that grows with you.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#060b14',
    paddingVertical: 110,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },

  // Background effects
  horizonGlow: {
    position: 'absolute',
    bottom: -80,
    left: '50%',
    marginLeft: -200,
    width: 400,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  horizonGlow2: {
    position: 'absolute',
    top: 40,
    left: '50%',
    marginLeft: -120,
    width: 240,
    height: 200,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.05)',
  },
  starDot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    alignItems: 'center',
    maxWidth: 680,
    marginBottom: 56,
    width: '100%',
  },
  pill: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderColor: 'rgba(99,102,241,0.3)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 24,
  },
  pillText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f0f4f8',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  titleNarrow: { fontSize: 30, lineHeight: 42 },
  titleWide: { fontSize: 46, lineHeight: 60 },
  titleAccent: { color: '#6366f1' },
  subtitle: {
    color: '#8a9ab5',
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'center',
    maxWidth: 560,
  },

  // Quote
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: 740,
    width: '100%',
    backgroundColor: '#0f1928',
    borderColor: 'rgba(99,102,241,0.2)',
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 64,
    overflow: 'hidden',
  },
  quoteBar: {
    width: 4,
    backgroundColor: '#6366f1',
    borderRadius: 0,
    alignSelf: 'stretch',
    opacity: 0.7,
  },
  quoteContent: {
    flex: 1,
    padding: 28,
    gap: 12,
  },
  quoteText: {
    color: '#c8d8e8',
    fontSize: 16,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    color: '#4a5568',
    fontSize: 13,
    fontWeight: '600',
  },

  // Pillars
  pillarsGrid: {
    width: '100%',
    maxWidth: 1000,
    marginBottom: 72,
  },
  pillarsNarrow: {
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
  },
  pillarsWide: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  pillarCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
    minWidth: 260,
    gap: 0,
  },
  pillarGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 999,
    opacity: 0.4,
  },
  pillarIcon: {
    fontSize: 32,
    marginBottom: 16,
  },
  pillarTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  pillarDesc: {
    color: '#718096',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  comingSoonTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  comingSoonDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Closing
  closingBlock: {
    alignItems: 'center',
    maxWidth: 600,
    width: '100%',
  },
  closingSeparator: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(99,102,241,0.4)',
    borderRadius: 99,
    marginBottom: 32,
  },
  closingTitle: {
    color: '#f0f4f8',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  closingTitleNarrow: { fontSize: 26, lineHeight: 34 },
  closingTitleWide: { fontSize: 36, lineHeight: 46 },
  closingSubtitle: {
    color: '#8a9ab5',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
});
