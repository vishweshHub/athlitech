import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { RetryButton } from './RetryButton';

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
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Error</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && <RetryButton onRetry={onRetry} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F87171',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 12,
  },
});
