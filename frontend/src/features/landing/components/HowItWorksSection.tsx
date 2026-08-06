/**
 * HowItWorksSection (Polished UI & Interactive Timeline)
 *
 * Story-driven athlete journey section detailing AthliTech's dual support
 * for independent and coach-guided development.
 *
 * Polished Features:
 * - 100% Uniform Card Heights, Spacing, and Footer Alignment across all layout breakpoints
 * - Title wrapping capped cleanly at max 2 lines
 * - Premium Web/Mobile Card Hover Interactions (soft border glow, elevation, outer glow, icon micro-scaling)
 * - Interactive Timeline Sync (hovering a card highlights its milestone node & connects progress line)
 * - Viewport entrance timeline drawing & sequential staggered card reveals
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors, RADIUS, SHADOW } from '@/styles/tokens';

const JOURNEY_STEPS = [
  {
    step: '01',
    title: 'Create Your Profile',
    desc: 'Join AthliTech and personalize your training experience.',
    iconName: 'person-add-outline' as const,
    accentColor: '#10b981',
    accentDim: 'rgba(16, 185, 129, 0.12)',
    accentBorder: 'rgba(16, 185, 129, 0.25)',
    accentGlow: 'rgba(16, 185, 129, 0.35)',
    tag: 'ONBOARDING',
  },
  {
    step: '02',
    title: 'Choose Your Training Path',
    desc: 'Train independently using your own workouts and workout library, or connect with a coach for personalized guidance.',
    iconName: 'git-branch-outline' as const,
    accentColor: '#6366f1',
    accentDim: 'rgba(99, 102, 241, 0.12)',
    accentBorder: 'rgba(99, 102, 241, 0.25)',
    accentGlow: 'rgba(99, 102, 241, 0.35)',
    tag: 'FLEXIBLE PATH',
    pathPills: ['Self-Guided', 'Coach-Led'],
  },
  {
    step: '03',
    title: 'Train Consistently',
    desc: 'Complete your workouts, stay disciplined, and build consistency toward your goals.',
    iconName: 'fitness-outline' as const,
    accentColor: '#0ea5e9',
    accentDim: 'rgba(14, 165, 233, 0.12)',
    accentBorder: 'rgba(14, 165, 233, 0.25)',
    accentGlow: 'rgba(14, 165, 233, 0.35)',
    tag: 'ACTION & DISCIPLINE',
    pathPills: ['Self Workouts', 'Assigned Plans'],
  },
  {
    step: '04',
    title: 'Track Every Session',
    desc: 'Record your performance, monitor improvements, and build a complete history of your athletic progress.',
    iconName: 'stats-chart-outline' as const,
    accentColor: '#f59e0b',
    accentDim: 'rgba(245, 158, 11, 0.12)',
    accentBorder: 'rgba(245, 158, 11, 0.25)',
    accentGlow: 'rgba(245, 158, 11, 0.35)',
    tag: 'DATA & METRICS',
  },
  {
    step: '05',
    title: 'Learn & Improve',
    desc: 'Review your progress over time while coaches can provide guidance and feedback whenever you\'re connected.',
    iconName: 'sparkles-outline' as const,
    accentColor: '#ec4899',
    accentDim: 'rgba(236, 72, 153, 0.12)',
    accentBorder: 'rgba(236, 72, 153, 0.25)',
    accentGlow: 'rgba(236, 72, 153, 0.35)',
    tag: 'CONTINUOUS FEEDBACK',
    pathPills: ['Self Review', 'Optional Coaching'],
  },
  {
    step: '06',
    title: 'Keep Growing',
    desc: 'Every workout, every session, and every improvement moves you closer to becoming a better athlete.',
    iconName: 'trophy-outline' as const,
    accentColor: '#10b981',
    accentDim: 'rgba(16, 185, 129, 0.12)',
    accentBorder: 'rgba(16, 185, 129, 0.25)',
    accentGlow: 'rgba(16, 185, 129, 0.35)',
    tag: 'ATHLETIC MASTERY',
  },
];

/** Scroll reveal hook for viewport entrance */
function useScrollReveal(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(32)).current;
  const ref = useRef<any>(null);
  const hasAnimated = useRef(false);

  function animate() {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
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
    if (!node) {
      animate();
      return;
    }
    const domNode = typeof node.getDOMNode === 'function' ? node.getDOMNode() : node;
    if (!domNode || typeof IntersectionObserver === 'undefined') {
      animate();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(domNode);
    return () => observer.disconnect();
  }, []);

  return { ref, opacity, translateY, animate };
}

interface JourneyCardProps {
  step: typeof JOURNEY_STEPS[number];
  index: number;
  revealAnim: ReturnType<typeof useScrollReveal>;
  cardWidth: string | number;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

/** Uniform, Interactive Timeline Card */
function JourneyCard({
  step,
  revealAnim,
  cardWidth,
  isHovered,
  onHoverStart,
  onHoverEnd,
}: JourneyCardProps) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const hoverAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(hoverAnim, {
        toValue: isHovered ? 1 : 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.spring(iconAnim, {
        toValue: isHovered ? 1 : 0,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isHovered]);

  const translateYInterp = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const borderColorInterp = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [step.accentBorder, step.accentColor],
  });

  const bgInterp = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.bgCard || '#ffffff', colors.bgCard || '#ffffff'],
  });

  const iconScaleInterp = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.16],
  });

  const iconRotateInterp = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '8deg'],
  });

  return (
    <Animated.View
      ref={revealAnim.ref}
      style={[
        styles.gridCardWrapper,
        {
          width: cardWidth as any,
          opacity: revealAnim.opacity,
          transform: [{ translateY: revealAnim.translateY }],
        },
      ]}
    >
      <Pressable
        onHoverIn={onHoverStart}
        onHoverOut={onHoverEnd}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={[
            styles.card,
            Platform.OS === 'web'
              ? ({
                  transition:
                    'border-color 0.25s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease',
                } as any)
              : null,
            {
              borderColor: borderColorInterp,
              backgroundColor: bgInterp,
              transform: [{ translateY: translateYInterp }],
              ...(isHovered && Platform.OS === 'web'
                ? {
                    boxShadow: `0 12px 28px -6px ${step.accentGlow}, 0 4px 12px ${step.accentDim}`,
                  }
                : {}),
            },
          ]}
        >
          {/* Top Accent Indicator */}
          <View style={[styles.cardTopAccent, { backgroundColor: step.accentColor }]} />

          {/* Upper Section: Step Badge & Tag */}
          <View style={styles.cardHeaderRow}>
            <View style={[styles.stepNumBadge, { backgroundColor: step.accentDim, borderColor: step.accentBorder }]}>
              <Text style={[styles.stepNumText, { color: step.accentColor }]}>{step.step}</Text>
            </View>

            <View style={styles.cardTagPill}>
              <Text style={styles.cardTagText}>{step.tag}</Text>
            </View>
          </View>

          {/* Middle Content Section: Icon & Title & Description */}
          <View style={styles.cardMiddleSection}>
            <View style={styles.cardTitleRow}>
              <Animated.View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: step.accentDim,
                    transform: [{ scale: iconScaleInterp }, { rotate: iconRotateInterp }],
                  },
                ]}
              >
                <Ionicons name={step.iconName} size={20} color={step.accentColor} />
              </Animated.View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {step.title}
              </Text>
            </View>

            <Text style={styles.cardDesc}>{step.desc}</Text>
          </View>

          {/* Bottom Footer Section: Standardized Path Pills or Structural Spacer */}
          <View style={styles.cardFooterSection}>
            {step.pathPills ? (
              <View style={styles.pathPillContainer}>
                {step.pathPills.map((pill, pillIdx) => (
                  <View
                    key={pillIdx}
                    style={[styles.pathPill, { borderColor: step.accentBorder, backgroundColor: step.accentDim }]}
                  >
                    <Ionicons
                      name={pillIdx === 0 ? 'person-outline' : 'people-outline'}
                      size={10.5}
                      color={step.accentColor}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.pathPillText, { color: colors.textPrimary }]}>{pill}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.pathPillSpacer} />
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function HowItWorksSection() {
  const { width } = useWindowDimensions();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Layout breakpoints
  const isDesktopWide = width >= 1180;
  const isDesktop = width >= 900 && width < 1180;
  const isTablet = width >= 600 && width < 900;
  const isMobile = width < 600;

  // Entrance reveals
  const header = useScrollReveal(0);
  const step0 = useScrollReveal(0);
  const step1 = useScrollReveal(80);
  const step2 = useScrollReveal(160);
  const step3 = useScrollReveal(240);
  const step4 = useScrollReveal(320);
  const step5 = useScrollReveal(400);
  const stepReveals = [step0, step1, step2, step3, step4, step5];

  // Animated Timeline Line Progress
  const lineProgressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(lineProgressAnim, {
      toValue: 1,
      duration: 1200,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  // Card Width per Breakpoint
  let numCols = 1;
  let cardWidth: string | number = '100%';
  if (isDesktopWide) {
    numCols = 6;
    cardWidth = '16.666%';
  } else if (isDesktop) {
    numCols = 3;
    cardWidth = '33.333%';
  } else if (isTablet) {
    numCols = 2;
    cardWidth = '50%';
  }

  return (
    <View style={styles.section}>
      {/* Subtle Background Glow */}
      <View style={styles.ambientGlow} />

      {/* Header */}
      <Animated.View
        ref={header.ref}
        style={[
          styles.header,
          {
            opacity: header.opacity,
            transform: [{ translateY: header.translateY }],
          },
        ]}
      >
        <View style={styles.headerBadge}>
          <Ionicons name="sparkles" size={13} color={colors.emerald} style={{ marginRight: 6 }} />
          <Text style={styles.headerBadgeText}>ATHLETE JOURNEY</Text>
        </View>

        <Text style={[styles.title, isMobile ? styles.titleMobile : styles.titleDesktop]}>
          Your Journey to{' '}
          <Text style={styles.titleAccent}>Better Performance</Text>
        </Text>

        <Text style={styles.subtitle}>
          AthliTech adapts to every athlete's journey—from independent training to coach-guided development—helping you train smarter, track progress, and continuously improve.
        </Text>
      </Animated.View>

      {/* Interactive Horizontal Timeline Track for Desktop Wide */}
      {isDesktopWide && (
        <View style={styles.desktopTimelineTrack}>
          {/* Base Background Track Line */}
          <View style={styles.desktopTrackBaseLine} />

          {/* Animated Connecting Line */}
          <Animated.View
            style={[
              styles.desktopTrackActiveLine,
              Platform.OS === 'web'
                ? ({ transition: 'background-color 0.3s ease' } as any)
                : null,
              {
                width: lineProgressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor:
                  hoveredIndex !== null ? JOURNEY_STEPS[hoveredIndex].accentColor : colors.emerald,
              },
            ]}
          />

          {/* Interactive Milestone Nodes */}
          {JOURNEY_STEPS.map((step, idx) => {
            const isNodeActive = hoveredIndex === idx;
            const isPassed = hoveredIndex !== null && idx <= hoveredIndex;
            return (
              <View
                key={idx}
                style={[
                  styles.desktopNodeCircle,
                  Platform.OS === 'web'
                    ? ({
                        transition:
                          'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s ease, border-color 0.25s ease',
                      } as any)
                    : null,
                  {
                    backgroundColor: isPassed ? step.accentColor : colors.bgCard || '#ffffff',
                    borderColor: isNodeActive ? step.accentColor : step.accentBorder,
                    transform: [{ scale: isNodeActive ? 1.25 : 1 }],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.desktopNodeText,
                    { color: isPassed ? '#ffffff' : isNodeActive ? step.accentColor : colors.textMuted },
                  ]}
                >
                  {step.step}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Timeline Grid / Row */}
      <View style={isMobile ? styles.verticalTimelineContainer : styles.gridContainer}>
        {/* Mobile Vertical Connected Line */}
        {isMobile && (
          <Animated.View
            style={[
              styles.mobileTimelineLine,
              {
                height: lineProgressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        )}

        {JOURNEY_STEPS.map((step, i) => {
          const reveal = stepReveals[i];
          const isHovered = hoveredIndex === i;

          return isMobile ? (
            <View key={i} style={styles.mobileStepRow}>
              {/* Mobile Timeline Milestone Dot */}
              <View
                style={[
                  styles.mobileNodeCircle,
                  {
                    backgroundColor: isHovered ? step.accentColor : step.accentDim,
                    borderColor: step.accentBorder,
                  },
                ]}
              >
                <Ionicons
                  name={step.iconName}
                  size={15}
                  color={isHovered ? '#ffffff' : step.accentColor}
                />
              </View>

              <JourneyCard
                step={step}
                index={i}
                revealAnim={reveal}
                cardWidth="100%"
                isHovered={isHovered}
                onHoverStart={() => setHoveredIndex(i)}
                onHoverEnd={() => setHoveredIndex(null)}
              />
            </View>
          ) : (
            <JourneyCard
              key={i}
              step={step}
              index={i}
              revealAnim={reveal}
              cardWidth={cardWidth}
              isHovered={isHovered}
              onHoverStart={() => setHoveredIndex(i)}
              onHoverEnd={() => setHoveredIndex(null)}
            />
          );
        })}
      </View>

      {/* Closing Statement */}
      <Animated.View style={styles.footerNote}>
        <View style={styles.footerLine} />
        <View style={styles.footerBadge}>
          <Ionicons name="sparkles" size={14} color={colors.emerald} style={{ marginRight: 6 }} />
          <Text style={styles.footerText}>
            Built to adapt to how you train — independently or coached.
          </Text>
        </View>
        <View style={styles.footerLine} />
      </Animated.View>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    section: {
      backgroundColor: 'transparent',
      paddingVertical: 72,
      paddingHorizontal: 20,
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
    },
    ambientGlow: {
      position: 'absolute',
      top: -100,
      left: '50%',
      transform: [{ translateX: -180 }],
      width: 360,
      height: 360,
      borderRadius: 999,
      backgroundColor: colors.emeraldDim || 'rgba(16,185,129,0.06)',
      pointerEvents: 'none',
    },

    // Header
    header: {
      alignItems: 'center',
      maxWidth: 720,
      marginBottom: 44,
      width: '100%',
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.emeraldDim || 'rgba(16,185,129,0.12)',
      borderColor: colors.emeraldGlow || 'rgba(16,185,129,0.28)',
      borderWidth: 1,
      borderRadius: RADIUS.full,
      paddingHorizontal: 14,
      paddingVertical: 5,
      marginBottom: 18,
    },
    headerBadgeText: {
      color: colors.emerald,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    title: {
      color: colors.textPrimary,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 14,
      letterSpacing: -0.6,
    },
    titleMobile: { fontSize: 26, lineHeight: 36 },
    titleDesktop: { fontSize: 38, lineHeight: 48 },
    titleAccent: { color: colors.emerald },
    subtitle: {
      color: colors.textSub,
      fontSize: 15,
      lineHeight: 25,
      textAlign: 'center',
      maxWidth: 620,
    },

    // Desktop Horizontal Interactive Timeline Track
    desktopTimelineTrack: {
      width: '100%',
      maxWidth: 1180,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      marginBottom: 28,
      paddingHorizontal: 36,
    },
    desktopTrackBaseLine: {
      position: 'absolute',
      left: 60,
      right: 60,
      top: 15,
      height: 2,
      backgroundColor: colors.borderSubtle || 'rgba(255,255,255,0.08)',
      zIndex: 0,
    },
    desktopTrackActiveLine: {
      position: 'absolute',
      left: 60,
      top: 15,
      height: 2,
      zIndex: 1,
    },
    desktopNodeCircle: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.full,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      ...SHADOW.card,
    },
    desktopNodeText: {
      fontSize: 11,
      fontWeight: '800',
    },

    // Grid Container
    gridContainer: {
      width: '100%',
      maxWidth: 1180,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginHorizontal: -8,
    },
    gridCardWrapper: {
      padding: 8,
      display: 'flex',
    },

    // Mobile Vertical Timeline
    verticalTimelineContainer: {
      width: '100%',
      maxWidth: 540,
      position: 'relative',
      paddingLeft: 36,
    },
    mobileTimelineLine: {
      position: 'absolute',
      left: 17,
      top: 20,
      width: 2,
      backgroundColor: colors.emerald,
      zIndex: 0,
    },
    mobileStepRow: {
      position: 'relative',
      marginBottom: 16,
    },
    mobileNodeCircle: {
      position: 'absolute',
      left: -36,
      top: 14,
      width: 32,
      height: 32,
      borderRadius: RADIUS.full,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },

    // Uniform Card Architecture
    card: {
      flex: 1,
      minHeight: 235,
      backgroundColor: colors.bgCard || '#ffffff',
      borderWidth: 1,
      borderRadius: RADIUS.lg,
      padding: 18,
      position: 'relative',
      overflow: 'hidden',
      justifyContent: 'space-between',
      ...SHADOW.card,
    },
    cardTopAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      opacity: 0.9,
    },

    // Upper Section: Badge & Tag
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    stepNumBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
    },
    stepNumText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    cardTagPill: {
      backgroundColor: colors.borderSubtle || 'rgba(255,255,255,0.05)',
      borderRadius: RADIUS.xs,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    cardTagText: {
      color: colors.textMuted,
      fontSize: 9.5,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },

    // Middle Content Section
    cardMiddleSection: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    iconBox: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 15.5,
      lineHeight: 21,
      fontWeight: '700',
      flex: 1,
      letterSpacing: -0.2,
    },
    cardDesc: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },

    // Footer Section
    cardFooterSection: {
      marginTop: 12,
      justifyContent: 'flex-end',
    },
    pathPillContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle || 'rgba(255,255,255,0.06)',
    },
    pathPillSpacer: {
      height: 25,
      borderTopWidth: 1,
      borderTopColor: 'transparent',
    },
    pathPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: RADIUS.full,
      borderWidth: 1,
    },
    pathPillText: {
      fontSize: 10,
      fontWeight: '600',
    },

    // Footer Note
    footerNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginTop: 44,
      maxWidth: 680,
      width: '100%',
    },
    footerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.borderSubtle || 'rgba(255,255,255,0.08)',
    },
    footerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.emeraldDim || 'rgba(16,185,129,0.08)',
      borderColor: colors.emeraldGlow || 'rgba(16,185,129,0.2)',
      borderWidth: 1,
      borderRadius: RADIUS.full,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    footerText: {
      color: colors.textSub,
      fontSize: 12.5,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
