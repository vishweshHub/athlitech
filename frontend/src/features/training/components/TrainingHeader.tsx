import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface TrainingHeaderProps {
  weekNumber?: number;
  dayName?: string;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export const TrainingHeader: React.FC<TrainingHeaderProps> = ({
  weekNumber,
  dayName,
  title,
  subtitle,
  style,
}) => {
  const metaText = [
    weekNumber ? `Week ${weekNumber}` : null,
    dayName || null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <View style={[styles.container, style]}>
      {metaText ? <Text style={styles.metaText}>{metaText}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 22,
  },
});

export default TrainingHeader;
