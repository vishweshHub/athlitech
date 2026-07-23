import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Platform } from 'react-native';
import { useEffect } from 'react';

import { ThemeProvider } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/useTheme';
import ThemeTransition from '@/components/animations/ThemeTransition';

function LayoutContent() {
  const { theme } = useTheme();

  // Create transparent background for React Navigation so ThemeTransition shows through
  const navTheme = theme === 'dark' ? {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: 'transparent' }
  } : {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: 'transparent' }
  };

  return (
    <NavThemeProvider value={navTheme}>
      <ThemeTransition>
        <Stack screenOptions={{ 
          headerShown: false, 
          contentStyle: { backgroundColor: 'transparent' } 
        }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="coach-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="athlete-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="complete-profile" options={{ headerShown: false }} />
          <Stack.Screen name="coach-details" options={{ title: 'Coach Details' }} />
          <Stack.Screen name="athlete-details" options={{ title: 'Athlete Details' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="showcase" options={{ title: 'Component Showcase', headerShown: false }} />
        </Stack>
      </ThemeTransition>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.id = 'chrome-autofill-override';
      style.innerHTML = `
        /* Override Chrome Autofill Styles for glass theme inputs */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #0d1727 inset !important;
          -webkit-text-fill-color: #f2f7ff !important;
          caret-color: #10b981 !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }

        /* Global smooth theme transitions for all elements */
        * {
          transition: background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), 
                      border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), 
                      color 0.5s cubic-bezier(0.4, 0, 0.2, 1), 
                      box-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                      fill 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                      stroke 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
      `;
      document.head.appendChild(style);
      return () => {
        const el = document.getElementById('chrome-autofill-override');
        if (el) el.remove();
      };
    }
  }, []);

  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
}

