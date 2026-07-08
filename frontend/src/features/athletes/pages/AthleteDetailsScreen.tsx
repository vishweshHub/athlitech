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

import type { Athlete, Coach } from '@/api/admin';
import { fetchAthleteById, fetchCoachById } from '@/api/admin';
import type { AuthUser } from '@/api/auth';
import { getStoredToken, fetchCurrentUser, clearStoredToken } from '@/api/auth';
import { Ionicons } from '@expo/vector-icons';

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
  const [coach, setCoach] = useState<Coach | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
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

        // Fetch coach details if athlete has a coach assigned
        if (athleteData.coach_id) {
          setIsCoachLoading(true);
          try {
            const coachData = await fetchCoachById(token as string, athleteData.coach_id);
            setCoach(coachData);
          } catch (coachError) {
            console.warn('Failed to fetch coach details:', coachError);
            // Coach details are optional, don't fail the whole page
          } finally {
            setIsCoachLoading(false);
          }
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
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Athlete Details</Text>
            <Text style={styles.headerSubtitle}>{user?.email || 'Admin'}</Text>
          </View>
        </View>

        {/* Sidebar Menu Button (for mobile) */}
        {!isWeb && (
          <Pressable 
            onPress={() => router.push('/dashboard')} 
            style={styles.menuButton}
          >
            <Ionicons name="home-outline" size={24} color="#0f172a" />
          </Pressable>
        )}

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loaderText}>Loading athlete details...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => router.back()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Go Back</Text>
              </Pressable>
            </View>
          ) : !athlete ? (
            <View style={styles.errorContainer}>
              <Ionicons name="person-outline" size={48} color="#94a3b8" />
              <Text style={styles.errorText}>Athlete not found</Text>
              <Pressable onPress={() => router.back()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Go Back</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Athlete Info Card */}
              <View style={styles.athleteInfoCard}>
                <View style={styles.athleteAvatar}>
                  <Text style={styles.avatarText}>
                    {athlete.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.athleteDetails}>
                  <Text style={styles.athleteName}>{athlete.name}</Text>
                  <Text style={styles.athleteSport}>{athlete.sport || 'No sport specified'}</Text>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Athlete ID</Text>
                      <Text style={styles.infoValue}>{athlete.athlete_id}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Weight</Text>
                      <Text style={styles.infoValue}>
                        {athlete.weight ? `${athlete.weight} kg` : 'Not specified'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Assigned Coach</Text>
                      <Text style={styles.infoValue}>
                        {isCoachLoading ? 'Loading...' : coach ? coach.name : 'No coach assigned'}
                      </Text>
                    </View>
                  </View>

                  {coach && (
                    <View style={styles.coachCard}>
                      <Text style={styles.coachCardTitle}>Coach Information</Text>
                      <View style={styles.coachInfoRow}>
                        <View style={styles.coachAvatarSmall}>
                          <Text style={styles.coachAvatarText}>
                            {coach.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.coachInfoDetails}>
                          <Text style={styles.coachName}>{coach.name}</Text>
                          <Text style={styles.coachEmail}>{coach.email}</Text>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{coach.role}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Additional Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile Information</Text>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={20} color="#647286" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Full Name</Text>
                      <Text style={styles.infoValue}>{athlete.name}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="fitness-outline" size={20} color="#647286" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Sport</Text>
                      <Text style={styles.infoValue}>{athlete.sport || 'Not specified'}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Ionicons name="scale-outline" size={20} color="#647286" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Weight</Text>
                      <Text style={styles.infoValue}>
                        {athlete.weight ? `${athlete.weight} kg` : 'Not specified'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Ionicons name="ribbon-outline" size={20} color="#647286" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Role</Text>
                      <Text style={styles.infoValue}>Athlete</Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  menuButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#647286',
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentInner: {
    padding: 24,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  loaderContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#647286',
    fontSize: 14,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
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
  centeredStatus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  athleteInfoCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 24,
    marginBottom: 24,
  },
  athleteAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  athleteDetails: {
    gap: 12,
  },
  athleteName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  athleteSport: {
    fontSize: 14,
    color: '#475569',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#647286',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  coachCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  coachCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  coachInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coachAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  coachInfoDetails: {
    flex: 1,
  },
  coachName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  coachEmail: {
    fontSize: 12,
    color: '#647286',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
  },
  infoContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
});