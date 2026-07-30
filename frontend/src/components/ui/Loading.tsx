import React from 'react';
import { StyleSheet, View, ActivityIndicator, Text, ViewStyle } from 'react-native';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  size = 'large',
  color = '#38BDF8',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.text}>{message}</Text>}
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
    color: '#94A3B8',
  },
});
