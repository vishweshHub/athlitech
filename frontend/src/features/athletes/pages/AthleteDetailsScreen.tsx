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
  View
} from 'react-native';

import type { Athlete, Coach, User } from '@/api/admin';
import { fetchAthleteById, fetchCoachById, fetchUserById } from '@/api/admin';
import type { AuthUser } from '@/api/auth';
import { getStoredToken, fetchCurrentUser, clearStoredToken } from '@/api/auth';
import type { Workout } from '@/api/workout';
import { fetchAthleteWorkouts } from '@/api/workout';
import type { PerformanceRecord } from '@/api/performance';
import { fetchAthletePerformances, fetchAthletePerformanceLogs } from '@/api/performance';
import { Ionicons } from '@expo/vector-icons';
import { UserDetails, ScreenContainer } from '@/components/ui';
import { useThemeColors } from '@/styles/tokens';

const isWeb = Platform.OS === 'web';

interface AthleteDetailsScreenProps {
  user: AuthUser | null;
  token: string;
  onSignOut: () => void;
}

export default function AthleteDetailsScreen({ user: propUser, token: propToken, onSignOut: propOnSignOut }: AthleteDetailsScreenProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ athleteId: string }>();
  
  const [user, setUser] = useState<AuthUser | null>(propUser);
  const [token, setToken] = useState<string | null>(propToken);
  const [isAuthLoading, setIsAuthLoading] = useState(!propUser || !propToken);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [athleteUser, setAthleteUser] = useState<User | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [performances, setPerformances] = useState<PerformanceRecord[]>([]);
  const [performanceLogs, setPerformanceLogs] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const athleteId = params.athleteId;

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

  // Load athlete details once token is available
  useEffect(() => {
    if (!athleteId || !token) {
      return;
    }

    async function loadAthleteDetails() {
      setIsLoading(true);
      setError(null);
      setCoach(null);
      setIsCoachLoading(false);
      
      try {
        const athleteData = await fetchAthleteById(token as string, athleteId);
        setAthlete(athleteData);

        const results = await Promise.allSettled([
          fetchUserById(token as string, athleteId),
          fetchAthleteWorkouts(token as string, athleteId),
          fetchAthletePerformances(token as string, athleteId),
          fetchAthletePerformanceLogs(token as string, athleteId),
        ]);

        const [userRes, workoutsRes, perfsRes, logsRes] = results;

        const userData = userRes.status === 'fulfilled' ? userRes.value : null;
        const workoutsData = workoutsRes.status === 'fulfilled' ? workoutsRes.value : [];
        const performancesData = perfsRes.status === 'fulfilled' ? perfsRes.value : [];
        const performanceLogsData = logsRes.status === 'fulfilled' ? logsRes.value : [];

        const subErrors: string[] = [];
        if (workoutsRes.status === 'rejected') subErrors.push(`Workouts: ${workoutsRes.reason?.message}`);
        if (perfsRes.status === 'rejected') subErrors.push(`Performances: ${perfsRes.reason?.message}`);
        if (logsRes.status === 'rejected') subErrors.push(`Logs: ${logsRes.reason?.message}`);

        const targetCoachId = athleteData?.coach_id || userData?.coach_id;
        let coachData = null;
        if (targetCoachId) {
          try {
            coachData = await fetchCoachById(token as string, targetCoachId);
          } catch (cErr: any) {
            console.warn('Failed to fetch coach details:', cErr);
            subErrors.push(`Coach: ${cErr.message || 'Failed to load coach details'}`);
          }
        }

        setAthleteUser(userData);
        setCoach(coachData);
        setWorkouts(workoutsData);
        setPerformances(performancesData);
        setPerformanceLogs(performanceLogsData);
        setIsCoachLoading(false);
        setIsHistoryLoading(false);

        if (subErrors.length > 0) {
          setError(`Some athlete data could not be retrieved:\n${subErrors.join('\n')}`);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load athlete details';
        console.warn('Error loading athlete details:', e);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadAthleteDetails();
  }, [athleteId, token]);

  const handleSignOut = async () => {
    if (propOnSignOut) {
      propOnSignOut();
    } else {
      await clearStoredToken();
      router.replace('/login');
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
          id: athlete?.athlete_id || athleteId || '',
          name: athlete?.name || athleteUser?.name || '',
          email: athleteUser?.email || '',
          role: athleteUser?.role || 'athlete',
          sport: athlete?.sport,
          weight: athlete?.weight,
          status: 'ACTIVE',
        }}
        isLoading={isLoading}
        error={error}
        coach={coach}
        workouts={workouts}
        performances={performances}
        performanceLogs={performanceLogs}
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