/**
 * Design tokens shared across the entire AthliTech UI.
 * Import from here — never hardcode brand values in components.
 */

export const COLORS = {
  // Backgrounds
  bg: '#060b14',
  bgMid: '#0a0f1a',
  bgCard: '#0d1525',
  bgGlass: 'rgba(13, 21, 37, 0.72)',

  // Borders
  border: 'rgba(255,255,255,0.07)',
  borderSubtle: 'rgba(255,255,255,0.04)',
  borderEmerald: 'rgba(16,185,129,0.2)',

  // Brand
  emerald: '#10b981',
  emeraldPressed: '#059669',
  emeraldDim: 'rgba(16,185,129,0.1)',
  emeraldGlow: 'rgba(16,185,129,0.18)',

  // Text
  textPrimary: '#f2f7ff',
  textSub: '#8a9ab5',
  textMuted: '#5c6e8a',
  textDimmed: '#3d5168',

  // Status
  error: '#ef4444',
  errorDim: 'rgba(239,68,68,0.1)',
  success: '#10b981',
  warning: '#f59e0b',
} as const;

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const SHADOW = {
  emerald: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const FONT = {
  heading: { fontWeight: '800' as const, letterSpacing: -1 },
  subheading: { fontWeight: '700' as const },
  label: { fontWeight: '600' as const, letterSpacing: 0.5 },
  body: { fontWeight: '400' as const, lineHeight: 26 },
} as const;

/** Duration presets (ms) */
export const DURATION = {
  fast: 200,
  normal: 400,
  slow: 600,
  verySlow: 900,
} as const;
