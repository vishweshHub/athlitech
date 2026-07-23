import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Pressable, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { getStoredToken, fetchCurrentUser, AuthUser } from '@/api/auth';
import { completeProfile, AthleteProfilePayload, CoachProfilePayload } from '@/api/profile';
import { AthleteProfileForm, CoachProfileForm } from '@/features/profile';
import { useThemeColors } from '@/styles/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const scheme = useColorScheme();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initSession() {
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
        console.warn('Failed to load session:', err);
      } finally {
        setIsAuthLoading(false);
      }
    }
    initSession();
  }, []);

  const handleProfileSubmit = async (payload: AthleteProfilePayload | CoachProfilePayload) => {
    if (!token) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await completeProfile(token, payload);
      
      // Refresh current user session
      const updatedUser = await fetchCurrentUser(token);
      setUser(updatedUser);

      // Redirect to appropriate dashboard
      if (updatedUser.role === 'coach') {
        router.replace('/coach-dashboard');
      } else if (updatedUser.role === 'admin') {
        router.replace('/dashboard');
      } else {
        router.replace('/athlete-dashboard');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.emerald} />
          <Text style={[styles.loaderText, { color: colors.textSub }]}>Loading profile environment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !token) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.error }]}>Authentication Required</Text>
          <Text style={[styles.errorSub, { color: colors.textSub }]}>Please log in to complete your AthliTech profile.</Text>
          <Pressable onPress={() => router.replace('/login')} style={[styles.btn, { backgroundColor: colors.emerald }]}>
            <Text style={styles.btnText}>Go to Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const role = user.role?.toLowerCase();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]}>
      {Platform.OS === 'web' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: scheme === 'dark'
              ? 'radial-gradient(ellipse 80% 55% at 30% -10%, rgba(16,185,129,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 45% at 80% 100%, rgba(14,165,233,0.06) 0%, transparent 60%), linear-gradient(160deg, #060b14 0%, #0a0f1a 55%, #0d1525 100%)'
              : 'radial-gradient(ellipse 80% 55% at 30% -10%, rgba(16,185,129,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 45% at 80% 100%, rgba(14,165,233,0.04) 0%, transparent 60%), #f8fafc',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Row */}
        <View style={styles.navRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: pressed ? colors.bgMid : colors.bgCard, borderColor: colors.border },
            ]}
          >
            <Ionicons name="arrow-back" size={16} color={colors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13 }}>Back</Text>
          </Pressable>

          <Text style={[styles.headerTag, { color: colors.emerald }]}>
            Welcome, {user.name} ({role?.toUpperCase()})
          </Text>
        </View>

        {/* Dynamic Form based on User Role */}
        {role === 'coach' ? (
          <CoachProfileForm onSubmit={handleProfileSubmit} isLoading={isSubmitting} error={error} />
        ) : (
          <AthleteProfileForm onSubmit={handleProfileSubmit} isLoading={isSubmitting} error={error} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorSub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerTag: {
    fontSize: 13,
    fontWeight: '700',
  },
});
