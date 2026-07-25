import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import { ThemeType, AppTheme, darkTheme, lightTheme } from './theme';

export function useTheme(): {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  colors: AppTheme['colors'];
  themeData: AppTheme;
} {
  const context = useContext(ThemeContext);

  if (!context) {
    // Fallback for outside of provider if needed
    return {
      theme: 'dark',
      setTheme: () => {},
      toggleTheme: () => {},
      colors: darkTheme.colors,
      themeData: darkTheme,
    };
  }

  const themeData = context.theme === 'light' ? lightTheme : darkTheme;

  return {
    theme: context.theme,
    setTheme: context.setTheme,
    toggleTheme: context.toggleTheme,
    colors: themeData.colors,
    themeData,
  };
}
