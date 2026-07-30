import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useThemeColors } from '@/styles/tokens';

interface TrainingHeaderProps {
  weekNumber?: number;
  dayName?: string;
  title?: string;
  subtitle?: string;
  dateStr?: string;
  style?: ViewStyle;
}

export const TrainingHeader: React.FC<TrainingHeaderProps> = ({
  weekNumber,
  dayName,
  title = "Today's Training Schedule",
  subtitle = "View and execute assigned workout sessions for today",
  dateStr,
  style,
}) => {
  const colors = useThemeColors();

  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
    : undefined;

  const metaText = [
    weekNumber ? `Week ${weekNumber}` : null,
    dayName || formattedDate || null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <View style={[styles.container, style]}>
      {metaText ? <Text style={[styles.metaText, { color: colors.info }]}>{metaText}</Text> : null}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textSub }]}>{subtitle}</Text> : null}
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
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 22,
  },
});

export default TrainingHeader;
