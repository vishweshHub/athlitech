import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, useThemeColors } from '@/styles/tokens';
import { RoleStatusInfo, activateRole, deactivateRole } from '@/api/roleHub';

export type WorkspaceRole = 'athlete' | 'coach' | 'organization';

interface SubscriptionManagementModalProps {
  visible: boolean;
  role: WorkspaceRole;
  roleInfo: RoleStatusInfo | null;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const ROLE_TITLES: Record<WorkspaceRole, { name: string; icon: any; color: string; defaultPlan: string }> = {
  athlete: { name: 'Athlete Workspace', icon: 'fitness', color: '#10B981', defaultPlan: 'Athlete Pro' },
  coach: { name: 'Coach Platform', icon: 'clipboard', color: '#3B82F6', defaultPlan: 'Coach Elite' },
  organization: { name: 'Organization Hub', icon: 'business', color: '#8B5CF6', defaultPlan: 'Enterprise Tier' },
};

export default function SubscriptionManagementModal({
  visible,
  role,
  roleInfo,
  onClose,
  onStatusUpdated,
}: SubscriptionManagementModalProps) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const info = ROLE_TITLES[role];

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isActive = roleInfo?.active ?? false;
  const planTier = roleInfo?.plan_tier?.toUpperCase() || info.defaultPlan;
  const billingStatus = roleInfo?.billing_status || (isActive ? 'Active' : 'Cancelled');

  const handleCancelSubscription = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await deactivateRole(role);
      setConfirmCancel(false);
      onStatusUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await activateRole(role);
      onStatusUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: `${info.color}1A` }]}>
                <Ionicons name={info.icon} size={22} color={info.color} />
              </View>
              <View>
                <Text style={styles.title}>{info.name}</Text>
                <Text style={styles.subtitle}>Subscription & Billing Settings</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Details Section */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current Plan</Text>
              <View style={[styles.planBadge, { backgroundColor: `${info.color}20` }]}>
                <Text style={[styles.planBadgeText, { color: info.color }]}>{planTier}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Billing Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  isActive ? styles.statusActive : styles.statusCancelled,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    isActive ? styles.dotActive : styles.dotCancelled,
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    isActive ? styles.textActive : styles.textCancelled,
                  ]}
                >
                  {billingStatus}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data Preservation</Text>
              <Text style={styles.detailValue}>All historical metrics & data saved</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.footer}>
            {isActive ? (
              confirmCancel ? (
                <View style={styles.confirmWrap}>
                  <Text style={styles.confirmText}>
                    Cancel subscription? Your workspace will be deactivated but historical data remains safe.
                  </Text>
                  <View style={styles.confirmRow}>
                    <TouchableOpacity
                      style={styles.cancelConfirmBtn}
                      onPress={() => setConfirmCancel(false)}
                      disabled={isLoading}
                    >
                      <Text style={styles.cancelConfirmText}>Keep Subscription</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dangerConfirmBtn}
                      onPress={handleCancelSubscription}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.dangerConfirmText}>Confirm Cancellation</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancelSubscription}
                  disabled={isLoading}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity
                style={[styles.reactivateBtn, { backgroundColor: info.color }]}
                onPress={handleReactivateSubscription}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color="#FFF" />
                    <Text style={styles.reactivateBtnText}>Reactivate Workspace</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: colors.bgGlass,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      gap: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 12,
    },
    closeBtn: {
      padding: 6,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.errorDim,
      padding: 12,
      borderRadius: RADIUS.sm,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
    },
    detailsContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: RADIUS.md,
      padding: 16,
      gap: 14,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    detailLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    detailValue: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '600',
    },
    planBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.full,
    },
    planBadgeText: {
      fontSize: 12,
      fontWeight: '800',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.full,
    },
    statusActive: {
      backgroundColor: colors.emeraldDim,
    },
    statusCancelled: {
      backgroundColor: colors.errorDim,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 99,
    },
    dotActive: {
      backgroundColor: colors.emerald,
    },
    dotCancelled: {
      backgroundColor: colors.error,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
    },
    textActive: {
      color: colors.emerald,
    },
    textCancelled: {
      color: colors.error,
    },
    footer: {
      marginTop: 4,
    },
    cancelBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: colors.error,
      backgroundColor: colors.errorDim,
      paddingVertical: 12,
      borderRadius: RADIUS.md,
    },
    cancelBtnText: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '700',
    },
    confirmWrap: {
      gap: 12,
    },
    confirmText: {
      color: colors.textSub,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },
    confirmRow: {
      flexDirection: 'row',
      gap: 10,
    },
    cancelConfirmBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: RADIUS.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      alignItems: 'center',
    },
    cancelConfirmText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '700',
    },
    dangerConfirmBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: RADIUS.sm,
      backgroundColor: colors.error,
      alignItems: 'center',
    },
    dangerConfirmText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '700',
    },
    reactivateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: RADIUS.md,
    },
    reactivateBtnText: {
      color: '#FFF',
      fontSize: 13,
      fontWeight: '800',
    },
  });
