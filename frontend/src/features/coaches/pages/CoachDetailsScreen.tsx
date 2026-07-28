import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Athlete, Coach, User } from '@/api/admin';
import { fetchCoachAthletes, fetchCoachById, fetchUserById } from '@/api/admin';
import type { AuthUser } from '@/api/auth';
import { getStoredToken, fetchCurrentUser, clearStoredToken } from '@/api/auth';
import type { Workout } from '@/api/workout';
import { fetchCoachWorkouts } from '@/api/workout';
import type { PerformanceRecord } from '@/api/performance';
import { fetchAllPerformances } from '@/api/performance';
import { Ionicons } from '@expo/vector-icons';
import { UserDetails, ScreenContainer } from '@/components/ui';
import { useThemeColors } from '@/styles/tokens';

const isWeb = Platform.OS === 'web';

interface CoachDetailsScreenProps {
  user: AuthUser | null;
  token: string;
  onSignOut: () => void;
}

export default function CoachDetailsScreen({ user: propUser, token: propToken, onSignOut: propOnSignOut }: CoachDetailsScreenProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ coachId: string }>();
  
  const [user, setUser] = useState<AuthUser | null>(propUser);
  const [token, setToken] = useState<string | null>(propToken);
  const [isAuthLoading, setIsAuthLoading] = useState(!propUser || !propToken);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [coachUser, setCoachUser] = useState<User | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [performances, setPerformances] = useState<PerformanceRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const coachId = params.coachId;

  // Restore session from storage if not passed via props
  useEffect(() => {
    if (propUser && propToken) {
      return;
    }

    async function restoreSession() {
      try {
        const storedToken = await getStoredToken();
        if (!storedToken) {
          setIsAuthLoading(false);
          return;
        }
        const currentUser = await fetchCurrentUser(storedToken);
        setUser(currentUser);
        setToken(storedToken);
      } catch (err) {
        console.warn('Failed to restore session:', err);
      } finally {
        setIsAuthLoading(false);
      }
    }

    restoreSession();
  }, [propUser, propToken]);

  // Load coach details once token is available
  useEffect(() => {
    if (!coachId || !token) {
      return;
    }

    async function loadCoachDetails() {
      setIsLoading(true);
      setError(null);
      
      try {
        const coachData = await fetchCoachById(token as string, coachId);
        setCoach(coachData);

        const userPromise = fetchUserById(token as string, coachId).catch((err) => {
          console.warn('Failed to fetch user email details:', err);
          return null;
        });

        const resolvedCoachId = coachData.coach_id || coachData.id;

        setIsHistoryLoading(true);
        const [userData, athletesData, workoutsData, allPerformances] = await Promise.all([
          userPromise,
          fetchCoachAthletes(token as string, resolvedCoachId).catch((err) => {
            console.warn('Failed to fetch coach athletes:', err);
            return [];
          }),
          fetchCoachWorkouts(token as string, resolvedCoachId).catch((err) => {
            console.warn('Failed to fetch coach workouts:', err);
            return [];
          }),
          fetchAllPerformances(token as string).catch((err) => {
            console.warn('Failed to fetch all performances:', err);
            return [];
          }),
        ]);

        setCoachUser(userData);
        setAthletes(athletesData);
        setWorkouts(workoutsData);

        const coachPerfs = allPerformances.filter(
          (p) => p.coach_id === resolvedCoachId
        );
        setPerformances(coachPerfs);
        setIsHistoryLoading(false);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load coach details';
        console.warn('Error loading coach details:', e);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadCoachDetails();
  }, [coachId, token]);

  const handleSignOut = async () => {
    if (propOnSignOut) {
      propOnSignOut();
    } else {
      await clearStoredToken();
      router.replace('/');
    }
  };

  if (isAuthLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredStatus}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loaderText}>Restoring session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !token) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.centeredStatus}>
          <View style={[styles.header, { width: '100%', borderBottomWidth: 0, paddingHorizontal: 0 }]}>
            <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.bgMid }]}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Session Expired</Text>
            </View>
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            <Ionicons name="lock-closed-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>Session expired. Please log in again.</Text>
            <Pressable onPress={handleSignOut} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Go to Login</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false}>
      <UserDetails
        profile={{
          id: coach?.id || coachId || '',
          name: coach?.name || coachUser?.name || '',
          email: coachUser?.email || '',
          role: coachUser?.role || 'coach',
          status: 'ACTIVE',
        }}
        isLoading={isLoading}
        error={error}
        athletes={athletes}
        workouts={workouts}
        performances={performances}
        onBack={() => router.back()}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centeredStatus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 6,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 15,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#10b981',
    borderRadius: 6,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});