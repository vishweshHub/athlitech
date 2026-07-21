/**
 * WhyAthliTechSection
 *
 * Scroll Stack Section 1 — Problem → Solution narrative.
 * Tells the story of why AthliTech exists without listing feature bullets.
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
import { useThemeColors } from '@/styles/tokens';

const PROBLEMS = [
  {
    icon: '📋',
    problem: 'Scattered spreadsheets',
    solution: 'Workouts, progress, and feedback — unified in one platform.',
  },
  {
    icon: '🔇',
    problem: 'Coaches flying blind',
    solution: 'Real data replaces guesswork. Every session informs the next.',
  },
  {
    icon: '⏱️',
    problem: 'Wasted potential',
    solution: 'Athletes train harder when they can see their own growth curve.',
  },
];

function useScrollReveal(delay = 0) {
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
        duration: 700,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }

  useEffect(() => {
    if (Platform.OS !== 'web') {
      animate();
      return;
    }
    const node = ref.current;
    if (!node) { animate(); return; }
    const domNode = typeof node.getDOMNode === 'function' ? node.getDOMNode() : node;
    if (!domNode || typeof IntersectionObserver === 'undefined') { animate(); return; }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) { animate(); observer.disconnect(); }
      },
      { threshold: 0.15 }
    );
    observer.observe(domNode);
    return () => observer.disconnect();
  }, []); // eslint-disable-line

  return { ref, opacity, translateY };
}

export default function WhyAthliTechSection() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 768;
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const header = useScrollReveal(0);
  const stat1 = useScrollReveal(80);
  const stat2 = useScrollReveal(160);
  const stat3 = useScrollReveal(240);
  const problemsReveal = useScrollReveal(120);

  const statReveal = [stat1, stat2, stat3];

  const STATS = [
    { value: '73%', label: 'of athletes lack structured digital training' },
    { value: '3×', label: 'faster performance gains with data-driven coaching' },
    { value: '91%', label: 'coaches report improved athlete outcomes' },
  ];

  return (
    <View style={styles.section}>
      {/* Subtle background grid accent */}
      <View style={styles.gridAccent} />

      {/* Section header */}
      <Animated.View
        ref={header.ref}
        style={[
          styles.header,
          { opacity: header.opacity, transform: [{ translateY: header.translateY }] },
        ]}
      >
        <View style={styles.pill}>
          <Text style={styles.pillText}>Why AthliTech</Text>
        </View>

        <Text style={[styles.title, isNarrow ? styles.titleNarrow : styles.titleWide]}>
          The gap between{'\n'}
          <Text style={styles.titleAccent}>talent and results</Text>
          {'\n'}is data.
        </Text>

        <Text style={styles.subtitle}>
          Most athletes train hard. Few train smart. AthliTech bridges the gap between effort and outcome — giving coaches the tools to guide, and athletes the visibility to grow.
        </Text>
      </Animated.View>

      {/* Stats row */}
      <View style={[styles.statsRow, isNarrow ? styles.statsNarrow : styles.statsWide]}>
        {STATS.map((s, i) => (
          <Animated.View
            key={i}
            ref={statReveal[i].ref}
            style={[
              styles.statCard,
              isNarrow ? styles.statCardNarrow : styles.statCardWide,
              {
                opacity: statReveal[i].opacity,
                transform: [{ translateY: statReveal[i].translateY }],
              },
            ]}
          >
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Problem → Solution pairs */}
      <Animated.View
        ref={problemsReveal.ref}
        style={[
          styles.problemsContainer,
          {
            opacity: problemsReveal.opacity,
            transform: [{ translateY: problemsReveal.translateY }],
          },
        ]}
      >
        <Text style={styles.problemsLabel}>The old way → The AthliTech way</Text>
        <View style={[styles.problemsGrid, isNarrow ? styles.problemsGridNarrow : styles.problemsGridWide]}>
          {PROBLEMS.map((item, i) => (
            <View key={i} style={styles.problemCard}>
              {/* Icon */}
              <View style={styles.problemIconWrap}>
                <Text style={styles.problemIcon}>{item.icon}</Text>
              </View>
              {/* Before */}
              <View style={styles.problemBefore}>
                <View style={styles.problemBeforePill}>
                  <Text style={styles.problemBeforeText}>Before</Text>
                </View>
                <Text style={styles.problemTitle}>{item.problem}</Text>
              </View>
              {/* Arrow */}
              <Text style={styles.problemArrow}>→</Text>
              {/* After */}
              <View style={styles.problemAfter}>
                <View style={styles.problemAfterPill}>
                  <Text style={styles.problemAfterText}>After</Text>
                </View>
                <Text style={styles.problemSolution}>{item.solution}</Text>
              </View>
            </View>
          ))}
        </View>
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
  gridAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.025,
    // Subtle checkerboard via color
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    maxWidth: 680,
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
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  titleNarrow: { fontSize: 30, lineHeight: 40 },
  titleWide: { fontSize: 44, lineHeight: 56 },
  titleAccent: {
    color: colors.emerald,
  },
  subtitle: {
    color: colors.textSub,
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'center',
    maxWidth: 580,
  },

  // Stats
  statsRow: {
    marginBottom: 72,
    width: '100%',
    maxWidth: 900,
  },
  statsNarrow: {
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
  },
  statsWide: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  statCard: {
    backgroundColor: colors.emeraldDim || 'rgba(16,185,129,0.06)',
    borderColor: colors.emeraldGlow || 'rgba(16,185,129,0.18)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  statCardNarrow: { width: '100%', maxWidth: 360 },
  statCardWide: { flex: 1 },
  statValue: {
    color: colors.emerald,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 8,
  },
  statLabel: {
    color: colors.textSub,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 160,
  },

  // Problems
  problemsContainer: {
    width: '100%',
    maxWidth: 980,
    alignItems: 'center',
  },
  problemsLabel: {
    color: colors.textDimmed,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  problemsGrid: {
    width: '100%',
  },
  problemsGridNarrow: {
    flexDirection: 'column',
    gap: 16,
  },
  problemsGridWide: {
    flexDirection: 'row',
    gap: 16,
  },
  problemCard: {
    flex: 1,
    backgroundColor: colors.bgGlass || '#0f1928',
    borderColor: colors.borderSubtle || 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    gap: 10,
  },
  problemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.emeraldDim || 'rgba(16,185,129,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  problemIcon: { fontSize: 20 },
  problemBefore: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  problemBeforePill: {
    backgroundColor: colors.errorDim || 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  problemBeforeText: {
    color: colors.error,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  problemTitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  problemArrow: {
    color: colors.emeraldGlow || 'rgba(16,185,129,0.5)',
    fontSize: 18,
    fontWeight: '700',
  },
  problemAfter: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  problemAfterPill: {
    backgroundColor: colors.emeraldDim || 'rgba(16,185,129,0.12)',
    borderColor: colors.emeraldGlow || 'rgba(16,185,129,0.25)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
    flexShrink: 0,
  },
  problemAfterText: {
    color: colors.emerald,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  problemSolution: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
