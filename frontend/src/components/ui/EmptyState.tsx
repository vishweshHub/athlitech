import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message?: string;
  description?: string;
  actionLabel?: string;
  actionText?: string;
  onAction?: () => void;
  onActionPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  description,
  actionLabel,
  actionText,
  onAction,
  onActionPress,
  icon,
  style,
}) => {
  const displayMessage = message || description;
  const displayBtnLabel = actionLabel || actionText;
  const activeOnAction = onAction || onActionPress;

  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {displayMessage && <Text style={styles.message}>{displayMessage}</Text>}
      {displayBtnLabel && activeOnAction && (
        <Button title={displayBtnLabel} onPress={activeOnAction} size="sm" style={styles.button} />
      )}
    </View>
  );
};


export default EmptyState;


const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 12,
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  button: {
    marginTop: 16,
  },
});
