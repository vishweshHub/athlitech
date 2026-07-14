import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Platform } from 'react-native';
import { useEffect } from 'react';

import { ThemeContextProvider } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

function LayoutContent() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="coach-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="athlete-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="coach-details" options={{ title: 'Coach Details' }} />
        <Stack.Screen name="athlete-details" options={{ title: 'Athlete Details' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="showcase" options={{ title: 'Component Showcase', headerShown: false }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
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
      `;
      document.head.appendChild(style);
      return () => {
        const el = document.getElementById('chrome-autofill-override');
        if (el) el.remove();
      };
    }
  }, []);

  return (
    <ThemeContextProvider>
      <LayoutContent />
    </ThemeContextProvider>
  );
}

