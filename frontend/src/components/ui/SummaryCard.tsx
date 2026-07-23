import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Card from './Card';
import CounterNumber from '@/components/animations/CounterNumber';
import { StatsGrid, StatsGridItem } from './ResponsiveGrid';
import { useThemeColors } from '@/styles/tokens';

export interface SummaryMetric {
  label: string;
  value: number;
  suffix?: string;
}

interface SummaryCardProps {
  title: string;
  iconName: any;
  metrics: SummaryMetric[];
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export default function SummaryCard({
  title,
  iconName,
  metrics,
  delay = 0,
  style,
}: SummaryCardProps) {
  const colors = useThemeColors();

  return (
    <Card delay={delay} animated style={[{ width: '100%' }, style]}>
      <View style={styles.metricHeader}>
        <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>{title}</Text>
        <View style={[styles.iconWrapper, { backgroundColor: colors.infoDim }]}>
          <Ionicons name={iconName} size={20} color={colors.info} />
        </View>
      </View>
      
      <StatsGrid gap={12}>
        {metrics.map((metric, index) => (
          <StatsGridItem key={index} minWidth={120} style={[styles.derivedStatBox, { backgroundColor: colors.bgMid }]}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <CounterNumber
                target={metric.value}
                suffix={metric.suffix}
                duration={1500}
                delay={delay + (index * 100)}
                style={[styles.derivedStatVal, { color: colors.textPrimary }]}
                formatted
              />
            </View>
            <Text style={[styles.derivedStatLabel, { color: colors.textSub }]}>{metric.label}</Text>
          </StatsGridItem>
        ))}
      </StatsGrid>
    </Card>
  );
}

const styles = StyleSheet.create({
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  derivedStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  derivedStatBox: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  derivedStatVal: {
    fontSize: 24,
    fontWeight: '800',
  },
  derivedStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
