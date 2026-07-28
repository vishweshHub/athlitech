import React from 'react';
import { StyleSheet, View, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { useThemeColors } from '@/styles/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'flat' | 'elevated' | 'bordered';
  delay?: number;
  animated?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, variant = 'elevated' }) => {
  const colors = useThemeColors();

  const variantStyles: Record<string, ViewStyle> = {
    flat: {
      backgroundColor: colors.bgCard,
    },
    elevated: {
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    },
    bordered: {
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
  };

  const cardStyle = [styles.base, variantStyles[variant], style];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

export default Card;

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    padding: 16,
    marginVertical: 6,
  },
});
