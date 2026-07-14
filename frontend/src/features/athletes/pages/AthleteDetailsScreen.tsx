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
import { fetchAthletePerformances } from '@/api/performance';
import { Ionicons } from '@expo/vector-icons';
import { UserDetails } from '@/components/ui';

const isWeb = Platform.OS === 'web';

interface AthleteDetailsScreenProps {
  user: AuthUser | null;
  token: string;
  onSignOut: () => void;
}

export default function AthleteDetailsScreen({ user: propUser, token: propToken, onSignOut: propOnSignOut }: AthleteDetailsScreenProps) {
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
        const storedToken = getStoredToken();
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

        const userPromise = fetchUserById(token as string, athleteId).catch((err) => {
          console.warn('Failed to fetch user email details:', err);
          return null;
        });

        setIsCoachLoading(true);
        setIsHistoryLoading(true);

        const coachPromise = athleteData.coach_id
          ? fetchCoachById(token as string, athleteData.coach_id).catch((err) => {
              console.warn('Failed to fetch coach details:', err);
              return null;
            })
          : Promise.resolve(null);

        const workoutsPromise = fetchAthleteWorkouts(token as string, athleteId).catch((err) => {
          console.warn('Failed to fetch athlete workouts:', err);
          return [];
        });

        const performancesPromise = fetchAthletePerformances(token as string, athleteId).catch((err) => {
          console.warn('Failed to fetch athlete performances:', err);
          return [];
        });

        const [userData, coachData, workoutsData, performancesData] = await Promise.all([
          userPromise,
          coachPromise,
          workoutsPromise,
          performancesPromise,
        ]);

        setAthleteUser(userData);
        setCoach(coachData);
        setWorkouts(workoutsData);
        setPerformances(performancesData);
        setIsCoachLoading(false);
        setIsHistoryLoading(false);
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

  const handleSignOut = () => {
    if (propOnSignOut) {
      propOnSignOut();
    } else {
      clearStoredToken();
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
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredStatus}>
          {/* Always show a Back button in the header so the user is never stuck */}
          <View style={[styles.header, { width: '100%', borderBottomWidth: 0, paddingHorizontal: 0 }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
            </Pressable>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Session Expired</Text>
            </View>
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            <Ionicons name="lock-closed-outline" size={48} color="#ef4444" />
            <Text style={styles.errorText}>Session expired. Please log in again.</Text>
            <Pressable onPress={handleSignOut} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Go to Login</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: '#060b14' }]}>
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
        onBack={() => router.back()}
      />
    </SafeAreaView>
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
    color: '#94a3b8',
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
    backgroundColor: '#1e293b',
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