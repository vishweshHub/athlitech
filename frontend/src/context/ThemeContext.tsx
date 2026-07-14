import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

// Global state fallback to support non-React callers & initial values before context hydration
let globalTheme: ThemeType = 'dark';
const themeListeners: Set<(theme: ThemeType) => void> = new Set();

export function getGlobalTheme() {
  return globalTheme;
}

export function setGlobalTheme(theme: ThemeType) {
  globalTheme = theme;
  themeListeners.forEach((listener) => listener(theme));
}

export function addGlobalThemeListener(listener: (theme: ThemeType) => void) {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('dark'); // Default to AthliTech dark theme

  useEffect(() => {
    // Default to system color scheme if available
    const initial = systemScheme === 'light' ? 'light' : 'dark';
    setThemeState(initial);
    setGlobalTheme(initial);
  }, [systemScheme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    setGlobalTheme(next);
  };

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    setGlobalTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: globalTheme,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
}
