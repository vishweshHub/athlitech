import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ThemeType } from './theme';

const THEME_STORAGE_KEY = 'athlitech_theme_preference';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('dark'); // Default to dark theme

  useEffect(() => {
    // Hydrate theme from storage
    const loadTheme = async () => {
      try {
        let storedTheme: string | null = null;
        if (Platform.OS === 'web') {
          if (typeof localStorage !== 'undefined') {
            storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
          }
        } else {
          storedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        }

        if (storedTheme === 'light' || storedTheme === 'dark') {
          setThemeState(storedTheme);
        } else if (systemScheme) {
          // Fallback to system scheme if no stored preference
          setThemeState(systemScheme === 'light' ? 'light' : 'dark');
        }
      } catch (e) {
        console.warn('Failed to load theme preference:', e);
      }
    };
    loadTheme();
  }, [systemScheme]);

  const saveTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        }
      } else {
        await SecureStore.setItemAsync(THEME_STORAGE_KEY, newTheme);
      }
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    saveTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: saveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
