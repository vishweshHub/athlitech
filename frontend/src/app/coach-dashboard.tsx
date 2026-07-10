import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter, Href } from 'expo-router';
import CoachDashboardScreen from '@/features/coaches/pages/CoachDashboardScreen';
import type { AuthUser } from '@/api/auth';
import { getStoredToken, fetchCurrentUser, clearStoredToken } from '@/api/auth';

export default function CoachDashboardRoute() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        router.replace('/login');
        return;
      }
      try {
        const currentUser = await fetchCurrentUser(storedToken);
        if (currentUser.role !== 'coach') {
          router.replace('/dashboard');
          return;
        }
        setUser(currentUser);
        setToken(storedToken);
      } catch (err) {
        clearStoredToken();
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  const handleSignOut = () => {
    clearStoredToken();
    router.replace('/login');
  };

  if (isLoading || !user || !token) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return <CoachDashboardScreen user={user} token={token} onSignOut={handleSignOut} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});
