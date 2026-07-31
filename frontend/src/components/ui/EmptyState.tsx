import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { useThemeColors } from '@/styles/tokens';

interface EmptyStateProps {
  title: string;
  message?: string;
  description?: string;
  actionLabel?: string;
  actionText?: string;
  onAction?: () => void;
  onActionPress?: () => void;
  icon?: React.ReactNode | string;
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
  const colors = useThemeColors();
  const displayMessage = message || description;
  const displayBtnLabel = actionLabel || actionText;
  const activeOnAction = onAction || onActionPress;

  const renderedIcon =
    typeof icon === 'string' ? (
      <Ionicons name={icon as any} size={44} color={colors.emerald} />
    ) : (
      icon
    );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {renderedIcon && <View style={styles.iconContainer}>{renderedIcon}</View>}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {displayMessage && <Text style={[styles.message, { color: colors.textSub }]}>{displayMessage}</Text>}
      {displayBtnLabel && activeOnAction && (
        <Button label={displayBtnLabel} onPress={activeOnAction} variant="primary" size="sm" style={styles.button} />
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
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 12,
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  button: {
    marginTop: 16,
  },
});
