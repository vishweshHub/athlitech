import React from 'react';
import { StyleSheet, View, ActivityIndicator, Text, ViewStyle } from 'react-native';
import { useThemeColors } from '@/styles/tokens';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  size = 'large',
  color,
  style,
}) => {
  const colors = useThemeColors();
  const activeColor = color || colors.emerald;

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={activeColor} />
      {message && <Text style={[styles.text, { color: colors.textMuted }]}>{message}</Text>}
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 10,
    fontSize: 14,
  },
});
