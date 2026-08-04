import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import CoachDashboardScreen from '@/features/coaches/pages/CoachDashboardScreen';
import type { AuthUser } from '@/api/auth';
import { getStoredToken, fetchCurrentUser, clearStoredToken } from '@/api/auth';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function CoachDashboardRoute() {
  const router = useRouter();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspace();
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




  const handleSignOut = async () => {
    await clearStoredToken();
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
    backgroundColor: 'transparent',
  },
});
