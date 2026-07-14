import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Card from './Card';
import CounterNumber from '@/components/animations/CounterNumber';
import { useThemeColors } from '@/styles/tokens';

interface StatCardProps {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export default function StatCard({
  value,
  prefix = '',
  suffix = '',
  label,
  trend,
  trendDirection = 'up',
  delay = 0,
  style,
}: StatCardProps) {
  const colors = useThemeColors();

  const trendColor = trendDirection === 'up' ? colors.success : colors.error;
  const trendIcon = trendDirection === 'up' ? 'arrow-up' : 'arrow-down';

  return (
    <Card delay={delay} animated style={[styles.card, style]}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.textSub }]}>{label}</Text>
        
        <View style={styles.metricRow}>
          <CounterNumber
            target={value}
            prefix={prefix}
            suffix={suffix}
            duration={1500}
            delay={delay + 100}
            style={[styles.value, { color: colors.emerald }]}
            formatted
          />

          {trend && (
            <View style={[styles.trendBadge, { backgroundColor: trendDirection === 'up' ? colors.emeraldDim : colors.errorDim }]}>
              <Ionicons name={trendIcon} size={12} color={trendColor} style={styles.trendIcon} />
              <Text style={[styles.trendText, { color: trendColor }]}>{trend}</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 200,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 4,
  },
  trendIcon: {
    marginRight: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
