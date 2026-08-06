import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Platform } from 'react-native';
import { useEffect } from 'react';

import { ThemeProvider } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/useTheme';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import ThemeTransition from '@/components/animations/ThemeTransition';

function LayoutContent() {
  const { theme, colors } = useTheme();

  // Dynamically synchronize web root document background and theme attribute with active theme
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const bgColor = colors.bg;
      document.documentElement.style.backgroundColor = bgColor;
      document.body.style.backgroundColor = bgColor;
      document.documentElement.setAttribute('data-theme', theme);
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.backgroundColor = bgColor;
      }
    }
  }, [colors.bg, theme]);

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
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="landing" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="role-hub" options={{ headerShown: false }} />
          <Stack.Screen name="explore-role" options={{ headerShown: false }} />
          <Stack.Screen name="plan-selection" options={{ headerShown: false }} />
          <Stack.Screen name="mock-checkout" options={{ headerShown: false }} />
          <Stack.Screen name="plan-confirmation" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="coach-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="athlete-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="complete-profile" options={{ headerShown: false }} />
          <Stack.Screen name="workout-library" options={{ headerShown: false }} />
          <Stack.Screen name="coach-details" options={{ title: 'Coach Details' }} />
          <Stack.Screen name="athlete-details" options={{ title: 'Athlete Details' }} />
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
      let style = document.getElementById('global-web-root-styles') as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement('style');
        style.id = 'global-web-root-styles';
        document.head.appendChild(style);
      }
      style.innerHTML = `
        /* Root layout reset to eliminate default browser margins and white borders */
        html, body, #root, #root > div, [data-contents="true"] {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 100vh !important;
          box-sizing: border-box !important;
        }

        /* Default (Light Theme) Autofill Override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
          box-shadow: 0 0 0 1000px #ffffff inset !important;
          -webkit-text-fill-color: #0f172a !important;
          caret-color: #10b981 !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }

        /* Dark Theme Autofill Override */
        [data-theme="dark"] input:-webkit-autofill,
        [data-theme="dark"] input:-webkit-autofill:hover, 
        [data-theme="dark"] input:-webkit-autofill:focus, 
        [data-theme="dark"] input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #0d1525 inset !important;
          box-shadow: 0 0 0 1000px #0d1525 inset !important;
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
    }
  }, []);

  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <LayoutContent />
      </WorkspaceProvider>
    </ThemeProvider>
  );
}


