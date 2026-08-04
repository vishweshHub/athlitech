import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SHADOW, useThemeColors } from '@/styles/tokens';
import { useWorkspace, WorkspaceRole } from '@/context/WorkspaceContext';

const WORKSPACE_META = {
  athlete: { label: 'Athlete Workspace', icon: 'fitness' as const, color: '#10B981' },
  coach: { label: 'Coach Platform', icon: 'clipboard' as const, color: '#3B82F6' },
  organization: { label: 'Organization Hub', icon: 'business' as const, color: '#8B5CF6' },
};

export default function WorkspaceSwitcher() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { currentWorkspace, activeRoles, setCurrentWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  const currentRole = currentWorkspace || activeRoles[0] || 'athlete';
  const meta = WORKSPACE_META[currentRole] || WORKSPACE_META.athlete;

  const handleSelectRole = (role: WorkspaceRole) => {
    setIsOpen(false);
    if (role !== currentWorkspace) {
      setCurrentWorkspace(role);
    }
  };

  const handleGoToRoleHub = () => {
    setIsOpen(false);
    router.push('/role-hub' as Href);
  };


  return (
    <View style={styles.container}>
      {/* Switcher Button */}
      <TouchableOpacity
        style={[styles.switcherBtn, { borderColor: colors.border }]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        <View style={[styles.badgeDot, { backgroundColor: meta.color }]} />
        <Ionicons name={meta.icon} size={16} color={meta.color} />
        <Text style={styles.switcherText}>{meta.label}</Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Dropdown Menu */}
      {isOpen && (
        <View style={styles.dropdownMenu}>
          <Text style={styles.menuHeader}>ACTIVATED WORKSPACES</Text>

          {activeRoles.length > 0 ? (
            activeRoles.map((role) => {
              const roleMeta = WORKSPACE_META[role] || WORKSPACE_META.athlete;
              const isSelected = role === currentWorkspace;


              return (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.menuItem,
                    isSelected && { backgroundColor: `${roleMeta.color}15` },
                  ]}
                  onPress={() => handleSelectRole(role)}
                >
                  <View style={[styles.itemDot, { backgroundColor: roleMeta.color }]} />
                  <Ionicons name={roleMeta.icon} size={16} color={roleMeta.color} />
                  <Text style={[styles.itemText, isSelected && { color: colors.textPrimary, fontWeight: '800' }]}>
                    {roleMeta.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={14} color={roleMeta.color} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No activated workspaces</Text>
          )}

          <View style={styles.menuDivider} />

          {/* Explore Role Hub Option */}
          <TouchableOpacity style={styles.exploreItem} onPress={handleGoToRoleHub}>
            <Ionicons name="add-circle-outline" size={18} color={colors.emerald} />
            <Text style={styles.exploreText}>Explore & Activate Roles</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      position: 'relative',
      zIndex: 99999,
    },
    switcherBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.bgGlass,
      borderWidth: 1,
      borderRadius: RADIUS.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    badgeDot: {
      width: 6,
      height: 6,
      borderRadius: 99,
    },
    switcherText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '700',
    },
    dropdownMenu: {
      position: 'absolute',
      top: 44,
      right: 0,
      minWidth: 240,
      backgroundColor: colors.bgGlass,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      padding: 8,
      gap: 4,
      zIndex: 99999,
      ...SHADOW.card,
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 20,
    },

    menuHeader: {
      color: colors.textDimmed,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: RADIUS.sm,
    },
    itemDot: {
      width: 6,
      height: 6,
      borderRadius: 99,
    },
    itemText: {
      color: colors.textSub,
      fontSize: 13,
      fontWeight: '600',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 12,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    exploreItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: RADIUS.sm,
      backgroundColor: colors.emeraldDim,
    },
    exploreText: {
      color: colors.emerald,
      fontSize: 13,
      fontWeight: '700',
    },
  });
