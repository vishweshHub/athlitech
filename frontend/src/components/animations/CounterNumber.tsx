/**
 * CounterNumber
 *
 * Animates a numeric value from 0 (or a custom start) to a target number
 * when it enters the viewport. Supports suffixes like "k+", "%", "+".
 *
 * Web:    Triggers on IntersectionObserver.
 * Native: Triggers on mount.
 *
 * Usage:
 *   <CounterNumber target={10000} suffix="k+" duration={1800} />
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Text, TextStyle } from 'react-native';

interface CounterNumberProps {
  /** The final number to count to */
  target: number;
  /** Text appended after the number (e.g. "k+", "%") */
  suffix?: string;
  /** Text prepended before the number (e.g. "$") */
  prefix?: string;
  /** Animation duration in ms */
  duration?: number;
  /** Delay before counting starts (ms) */
  delay?: number;
  /** Style for the Text element */
  style?: TextStyle;
  /** If true, formats with locale separator (e.g. 10,000) */
  formatted?: boolean;
}

export default function CounterNumber({
  target,
  suffix = '',
  prefix = '',
  duration = 1600,
  delay = 0,
  style,
  formatted = false,
}: CounterNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animValue = useRef(new Animated.Value(0)).current;
  const containerRef = useRef<any>(null);
  const hasStarted = useRef(false);

  function startCounting() {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const listener = animValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });

    Animated.timing(animValue, {
      toValue: target,
      duration,
      delay,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false, // must be false for value listener
    }).start(() => {
      animValue.removeListener(listener);
      setDisplayValue(target);
    });
  }

  useEffect(() => {
    if (Platform.OS !== 'web') {
      startCounting();
      return;
    }

    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      startCounting();
      return;
    }

    const domNode =
      typeof node.getDOMNode === 'function' ? node.getDOMNode() : node;

    if (!domNode) {
      startCounting();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startCounting();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(domNode);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const label = formatted
    ? displayValue.toLocaleString()
    : String(displayValue);

  return (
    <Text ref={containerRef} style={style}>
      {prefix}
      {label}
      {suffix}
    </Text>
  );
}
