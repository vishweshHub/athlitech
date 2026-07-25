import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform, DimensionValue } from 'react-native';

interface GridProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}

/**
 * StatsGrid: Used for dashboard metrics, stat cards, and summary cards.
 * Items flex and expand to fill available horizontal space evenly.
 */
export function StatsGrid({ children, style, gap = 16 }: GridProps) {
  return (
    <View style={[styles.grid, { gap }, style]}>
      {children}
    </View>
  );
}

interface StatsGridItemProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  minWidth?: DimensionValue;
  flex?: number;
}

export function StatsGridItem({
  children,
  style,
  minWidth = 260,
  flex = 1,
}: StatsGridItemProps) {
  return (
    <View style={[{ minWidth, flex, flexGrow: flex }, style]}>
      {children}
    </View>
  );
}

/**
 * CollectionGrid: Used for lists of coaches, athletes, organizations, workouts, etc.
 * Cards maintain a consistent width (e.g. 300-340px), wrap naturally onto new rows,
 * and never stretch to fill leftover space.
 */
export function CollectionGrid({ children, style, gap = 16 }: GridProps) {
  return (
    <View style={[styles.grid, { gap }, style]}>
      {children}
    </View>
  );
}

interface CollectionGridItemProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Consistent card width (defaults to 320px) */
  itemWidth?: DimensionValue;
}

export function CollectionGridItem({
  children,
  style,
  itemWidth = 320,
}: CollectionGridItemProps) {
  return (
    <View style={[{ width: itemWidth, maxWidth: '100%', flexGrow: 0, flexShrink: 1 }, style]}>
      {children}
    </View>
  );
}

// Backward-compatible aliases
export const ResponsiveGrid = StatsGrid;
export const ResponsiveGridItem = StatsGridItem;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    width: '100%',
    ...Platform.select({
      default: {
        flexWrap: 'wrap',
      },
      web: {
        flexWrap: 'wrap',
      } as any,
    }),
  },
});
