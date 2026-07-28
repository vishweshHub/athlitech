import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useThemeColors, RADIUS } from '@/styles/tokens';

interface TrainingMetadataProps {
  duration?: string | number;
  intensity?: string;
  dayType?: string;
  estimatedDuration?: number;
  assignmentCount?: number;
  status?: string;
  style?: ViewStyle;
}

export const TrainingMetadata: React.FC<TrainingMetadataProps> = ({
  duration,
  intensity,
  dayType,
  estimatedDuration,
  assignmentCount,
  status,
  style,
}) => {
  const colors = useThemeColors();

  const estDur = duration || (estimatedDuration ? `${estimatedDuration} mins` : null);
  const items = [
    estDur ? `⏱ ${estDur}` : null,
    assignmentCount !== undefined ? `🏋️ ${assignmentCount} Exercises` : null,
    intensity ? `⚡ ${intensity}` : dayType ? `🏷 ${dayType}` : null,
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      {items.map((item, index) => (
        <Text
          key={index}
          style={[
            styles.badgeText,
            {
              color: colors.textPrimary,
              backgroundColor: colors.bgMid,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
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
    gap: 8,
    marginVertical: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
});

export default TrainingMetadata;
