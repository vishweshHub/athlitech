import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, RADIUS, SHADOW } from '@/styles/tokens';
import Button from './Button';

interface OnboardingBannerProps {
  title: string;
  description: string;
  buttonLabel: string;
  onAction: () => void;
  isVisible: boolean;
  onDismiss?: () => void;
}

export default function OnboardingBanner({
  title,
  description,
  buttonLabel,
  onAction,
  isVisible,
  onDismiss,
}: OnboardingBannerProps) {
  const colors = useThemeColors();

  if (!isVisible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.emeraldDim, borderColor: colors.emerald }]}>
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="sparkles" size={24} color={colors.emerald} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textSub }]}>{description}</Text>
        </View>
        
        {onDismiss && (
          <Pressable onPress={onDismiss} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      
      <View style={styles.actionRow}>
        <Button 
          label={buttonLabel} 
          onPress={onAction} 
          variant="primary" 
          style={styles.actionButton} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 24,
    ...SHADOW.emerald,
    shadowOpacity: 0.05,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  iconContainer: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  closeBtn: {
    padding: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    minWidth: 160,
  },
});
