import { Href, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { fetchRoleHubStatus, RoleHubStatusResponse } from '@/api/roleHub';
import { clearStoredToken, getStoredToken } from '@/constants/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import GridMotion from '@/components/animations/GridMotion';

import SplitText from '@/components/animations/SplitText';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { RADIUS, useThemeColors } from '@/styles/tokens';
import RoleCard from '../components/RoleCard';

import SubscriptionManagementModal, { WorkspaceRole } from '@/components/ui/SubscriptionManagementModal';
import { activateRole } from '@/api/roleHub';

export default function RoleHubScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const { statusData, refreshWorkspaceStatus, setCurrentWorkspace, clearWorkspaceState, isLoading } = useWorkspace();
  const [error, setError] = useState('');
  const [subModalRole, setSubModalRole] = useState<WorkspaceRole | null>(null);

  useEffect(() => {
    refreshWorkspaceStatus().catch((err) => {
      setError(err instanceof Error ? err.message : 'Unable to connect to AthliTech backend.');
    });
  }, [refreshWorkspaceStatus]);

  // Re-fetch status when window regain focus
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onFocus = () => refreshWorkspaceStatus();
      window.addEventListener('focus', onFocus);
      return () => window.removeEventListener('focus', onFocus);
    }
  }, [refreshWorkspaceStatus]);

  const handleLogout = async () => {
    clearWorkspaceState();
    await clearStoredToken();
    router.replace('/' as Href);
  };

  const handleReactivateRole = async (role: WorkspaceRole) => {
    try {
      await activateRole(role);
      await refreshWorkspaceStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to reactivate ${role} workspace.`);
    }
  };

  const isAthleteActive = statusData?.roles?.athlete?.active ?? false;
  const isCoachActive = statusData?.roles?.coach?.active ?? false;
  const isOrgActive = statusData?.roles?.organization?.active ?? false;

  return (
    <SafeAreaView style={styles.screen}>
      <GridMotion opacity={0.025} animDuration={28} zIndex={1} />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandName}>AthliTech</Text>
          <View style={styles.hubBadge}>
            <Text style={styles.hubBadgeText}>Role Hub</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {statusData?.email ? <Text style={styles.userEmailText}>{statusData.email}</Text> : null}
          <ThemeToggle />
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={18} color={colors.textMuted} />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          <SplitText
            text="Welcome to AthliTech Workspace"
            textStyle={styles.headingText}
            containerStyle={styles.headingContainer}
            initialDelay={100}
            staggerMs={40}
            duration={400}
          />
          <Text style={styles.subheading}>
            Select your active platform role or explore new capabilities to activate your specialized workspace.
          </Text>
        </View>

        {/* Error Box */}
        {error && !isLoading ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => { refreshWorkspaceStatus(); }} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Role Cards Grid */}
        <View style={[styles.grid, isWide ? styles.gridWide : styles.gridNarrow]}>
          
          {/* Card 1: Athlete */}
          <RoleCard
            type="athlete"
            isActive={isAthleteActive}
            roleInfo={statusData?.roles?.athlete ?? null}
            isLoading={isLoading}
            onOpenDashboard={() => setCurrentWorkspace('athlete')}
            onExploreRole={() => router.push({ pathname: '/explore-role', params: { role: 'athlete' } } as Href)}
            onReactivateWorkspace={() => handleReactivateRole('athlete')}
            onOpenManageSubscription={() => setSubModalRole('athlete')}
          />

          {/* Card 2: Coach */}
          <RoleCard
            type="coach"
            isActive={isCoachActive}
            roleInfo={statusData?.roles?.coach ?? null}
            isLoading={isLoading}
            onOpenDashboard={() => setCurrentWorkspace('coach')}
            onExploreRole={() => router.push({ pathname: '/explore-role', params: { role: 'coach' } } as Href)}
            onReactivateWorkspace={() => handleReactivateRole('coach')}
            onOpenManageSubscription={() => setSubModalRole('coach')}
          />

          {/* Card 3: Organization */}
          <RoleCard
            type="organization"
            isActive={isOrgActive}
            roleInfo={statusData?.roles?.organization ?? null}
            isLoading={isLoading}
            onOpenDashboard={() => setCurrentWorkspace('organization')}
            onExploreRole={() => router.push({ pathname: '/explore-role', params: { role: 'organization' } } as Href)}
            onReactivateWorkspace={() => handleReactivateRole('organization')}
            onOpenManageSubscription={() => setSubModalRole('organization')}
          />

        </View>
      </ScrollView>

      {/* Subscription Management Modal */}
      {subModalRole ? (
        <SubscriptionManagementModal
          visible={Boolean(subModalRole)}
          role={subModalRole}
          roleInfo={statusData?.roles?.[subModalRole] ?? null}
          onClose={() => setSubModalRole(null)}
          onStatusUpdated={() => refreshWorkspaceStatus()}
        />
      ) : null}
    </SafeAreaView>
  );
}


const getStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bgGlass,
      zIndex: 10,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    brandDot: {
      width: 10,
      height: 10,
      borderRadius: 99,
      backgroundColor: colors.emerald,
    },
    brandName: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    hubBadge: {
      backgroundColor: colors.emeraldDim,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.full,
    },
    hubBadgeText: {
      color: colors.emerald,
      fontSize: 12,
      fontWeight: '700',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    userEmailText: {
      color: colors.textMuted,
      fontSize: 13,
      display: Platform.OS === 'web' ? 'flex' : 'none',
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: RADIUS.sm,
    },
    logoutBtnText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },

    container: {
      padding: 24,
      paddingBottom: 60,
      alignItems: 'center',
    },
    bannerContainer: {
      width: '100%',
      maxWidth: 1150,
      marginBottom: 32,
      alignItems: 'flex-start',
    },
    headingContainer: {
      marginBottom: 8,
    },
    headingText: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.8,
    },
    subheading: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 24,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.errorDim,
      padding: 16,
      borderRadius: RADIUS.md,
      marginBottom: 24,
      width: '100%',
      maxWidth: 1150,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      flex: 1,
    },
    retryBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.error,
      borderRadius: RADIUS.sm,
    },
    retryBtnText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '700',
    },

    grid: {
      width: '100%',
      maxWidth: 1150,
      gap: 24,
    },
    gridWide: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    gridNarrow: {
      flexDirection: 'column',
    },
  });
