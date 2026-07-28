import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Card } from './Card';

interface LoadingCardProps {
  height?: number;
  style?: ViewStyle;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ height = 100, style }) => {
  return (
    <Card style={[styles.container, { height }, style]}>
      <View style={styles.headerPlaceholder} />
      <View style={styles.bodyPlaceholder} />
      <View style={styles.footerPlaceholder} />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    opacity: 0.6,
  },
  headerPlaceholder: {
    height: 16,
    width: '60%',
    backgroundColor: '#334155',
    borderRadius: 4,
  },
  bodyPlaceholder: {
    height: 12,
    width: '90%',
    backgroundColor: '#334155',
    borderRadius: 4,
    marginVertical: 8,
  },
  footerPlaceholder: {
    height: 10,
    width: '40%',
    backgroundColor: '#334155',
    borderRadius: 4,
  },
});
