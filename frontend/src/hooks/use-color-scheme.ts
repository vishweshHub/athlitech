import { useTheme } from '@/theme/useTheme';

export function useColorScheme() {
  const { theme } = useTheme();
  return theme;
}
