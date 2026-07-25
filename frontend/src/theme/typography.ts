/**
 * Design tokens for typography.
 */

export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 48,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const FONT = {
  heading: { fontWeight: TYPOGRAPHY.weights.extrabold, letterSpacing: -1 },
  subheading: { fontWeight: TYPOGRAPHY.weights.bold },
  label: { fontWeight: TYPOGRAPHY.weights.semibold, letterSpacing: 0.5 },
  body: { fontWeight: TYPOGRAPHY.weights.regular, lineHeight: 26 },
} as const;
