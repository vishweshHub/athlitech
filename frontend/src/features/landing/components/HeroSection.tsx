import { Href, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
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

import GridMotion from '@/components/animations/GridMotion';
import CounterNumber from '@/components/animations/CounterNumber';

const LOGIN_ROUTE = '/login' as Href;
const REGISTER_ROUTE = '/register' as Href;

const STATS = [
  { value: 10, suffix: 'k+', label: 'Athletes' },
  { value: 500, suffix: '+', label: 'Coaches' },
  { value: 120, suffix: '+', label: 'Academies' },
  { value: 99, suffix: '.9%', label: 'Uptime' },
];

// ─── Split Text tokens ───────────────────────────────────────────────────────
// Each word is animated independently for the stagger reveal effect.
const LINE1 = [
  { text: 'Train', accent: false },
  { text: 'Smarter.', accent: false },
];
const LINE2 = [
  { text: 'Perform', accent: false },
  { text: 'Better.', accent: true },
];
const ALL_WORDS = [...LINE1, ...LINE2];
const WORD_COUNT = ALL_WORDS.length;

// ─── Animation timing ────────────────────────────────────────────────────────
const WORDS_START_DELAY = 180;
const WORD_STAGGER_MS = 95;
const WORD_DURATION = 580;
// When the last word finishes, we start fading in sub/cta/stats
const AFTER_WORDS_DELAY =
  WORDS_START_DELAY + (WORD_COUNT - 1) * WORD_STAGGER_MS + WORD_DURATION;

export default function HeroSection() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isNarrow = width < 768;

  // ── Animated values ────────────────────────────────────────────────────────
  const badgeFade = useRef(new Animated.Value(0)).current;
  const dotPulse = useRef(new Animated.Value(0.45)).current;

  const wordAnims = useRef(
    ALL_WORDS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(38),
    }))
  ).current;

  const subFade = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const statsFade = useRef(new Animated.Value(0)).current;

  // Magnetic CTA displacement
  const magnetX = useRef(new Animated.Value(0)).current;
  const magnetY = useRef(new Animated.Value(0)).current;

  // Cursor glow DOM ref (web only)
  const glowRef = useRef<any>(null);

  // ── Entrance animation sequence ────────────────────────────────────────────
  useEffect(() => {
    // Live dot pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotPulse, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // All entrance animations run in parallel with staggered delays
    Animated.parallel([
      // Badge
      Animated.timing(badgeFade, {
        toValue: 1,
        duration: 500,
        delay: 50,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      // Split text — each word slides up and fades in
      ...wordAnims.flatMap((anim, i) => [
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: WORD_DURATION,
          delay: WORDS_START_DELAY + i * WORD_STAGGER_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: WORD_DURATION,
          delay: WORDS_START_DELAY + i * WORD_STAGGER_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Subheadline
      Animated.timing(subFade, {
        toValue: 1,
        duration: 600,
        delay: AFTER_WORDS_DELAY,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      // CTA buttons
      Animated.timing(ctaFade, {
        toValue: 1,
        duration: 600,
        delay: AFTER_WORDS_DELAY + 110,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      // Stats strip
      Animated.timing(statsFade, {
        toValue: 1,
        duration: 600,
        delay: AFTER_WORDS_DELAY + 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cursor glow handlers (web only) ───────────────────────────────────────
  const handleMouseMove = Platform.OS === 'web'
    ? (e: any) => {
        if (!glowRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        glowRef.current.style.left = `${e.clientX - rect.left}px`;
        glowRef.current.style.top = `${e.clientY - rect.top}px`;
        glowRef.current.style.opacity = '1';
      }
    : undefined;

  const handleMouseLeave = Platform.OS === 'web'
    ? () => {
        if (glowRef.current) glowRef.current.style.opacity = '0';
      }
    : undefined;

  // ── Magnetic CTA handlers (web only) ──────────────────────────────────────
  const handleBtnMove = Platform.OS === 'web'
    ? (e: any) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width * 0.5)) * 0.38;
        const dy = (e.clientY - (rect.top + rect.height * 0.5)) * 0.38;
        Animated.spring(magnetX, {
          toValue: dx,
          useNativeDriver: true,
          tension: 220,
          friction: 11,
        }).start();
        Animated.spring(magnetY, {
          toValue: dy,
          useNativeDriver: true,
          tension: 220,
          friction: 11,
        }).start();
      }
    : undefined;

  const handleBtnLeave = Platform.OS === 'web'
    ? () => {
        Animated.spring(magnetX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 220,
          friction: 11,
        }).start();
        Animated.spring(magnetY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 220,
          friction: 11,
        }).start();
      }
    : undefined;

  return (
    <View
      style={styles.section}
      // @ts-ignore — web mouse events, not in RN types
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── GridMotion animated background (web only) ─────────────────── */}
      <GridMotion opacity={0.028} cellSize={76} animDuration={24} zIndex={1} />

      {/* ── Gradient background (web only) ────────────────────────────────── */}
      {Platform.OS === 'web' &&
        React.createElement('div', {
          'aria-hidden': true,
          style: {
            position: 'absolute',
            inset: 0,
            background: [
              'radial-gradient(ellipse 85% 55% at 50% -8%, rgba(16,185,129,0.20) 0%, transparent 62%)',
              'radial-gradient(ellipse 55% 45% at 92% 88%, rgba(14,165,233,0.08) 0%, transparent 60%)',
              'radial-gradient(ellipse 40% 35% at 8% 80%, rgba(124,58,237,0.06) 0%, transparent 55%)',
              'linear-gradient(175deg, #060b14 0%, #080e1a 40%, #0c1424 100%)',
            ].join(', '),
            pointerEvents: 'none',
            zIndex: 0,
          },
        })}

      {/* ── Engineering grid (web only) ───────────────────────────────────── */}
      {Platform.OS === 'web' &&
        React.createElement('div', {
          'aria-hidden': true,
          style: {
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '76px 76px',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.65) 12%, rgba(0,0,0,0.65) 88%, transparent 100%)',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.65) 12%, rgba(0,0,0,0.65) 88%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          },
        })}

      {/* ── Cursor glow (web only) ────────────────────────────────────────── */}
      {Platform.OS === 'web' &&
        React.createElement('div', {
          ref: glowRef,
          'aria-hidden': true,
          style: {
            position: 'absolute',
            width: 440,
            height: 440,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(16,185,129,0.14) 0%, rgba(16,185,129,0.05) 40%, transparent 72%)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            transition: 'opacity 0.5s ease',
            opacity: 0,
            zIndex: 2,
            left: '50%',
            top: '50%',
            willChange: 'left, top',
          },
        })}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.content,
          isNarrow ? styles.contentNarrow : styles.contentWide,
        ]}
      >
        {/* Badge */}
        <Animated.View style={[styles.badge, { opacity: badgeFade }]}>
          <Animated.View style={[styles.badgeDot, { opacity: dotPulse }]} />
          <Text style={styles.badgeText}>SPORTS PERFORMANCE PLATFORM</Text>
        </Animated.View>

        {/* Headline — Line 1: "Train Smarter." */}
        <View
          style={[
            styles.headlineRow,
            isNarrow && styles.headlineRowNarrow,
          ]}
        >
          {LINE1.map((word, i) => (
            <Animated.View
              key={`l1-${i}`}
              style={{
                opacity: wordAnims[i].opacity,
                transform: [{ translateY: wordAnims[i].translateY }],
              }}
            >
              <Text
                style={[
                  styles.headline,
                  isNarrow ? styles.headlineNarrow : styles.headlineWide,
                  { marginRight: isNarrow ? 10 : 16 },
                ]}
              >
                {word.text}
              </Text>
            </Animated.View>
          ))}
        </View>

        {/* Headline — Line 2: "Perform Better." */}
        <View
          style={[
            styles.headlineRow,
            isNarrow && styles.headlineRowNarrow,
            styles.headlineLine2,
          ]}
        >
          {LINE2.map((word, i) => {
            const idx = LINE1.length + i;
            return (
              <Animated.View
                key={`l2-${i}`}
                style={{
                  opacity: wordAnims[idx].opacity,
                  transform: [{ translateY: wordAnims[idx].translateY }],
                }}
              >
                <Text
                  style={[
                    styles.headline,
                    isNarrow ? styles.headlineNarrow : styles.headlineWide,
                    word.accent && styles.headlineAccent,
                    { marginRight: isNarrow ? 10 : 16 },
                  ]}
                >
                  {word.text}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        {/* Subheadline */}
        <Animated.Text
          style={[
            styles.subheadline,
            isNarrow ? styles.subNarrow : styles.subWide,
            { opacity: subFade },
          ]}
        >
          AthliTech connects athletes, coaches, and academies on a single
          platform —{'\n'}real-time tracking, intelligent insights, and
          data-driven coaching.
        </Animated.Text>

        {/* CTA Buttons */}
        <Animated.View
          style={[
            styles.ctaRow,
            isNarrow ? styles.ctaRowNarrow : styles.ctaRowWide,
            { opacity: ctaFade },
          ]}
        >
          {/* ── Magnetic primary CTA ───── */}
          <Animated.View
            style={{
              transform: [
                { translateX: magnetX },
                { translateY: magnetY },
              ],
            }}
          >
            <Pressable
              id="hero-cta-primary"
              onPress={() => router.push(REGISTER_ROUTE)}
              style={({ pressed }) => [
                styles.ctaPrimary,
                pressed && styles.ctaPrimaryPressed,
              ]}
              // @ts-ignore — web mouse events
              onMouseMove={handleBtnMove}
              onMouseLeave={handleBtnLeave}
            >
              <Text style={styles.ctaPrimaryText}>Get Started Free</Text>
              <Text style={styles.ctaArrow}> →</Text>
            </Pressable>
          </Animated.View>

          {/* ── Ghost secondary CTA ───── */}
          <Pressable
            id="hero-cta-secondary"
            onPress={() => router.push(LOGIN_ROUTE)}
            style={({ pressed }) => [
              styles.ctaSecondary,
              pressed && styles.ctaSecondaryPressed,
            ]}
          >
            <Text style={styles.ctaSecondaryText}>Sign In</Text>
          </Pressable>
        </Animated.View>

        {/* Stats strip — numbers animate via CounterNumber */}
        <Animated.View
          style={[
            styles.statsRow,
            isNarrow ? styles.statsRowNarrow : styles.statsRowWide,
            { opacity: statsFade },
          ]}
        >
          {STATS.map((stat, i) => (
            <View
              key={i}
              style={[
                styles.statItem,
                i < STATS.length - 1 && styles.statItemBorder,
              ]}
            >
              <CounterNumber
                target={stat.value}
                suffix={stat.suffix}
                duration={1800}
                delay={i * 150}
                style={styles.statNumber}
              />
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Layout ────────────────────────────────────────────────────────────────
  section: {
    backgroundColor: '#060b14',
    minHeight: 700,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120, // extra clearance for floating DockNav
    paddingBottom: 80,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    // zIndex 3 so it sits above gradient (0), grid (1), glow (2)
    zIndex: 3,
    width: '100%',
  },
  contentNarrow: {
    alignItems: 'flex-start',
  },
  contentWide: {
    maxWidth: 860,
    alignItems: 'center',
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.07)',
    borderColor: 'rgba(16,185,129,0.18)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginBottom: 40,
    gap: 9,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#10b981',
  },
  badgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },

  // ── Headline (split-text container) ──────────────────────────────────────
  headlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'baseline',
    // Clip the translateY travel so words don't bleed above the row
    overflow: 'hidden',
  },
  headlineRowNarrow: {
    justifyContent: 'flex-start',
  },
  headlineLine2: {
    marginBottom: 34,
  },
  headline: {
    color: '#f2f7ff',
    fontWeight: '900',
    letterSpacing: -2,
  },
  headlineNarrow: {
    fontSize: 40,
    lineHeight: 50,
    letterSpacing: -1.2,
  },
  headlineWide: {
    fontSize: 68,
    lineHeight: 78,
    letterSpacing: -2.5,
  },
  headlineAccent: {
    // Emerald for "Better."
    color: '#10b981',
  },

  // ── Subheadline ───────────────────────────────────────────────────────────
  subheadline: {
    color: '#5c6e8a',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 44,
    maxWidth: 560,
  },
  subNarrow: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'left',
    maxWidth: '100%',
  },
  subWide: {
    fontSize: 18,
  },

  // ── CTA Row ───────────────────────────────────────────────────────────────
  ctaRow: {
    marginBottom: 56,
    gap: 14,
  },
  ctaRowNarrow: {
    flexDirection: 'column',
    width: '100%',
    alignItems: 'stretch',
  },
  ctaRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Primary CTA — emerald with deep glow
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 34,
    paddingVertical: 17,
    gap: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  ctaPrimaryPressed: {
    backgroundColor: '#059669',
    shadowOpacity: 0.25,
  },
  ctaPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  ctaArrow: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },

  // Secondary CTA — ghost
  ctaSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 34,
    paddingVertical: 17,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  ctaSecondaryPressed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  ctaSecondaryText: {
    color: '#7a8fa8',
    fontSize: 16,
    fontWeight: '600',
  },

  // ── Stats strip ───────────────────────────────────────────────────────────
  statsRow: {
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
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
    paddingHorizontal: 36,
    paddingVertical: 22,
  },
  statItemBorder: {
    borderRightColor: 'rgba(255,255,255,0.05)',
    borderRightWidth: 1,
  },
  statNumber: {
    color: '#10b981',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 5,
    letterSpacing: -0.5,
  },
  statLabel: {
    color: '#3d5168',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
