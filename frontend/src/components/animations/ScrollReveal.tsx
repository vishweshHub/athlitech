/**
 * ScrollReveal
 *
 * Wraps any children in a fade-up reveal that triggers when the element
 * enters the viewport.
 *
 * Web:    Uses IntersectionObserver (Baseline widely available).
 * Native: Triggers on mount after a configurable delay (simple, no scroll tracking).
 *
 * Usage:
 *   <ScrollReveal delay={200}>
 *     <Text>Reveals when scrolled into view</Text>
 *   </ScrollReveal>
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Extra delay before animation starts (ms) */
  delay?: number;
  /** Animation duration (ms) */
  duration?: number;
  /** translateY start distance (px) */
  slideDistance?: number;
  /** Optional style on the wrapping Animated.View */
  style?: StyleProp<ViewStyle>;
  /** Fraction of the element that must be visible to trigger (0–1) */
  threshold?: number;
}

export default function ScrollReveal({
  children,
  delay = 0,
  duration = 600,
  slideDistance = 28,
  style,
  threshold = 0.15,
}: ScrollRevealProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideDistance)).current;
  const containerRef = useRef<any>(null);
  const hasAnimated = useRef(false);

  function animate() {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // On native, simply animate in after mount + delay
      animate();
      return;
    }

    // Web: use IntersectionObserver
    const node = containerRef.current;
    if (!node) {
      animate();
      return;
    }

    // Get the underlying DOM node from RN Web's ref
    const domNode =
      typeof node.getDOMNode === 'function' ? node.getDOMNode() : node;

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
      { threshold }
    );

    observer.observe(domNode);

    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View
      ref={containerRef}
      style={[
        styles.base,
        style,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
  },
});
