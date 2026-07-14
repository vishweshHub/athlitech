import { useContext, useEffect, useState } from 'react';
import { ThemeContext, getGlobalTheme, addGlobalThemeListener } from '@/context/ThemeContext';

export function useColorScheme() {
  const context = useContext(ThemeContext);
  const [theme, setTheme] = useState(context ? context.theme : getGlobalTheme());

  useEffect(() => {
    if (context) {
      setTheme(context.theme);
    } else {
      // Fallback subscription for components outside the provider tree
      setTheme(getGlobalTheme());
      return addGlobalThemeListener((newTheme) => {
        setTheme(newTheme);
      });
    }
  }, [context, context?.theme]);

  return theme;
}
