import { DARK_THEME, LIGHT_THEME, ThemeColors } from './colors';
import { SPACING, RADIUS, LAYOUT } from './spacing';
import { TYPOGRAPHY, FONT } from './typography';

export type ThemeType = 'light' | 'dark';

export interface AppTheme {
  type: ThemeType;
  colors: ThemeColors;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  layout: typeof LAYOUT;
  typography: typeof TYPOGRAPHY;
  font: typeof FONT;
}

export const darkTheme: AppTheme = {
  type: 'dark',
  colors: DARK_THEME,
  spacing: SPACING,
  radius: RADIUS,
  layout: LAYOUT,
  typography: TYPOGRAPHY,
  font: FONT,
};

export const lightTheme: AppTheme = {
  type: 'light',
  colors: LIGHT_THEME,
  spacing: SPACING,
  radius: RADIUS,
  layout: LAYOUT,
  typography: TYPOGRAPHY,
  font: FONT,
};
