/**
 * AnimatedCard
 *
 * A ScrollReveal wrapper with a glass card surface treatment.
 * Use this as the base for all content cards across the app.
 *
 * Usage:
 *   <AnimatedCard delay={i * 80}>
 *     <Text>Card content</Text>
 *   </AnimatedCard>
 */

import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import ScrollReveal from '@/components/animations/ScrollReveal';
import { COLORS, RADIUS } from '@/styles/tokens';

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  /** If true, renders with the glass card background. Default: true */
  surface?: boolean;
}

export default function AnimatedCard({
  children,
  delay = 0,
  style,
  surface = true,
}: AnimatedCardProps) {
  return (
    <ScrollReveal
      delay={delay}
      duration={600}
      slideDistance={24}
      style={[surface && styles.card, style]}
    >
      {children}
    </ScrollReveal>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 24,
  },
});
