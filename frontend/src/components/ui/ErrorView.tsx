import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RetryButton } from './RetryButton';
import { RADIUS, useThemeColors } from '@/styles/tokens';

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  style,
}) => {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.errorDim,
          borderColor: 'rgba(239, 68, 68, 0.25)',
        },
        style,
      ]}
    >
      <View style={styles.iconBox}>
        <Ionicons name="alert-circle" size={28} color={colors.error} />
      </View>
      <Text style={[styles.title, { color: colors.error }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: colors.textSub }]}>{message}</Text>
      {onRetry && <RetryButton onRetry={onRetry} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    width: '100%',
  },
  iconBox: {
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 20,
  },
});
