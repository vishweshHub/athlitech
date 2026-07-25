/**
 * WhoItsForSection
 *
 * Scroll Stack Section 3 — Who It's For
 * Athletes · Coaches · Sports Academies · Parents
 *
 * Premium persona cards with hover glow and border-glow effect.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useThemeColors } from '@/styles/tokens';

const PERSONAS = [
  {
    icon: '🏃',
    role: 'Athletes',
    headline: 'Own your performance journey.',
    body: 'Every workout, every metric, every piece of feedback — visible, structured, and yours. Stop guessing. Start growing.',
    color: '#10b981',
    colorDim: 'rgba(16,185,129,0.08)',
    colorBorder: 'rgba(16,185,129,0.2)',
    colorGlow: 'rgba(16,185,129,0.15)',
    tags: ['Training plans', 'Progress tracking', 'Coach feedback'],
  },
  {
    icon: '🎽',
    role: 'Coaches',
    headline: 'Coach smarter, not harder.',
    body: 'Design programs, monitor athletes, log performance, and provide structured feedback — all from one dashboard.',
    color: '#6366f1',
    colorDim: 'rgba(99,102,241,0.08)',
    colorBorder: 'rgba(99,102,241,0.2)',
    colorGlow: 'rgba(99,102,241,0.15)',
    tags: ['Workout builder', 'Athlete roster', 'Performance logs'],
  },
  {
    icon: '🏛️',
    role: 'Sports Academies',
    headline: 'Run your academy like a pro.',
    body: 'Multi-team management, role-based access, and organization-wide analytics — built for admins who demand clarity.',
    color: '#f59e0b',
    colorDim: 'rgba(245,158,11,0.08)',
    colorBorder: 'rgba(245,158,11,0.2)',
    colorGlow: 'rgba(245,158,11,0.15)',
    tags: ['Multi-team', 'Role management', 'Admin controls'],
  },
  {
    icon: '❤️',
    role: 'Parents',
    headline: 'Stay close to their progress.',
    body: 'Watch your child\'s journey unfold — their workouts, their growth, their wins. Transparent visibility into their athletic development.',
    color: '#ec4899',
    colorDim: 'rgba(236,72,153,0.08)',
    colorBorder: 'rgba(236,72,153,0.2)',
    colorGlow: 'rgba(236,72,153,0.15)',
    tags: ['Progress visibility', 'Training schedule', 'Coach updates'],
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
    if (Platform.OS !== 'web') { animate(); return; }
    const node = ref.current;
    if (!node) { animate(); return; }
    const domNode = typeof node.getDOMNode === 'function' ? node.getDOMNode() : node;
    if (!domNode || typeof IntersectionObserver === 'undefined') { animate(); return; }
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) { animate(); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    observer.observe(domNode);
    return () => observer.disconnect();
  }, []); // eslint-disable-line

  return { ref, opacity, translateY };
}

function PersonaCard({
  persona,
  revealAnim,
  cardWidth,
}: {
  persona: typeof PERSONAS[number];
  revealAnim: ReturnType<typeof useScrollReveal>;
  cardWidth: string | number;
}) {
  const [hovered, setHovered] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const colors = useThemeColors();
  const styles = getStyles(colors);

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: hovered ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [hovered]);

  const borderColorInterp = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [persona.colorBorder, persona.color],
  });

  const bgInterp = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [persona.colorDim, persona.colorGlow],
  });

  return (
    <Animated.View
      ref={revealAnim.ref}
      style={[
        styles.card,
        {
          width: cardWidth as any,
          borderColor: borderColorInterp,
          backgroundColor: bgInterp,
          opacity: revealAnim.opacity,
          transform: [{ translateY: revealAnim.translateY }],
        },
      ]}
    >
      <Pressable
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={styles.cardInner}
      >
        {/* Icon */}
        <View style={[styles.iconWrap, { borderColor: persona.colorBorder }]}>
          <Text style={styles.iconText}>{persona.icon}</Text>
        </View>

        {/* Role label */}
        <View style={[styles.rolePill, { backgroundColor: persona.colorDim, borderColor: persona.colorBorder }]}>
          <Text style={[styles.roleText, { color: persona.color }]}>{persona.role}</Text>
        </View>

        {/* Headline */}
        <Text style={[styles.headline, { color: persona.color }]}>{persona.headline}</Text>

        {/* Body */}
        <Text style={styles.body}>{persona.body}</Text>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {persona.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function WhoItsForSection() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 768;
  const isMid = width >= 768 && width < 1100;
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const header = useScrollReveal(0);
  const card0 = useScrollReveal(60);
  const card1 = useScrollReveal(140);
  const card2 = useScrollReveal(220);
  const card3 = useScrollReveal(300);
  const cardReveal = [card0, card1, card2, card3];

  const cardWidth = isNarrow ? '100%' : isMid ? '47%' : '22%';

  return (
    <View style={styles.section}>
      {/* Background glow accent */}
      <View style={styles.glowLeft} />
      <View style={styles.glowRight} />

      {/* Header */}
      <Animated.View
        ref={header.ref}
        style={[
          styles.header,
          { opacity: header.opacity, transform: [{ translateY: header.translateY }] },
        ]}
      >
        <View style={styles.pill}>
          <Text style={styles.pillText}>Who It's For</Text>
        </View>
        <Text style={[styles.title, isNarrow ? styles.titleNarrow : styles.titleWide]}>
          Built for every role{'\n'}
          <Text style={styles.titleAccent}>in the arena</Text>
        </Text>
        <Text style={styles.subtitle}>
          Whether you compete, coach, manage, or support — AthliTech has a space designed exactly for you.
        </Text>
      </Animated.View>

      {/* Persona cards */}
      <View style={[styles.cardsRow, isNarrow ? styles.cardsNarrow : isMid ? styles.cardsMid : styles.cardsWide]}>
        {PERSONAS.map((persona, i) => (
          <PersonaCard
            key={i}
            persona={persona}
            revealAnim={cardReveal[i]}
            cardWidth={cardWidth}
          />
        ))}
      </View>
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
  glowLeft: {
    position: 'absolute',
    top: 80,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(99,102,241,0.05)',
  },
  glowRight: {
    position: 'absolute',
    bottom: 80,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.05)',
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
  titleWide: { fontSize: 42, lineHeight: 54 },
  titleAccent: { color: colors.emerald },
  subtitle: {
    color: colors.textSub,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 500,
  },

  // Cards
  cardsRow: {
    width: '100%',
    maxWidth: 1200,
  },
  cardsNarrow: {
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
  },
  cardsMid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  cardsWide: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 240,
  },
  cardInner: {
    padding: 28,
    gap: 0,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: colors.inputBg || 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: { fontSize: 24 },
  rolePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 14,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.inputBg || 'rgba(255,255,255,0.06)',
    borderColor: colors.borderSubtle || 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: colors.textDimmed,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
