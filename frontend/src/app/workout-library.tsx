import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import WorkoutLibraryScreen from '@/features/workouts/pages/WorkoutLibraryScreen';
import type { AuthUser } from '@/api/auth';
import { getStoredToken, fetchCurrentUser, clearStoredToken } from '@/api/auth';

export default function WorkoutLibraryRoute() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const storedToken = await getStoredToken();
      if (!storedToken) {
        router.replace('/login');
        return;
      }
      try {
        const currentUser = await fetchCurrentUser(storedToken);
        setUser(currentUser);
        setToken(storedToken);
      } catch (err) {
        await clearStoredToken();
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  if (isLoading || !user || !token) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  return <WorkoutLibraryScreen token={token} userRole={user.role} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
