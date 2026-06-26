import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  clearStoredToken,
  fetchCurrentUser,
  getStoredToken,
} from '@/services/auth';
import type { AuthUser } from '@/services/auth';

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const token = getStoredToken();

      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const currentUser = await fetchCurrentUser(token);
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (currentUserError) {
        clearStoredToken();
        if (isMounted) {
          setError(
            currentUserError instanceof Error ? currentUserError.message : 'Session expired.'
          );
          router.replace('/');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  function handleSignOut() {
    clearStoredToken();
    router.replace('/');
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredStatus}>
          <ActivityIndicator color="#1769aa" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>AthliTech</Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>

          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.buttonPressed : null]}>
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={styles.panel}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userMeta}>{user?.email}</Text>
          <Text style={styles.role}>{user?.role}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  centeredStatus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shell: {
    flex: 1,
    padding: 24,
  },
  header: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  brand: {
    color: '#1769aa',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  title: {
    color: '#102033',
    fontSize: 30,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#c7d5e5',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 16,
  },
  buttonPressed: {
    backgroundColor: '#e7eef7',
  },
  secondaryButtonText: {
    color: '#223046',
    fontSize: 14,
    fontWeight: '700',
  },
  panel: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dfe6ef',
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
  },
  label: {
    color: '#647286',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  userName: {
    color: '#102033',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  userMeta: {
    color: '#536174',
    fontSize: 16,
    marginBottom: 16,
  },
  role: {
    alignSelf: 'flex-start',
    backgroundColor: '#eaf4ee',
    borderColor: '#b7dec4',
    borderRadius: 6,
    borderWidth: 1,
    color: '#067647',
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  error: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    color: '#b42318',
    fontSize: 14,
    marginTop: 14,
  },
});
