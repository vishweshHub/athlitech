import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title?: string;
  label?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  disabled?: boolean;
  prefix?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  disabled = false,
  prefix,
  style,
  textStyle,
}) => {
  const displayTitle = title || label || '';
  const activeLoading = isLoading || loading;
  const activeVariant = variant === 'ghost' ? 'outline' : variant;
  const isInteractionDisabled = disabled || activeLoading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[activeVariant],
        styles[`size_${size}`],
        isInteractionDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isInteractionDisabled}
      activeOpacity={0.8}
    >
      {activeLoading ? (
        <ActivityIndicator color={activeVariant === 'outline' ? '#38BDF8' : '#FFFFFF'} size="small" />
      ) : (
        <>
          {prefix}
          <Text style={[styles.text, styles[`text_${activeVariant}`], styles[`text_${size}`], textStyle]}>{displayTitle}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};



export default Button;


const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: '#0284C7',
  },
  secondary: {
    backgroundColor: '#334155',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  danger: {
    backgroundColor: '#EF4444',
  },
  disabled: {
    opacity: 0.5,
  },
  size_sm: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#F8FAFC',
  },
  text_outline: {
    color: '#38BDF8',
  },
  text_danger: {
    color: '#FFFFFF',
  },
  text_sm: {
    fontSize: 12,
  },
  text_md: {
    fontSize: 15,
  },
  text_lg: {
    fontSize: 18,
  },
});
