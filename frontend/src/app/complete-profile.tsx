import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Pressable, Platform, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { getStoredToken, fetchCurrentUser, AuthUser } from '@/api/auth';
import { completeProfile, fetchMyProfile, AthleteProfilePayload, CoachProfilePayload } from '@/api/profile';
import {
  AthleteProfileForm,
  CoachProfileForm,
  AthleteProfileDetailsCard,
  CoachProfileDetailsCard,
} from '@/features/profile';
import { useThemeColors } from '@/styles/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const scheme = useColorScheme();
  const { currentWorkspace, setCurrentWorkspace, refreshWorkspaceStatus } = useWorkspace();


  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

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

        // Fetch existing profile to render details or prefill form
        const profile = await fetchMyProfile(storedToken).catch(() => null);
        if (profile) {
          setExistingProfile(profile);
        }
      } catch (err) {
        console.warn('Failed to load session or profile:', err);
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
      
      // Refresh current user session, workspace status, and profile data from backend
      const [updatedUser, updatedProfile] = await Promise.all([
        fetchCurrentUser(token),
        fetchMyProfile(token).catch(() => null),
        refreshWorkspaceStatus(),
      ]);
      setUser(updatedUser);
      if (updatedProfile) {
        setExistingProfile(updatedProfile);
      }

      // Exit edit mode and return to Profile Details view
      setIsEditing(false);

      // Show success modal/toast notification
      setShowSuccessToast(true);

      setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to save profile. Please try again.');
      setShowSuccessToast(false);
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
  const isProfileCompleted = Boolean(user.profile_completed || existingProfile?.profile_completed);
  const showDetailsPage = isProfileCompleted && !isEditing;

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

      {/* SUCCESS TOAST MODAL */}
      <Modal visible={showSuccessToast} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.toastContainer, { backgroundColor: colors.bgCard, borderColor: colors.borderEmerald }]}>
            <View style={[styles.toastIconWrapper, { backgroundColor: colors.emeraldDim }]}>
              <Ionicons name="checkmark-circle" size={40} color={colors.emerald} />
            </View>
            <Text style={[styles.toastTitle, { color: colors.textPrimary }]}>🎉 Profile saved successfully!</Text>
            <Text style={[styles.toastSub, { color: colors.textSub }]}>Your AthliTech profile details have been updated.</Text>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Row */}
        <View style={styles.navRow}>
          <Pressable
            onPress={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                setCurrentWorkspace(currentWorkspace || 'athlete');
              }

            }}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: pressed ? colors.bgMid : colors.bgCard, borderColor: colors.border },
            ]}
          >
            <Ionicons name="arrow-back" size={16} color={colors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
              {isEditing ? 'Cancel Editing' : 'Back to Dashboard'}
            </Text>
          </Pressable>

          <Text style={[styles.headerTag, { color: colors.emerald }]} numberOfLines={1}>
            {user.name} ({role?.toUpperCase()})
          </Text>
        </View>

        {/* ── PROFILE DETAILS VIEW (When Profile Completed & Not Editing) ── */}
        {showDetailsPage ? (
          role === 'coach' ? (
            <CoachProfileDetailsCard
              userName={user.name}
              userEmail={user.email}
              profile={existingProfile?.coach_data}
              onEdit={() => setIsEditing(true)}
            />
          ) : (
            <AthleteProfileDetailsCard
              userName={user.name}
              userEmail={user.email}
              profile={existingProfile?.athlete_data}
              onEdit={() => setIsEditing(true)}
            />
          )
        ) : (
          /* ── EDIT / ONBOARDING FORM VIEW ── */
          role === 'coach' ? (
            <CoachProfileForm
              onSubmit={handleProfileSubmit}
              isLoading={isSubmitting}
              error={error}
              initialData={existingProfile?.coach_data}
            />
          ) : (
            <AthleteProfileForm
              onSubmit={handleProfileSubmit}
              isLoading={isSubmitting}
              error={error}
              initialData={existingProfile?.athlete_data}
            />
          )
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    width: '100%',
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
    minWidth: 0,
    flexShrink: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  toastContainer: {
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  toastIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toastTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  toastSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
