/**
 * SplitText
 *
 * Renders a block of text as individually animated word tokens.
 * Each word fades in and slides up in sequence, creating a premium
 * "stagger reveal" effect used in Nike/Linear-style landing pages.
 *
 * Works on all platforms (native driver — transforms + opacity only).
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface SplitTextProps {
  /** The full text string to animate */
  text: string;
  /** Style applied to each word's Text element */
  textStyle?: TextStyle;
  /** Optional accent style applied to specific word indices */
  accentIndices?: number[];
  accentStyle?: TextStyle;
  /** Container style for the wrapping row */
  containerStyle?: ViewStyle;
  /** Delay before the first word starts (ms) */
  initialDelay?: number;
  /** Delay between each successive word (ms) */
  staggerMs?: number;
  /** Duration of each word's entrance animation (ms) */
  duration?: number;
  /** translateY start distance (px) */
  slideDistance?: number;
  /** Word separator — defaults to a single space rendered between words */
  wordGap?: number;
  /** If true, words wrap into multiple lines (default: true) */
  wrap?: boolean;
}

export default function SplitText({
  text,
  textStyle,
  accentIndices = [],
  accentStyle,
  containerStyle,
  initialDelay = 0,
  staggerMs = 90,
  duration = 580,
  slideDistance = 36,
  wordGap = 8,
  wrap = true,
}: SplitTextProps) {
  const words = text.split(' ').filter(Boolean);

  const anims = useRef(
    words.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(slideDistance),
    }))
  ).current;

  useEffect(() => {
    Animated.parallel(
      anims.flatMap((anim, i) => [
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration,
          delay: initialDelay + i * staggerMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration,
          delay: initialDelay + i * staggerMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View
      style={[
        styles.container,
        wrap && styles.wrap,
        containerStyle,
      ]}
    >
      {words.map((word, i) => (
        <Animated.View
          key={i}
          style={[
            styles.wordWrapper,
            { marginRight: wordGap },
            {
              opacity: anims[i].opacity,
              transform: [{ translateY: anims[i].translateY }],
            },
          ]}
        >
          <Text style={[textStyle, accentIndices.includes(i) && accentStyle]}>
            {word}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    overflow: 'hidden',
  },
  wrap: {
    flexWrap: 'wrap',
  },
  wordWrapper: {
    // Each word clips its own translateY travel area
    overflow: 'hidden',
  },
});
