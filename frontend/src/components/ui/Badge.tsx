import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';

export type BadgeVariant = 'success' | 'warning' | 'info' | 'danger' | 'neutral' | 'error' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info', style, textStyle }) => {
  const activeVariant = variant === 'error' ? 'danger' : variant;
  return (
    <View style={[styles.base, styles[activeVariant], style]}>
      <Text style={[styles.text, styles[`text_${activeVariant}`], textStyle]}>{label}</Text>
    </View>
  );
};

export default Badge;

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.5)',
  },
  success: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  warning: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.5)',
  },
  info: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  danger: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  neutral: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.5)',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text_primary: {
    color: '#38BDF8',
  },
  text_success: {
    color: '#4ADE80',
  },
  text_warning: {
    color: '#FACC15',
  },
  text_info: {
    color: '#38BDF8',
  },
  text_danger: {
    color: '#F87171',
  },
  text_neutral: {
    color: '#CBD5E1',
  },
});
