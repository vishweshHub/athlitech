/**
 * Design tokens for colors and themes.
 */

export const SHARED_COLORS = {
  emerald: '#10b981',
  emeraldPressed: '#059669',
  emeraldDim: 'rgba(16,185,129,0.1)',
  emeraldGlow: 'rgba(16,185,129,0.18)',
  
  error: '#ef4444',
  errorDim: 'rgba(239, 68, 68, 0.08)',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#0ea5e9',
  infoDim: 'rgba(14, 165, 233, 0.1)',
} as const;

export const DARK_THEME = {
  ...SHARED_COLORS,
  id: 'dark',
  // Backgrounds - Elite Night Training
  bg: '#060b14',
  bgMid: '#0a0f1a',
  bgCard: '#0d1525',
  bgGlass: 'rgba(13, 21, 37, 0.72)',
  bgGradientStart: '#02050a',
  bgGradientEnd: '#0a101d',

  // Borders
  border: 'rgba(255,255,255,0.07)',
  borderSubtle: 'rgba(255,255,255,0.04)',
  borderEmerald: 'rgba(16,185,129,0.2)',

  // Text
  textPrimary: '#f2f7ff',
  textSub: '#8a9ab5',
  textMuted: '#5c6e8a',
  textDimmed: '#3d5168',
  
  // Shadows & Interactive
  cardShadow: 'rgba(0, 0, 0, 0.5)',
  inputBg: 'rgba(255, 255, 255, 0.04)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  skeletonBg: 'rgba(255, 255, 255, 0.06)',
  skeletonHighlight: 'rgba(255, 255, 255, 0.12)',
  neutral: '#334155',
  neutralText: '#94a3b8',
  
  // Accents
  accentGlow: 'rgba(16, 185, 129, 0.3)', // Emerald glow
} as const;

export const LIGHT_THEME = {
  ...SHARED_COLORS,
  id: 'light',
  // Backgrounds - Morning Training
  bg: '#f8fafc',
  bgMid: '#f1f5f9',
  bgCard: '#ffffff',
  bgGlass: 'rgba(255, 255, 255, 0.8)',
  bgGradientStart: '#e0f2fe', // Sky blue start
  bgGradientEnd: '#f8fafc', // Warm white end

  // Borders
  border: 'rgba(15, 23, 42, 0.08)',
  borderSubtle: 'rgba(15, 23, 42, 0.04)',
  borderEmerald: 'rgba(16, 185, 129, 0.15)',

  // Text
  textPrimary: '#0f172a',
  textSub: '#475569',
  textMuted: '#64748b',
  textDimmed: '#94a3b8',

  // Shadows & Interactive
  cardShadow: 'rgba(0, 0, 0, 0.06)',
  inputBg: '#ffffff',
  inputBorder: '#e2e8f0',
  skeletonBg: '#e2e8f0',
  skeletonHighlight: '#cbd5e1',
  neutral: '#e2e8f0',
  neutralText: '#475569',
  
  // Accents
  accentGlow: 'rgba(2, 132, 199, 0.1)', // Subtle blue glow
} as const;

export type ThemeColors = {
  [K in keyof typeof DARK_THEME]: string;
};
