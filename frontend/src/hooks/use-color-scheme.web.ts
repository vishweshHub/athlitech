import { useContext, useEffect, useState } from 'react';
import { ThemeContext, getGlobalTheme, addGlobalThemeListener } from '@/context/ThemeContext';

export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const context = useContext(ThemeContext);
  const [theme, setTheme] = useState(context ? context.theme : getGlobalTheme());

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (context) {
      setTheme(context.theme);
    } else {
      setTheme(getGlobalTheme());
      return addGlobalThemeListener((newTheme) => {
        setTheme(newTheme);
      });
    }
  }, [context, context?.theme]);

  if (hasHydrated) {
    return theme;
  }
  
  return 'dark'; // Default to dark on web server pre-rendering to match primary landing
}
