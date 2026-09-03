import React from 'react';
import { DimensionValue, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useThemeColors, RADIUS } from '@/styles/tokens';

interface TableProps {
  headers: string[];
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
  columnWidths?: DimensionValue[];
  style?: StyleProp<ViewStyle>;
}

export default function Table({ headers, data, renderRow, columnWidths, style }: TableProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.outer, { borderColor: colors.border }, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true} bounces={false}>
        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.headerRow, { backgroundColor: colors.bgMid, borderBottomColor: colors.border }]}>
            {headers.map((header, index) => {
              const widthStyle = columnWidths?.[index] !== undefined ? { width: columnWidths[index], flex: 0, minWidth: columnWidths[index] } : null;
              return (
                <View key={index} style={[styles.headerCell, widthStyle]}>
                  <Text style={[styles.headerText, { color: colors.textSub }]}>
                    {header}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Data Rows */}
          <View style={styles.body}>
            {data.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No records found.
                </Text>
              </View>
            ) : (
              data.map((item, index) => {
                const isEven = index % 2 === 0;
                const rowBg = isEven ? 'transparent' : colors.bgMid;

                return (
                  <View
                    key={index}
                    style={[
                      styles.row,
                      {
                        backgroundColor: rowBg,
                        borderBottomColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    {renderRow(item, index)}
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    width: '100%',
  },
  table: {
    flexDirection: 'column',
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  headerCell: {
    paddingHorizontal: 16,
    minWidth: 140,
    flex: 1,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
