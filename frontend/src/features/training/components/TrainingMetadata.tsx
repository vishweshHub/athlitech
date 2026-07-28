import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface TrainingMetadataProps {
  duration?: string;
  intensity?: string;
  dayType?: string;
  style?: ViewStyle;
}

export const TrainingMetadata: React.FC<TrainingMetadataProps> = ({
  duration,
  intensity,
  dayType,
  style,
}) => {
  const items = [
    duration ? `• ${duration}` : null,
    intensity ? `• ${intensity}` : dayType ? `• ${dayType}` : null,
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      {items.map((item, index) => (
        <Text key={index} style={styles.badgeText}>
          {item}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
});

export default TrainingMetadata;
