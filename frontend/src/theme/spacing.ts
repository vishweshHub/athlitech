/**
 * Design tokens for layout and spacing.
 */

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const LAYOUT = {
  screenPadding: SPACING.md,
  maxWidth: 1200,
} as const;
