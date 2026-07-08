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

import type { Athlete, Coach } from '@/api/admin';
import { fetchCoachAthletes, fetchCoachById } from '@/api/admin';
import type { AuthUser } from '@/api/auth';
import { getStoredToken, fetchCurrentUser, clearStoredToken } from '@/api/auth';
import { Ionicons } from '@expo/vector-icons';

const isWeb = Platform.OS === 'web';

interface CoachDetailsScreenProps {
  user: AuthUser | null;
  token: string;
  onSignOut: () => void;
}

export default function CoachDetailsScreen({ user: propUser, token: propToken, onSignOut: propOnSignOut }: CoachDetailsScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ coachId: string }>();
  
  const [user, setUser] = useState<AuthUser | null>(propUser);
  const [token, setToken] = useState<string | null>(propToken);
  const [isAuthLoading, setIsAuthLoading] = useState(!propUser || !propToken);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
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

  // Load coach details once token is available
  useEffect(() => {
    if (!coachId || !token) {
      return;
    }

    async function loadCoachDetails() {
      setIsLoading(true);
      setError(null);
      
      try {
        const [coachData, athletesData] = await Promise.all([
          fetchCoachById(token as string, coachId),
          fetchCoachAthletes(token as string, coachId),
        ]);
        
        setCoach(coachData);
        setAthletes(athletesData);
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
            <Text style={styles.headerTitle}>Coach Details</Text>
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
              <Text style={styles.loaderText}>Loading coach details...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => router.back()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Go Back</Text>
              </Pressable>
            </View>
          ) : !coach ? (
            <View style={styles.errorContainer}>
              <Ionicons name="person-outline" size={48} color="#94a3b8" />
              <Text style={styles.errorText}>Coach not found</Text>
              <Pressable onPress={() => router.back()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Go Back</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Coach Info Card */}
              <View style={styles.coachInfoCard}>
                <View style={styles.coachAvatar}>
                  <Text style={styles.avatarText}>
                    {coach.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.coachDetails}>
                  <Text style={styles.coachName}>{coach.name}</Text>
                  <Text style={styles.coachEmail}>{coach.email}</Text>
                  <View style={styles.coachMetaRow}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{coach.role}</Text>
                    </View>
                    <Text style={styles.coachIdText}>ID: {coach.id}</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="people-outline" size={20} color="#3b82f6" />
                      <Text style={styles.statValue}>{athletes.length}</Text>
                      <Text style={styles.statLabel}>Assigned Athletes</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Assigned Athletes Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assigned Athletes ({athletes.length})</Text>
                
                {athletes.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="person-outline" size={48} color="#cbd5e1" />
                    <Text style={styles.emptyText}>No athletes assigned to this coach yet</Text>
                  </View>
                ) : (
                  <View style={styles.athletesList}>
                    {athletes.map((athlete) => (
                      <View key={athlete.athlete_id} style={styles.athleteCard}>
                        <View style={styles.athleteHeader}>
                          <View style={styles.athleteAvatar}>
                            <Text style={styles.avatarText}>
                              {athlete.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.athleteInfo}>
                            <Text style={styles.athleteName}>{athlete.name}</Text>
                            <Text style={styles.athleteSport}>{athlete.sport || 'No sport specified'}</Text>
                          </View>
                        </View>
                        <View style={styles.athleteFooter}>
                          <Text style={styles.athleteWeight}>
                            {athlete.weight ? `Weight: ${athlete.weight}` : 'Weight not specified'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
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
  coachInfoCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 24,
    marginBottom: 24,
  },
  coachAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  coachDetails: {
    gap: 8,
  },
  coachName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  coachEmail: {
    fontSize: 14,
    color: '#475569',
  },
  coachMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  coachIdText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#94a3b8',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#647286',
    fontWeight: '600',
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  emptyText: {
    color: '#647286',
    fontSize: 15,
    marginTop: 12,
  },
  athletesList: {
    gap: 12,
  },
  athleteCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  athleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  athleteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  athleteSport: {
    fontSize: 12,
    color: '#647286',
    marginTop: 2,
  },
  athleteFooter: {
    paddingTop: 12,
    borderTopColor: '#f1f5f9',
    borderTopWidth: 1,
  },
  athleteWeight: {
    fontSize: 13,
    color: '#475569',
  },
});