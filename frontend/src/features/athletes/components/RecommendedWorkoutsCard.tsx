import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Badge, StatsGrid, StatsGridItem } from '@/components/ui';
import { useThemeColors, RADIUS } from '@/styles/tokens';
import { WorkoutRecommendation } from '@/api/profile';

interface RecommendedWorkoutsCardProps {
  recommendations: WorkoutRecommendation[];
}

export default function RecommendedWorkoutsCard({ recommendations }: RecommendedWorkoutsCardProps) {
  const colors = useThemeColors();

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <Card style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.emeraldDim }]}>
          <Ionicons name="sparkles-outline" size={20} color={colors.emerald} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Personalized Workout Recommendations
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSub }]}>
            Rule-based workout suggestions matched to your completed sport & event profile.
          </Text>
        </View>
      </View>

      <StatsGrid gap={12}>
        {recommendations.map((item, index) => (
          <StatsGridItem key={index} minWidth={260}>
            <View style={[styles.itemCard, { backgroundColor: colors.bgMid, borderColor: colors.borderSubtle }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemCategory, { color: colors.emerald }]}>{item.category.toUpperCase()}</Text>
                <Ionicons name="fitness" size={16} color={colors.emerald} />
              </View>

              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.itemDescription, { color: colors.textSub }]}>{item.description}</Text>

              <View style={styles.tagsRow}>
                {item.tags.map((tag) => (
                  <Badge key={tag} label={tag} variant="neutral" />
                ))}
              </View>
            </View>
          </StatsGridItem>
        ))}
      </StatsGrid>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: 20,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  itemCard: {
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    height: '100%',
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCategory: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
