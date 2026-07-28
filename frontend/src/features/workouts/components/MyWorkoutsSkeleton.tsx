import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Card } from '../../../components/ui/Card';

export const MyWorkoutsSkeleton: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      {[1, 2, 3].map((key) => (
        <Card key={key} style={styles.card}>
          <Animated.View style={[styles.headerBadge, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.titleLine, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.metaLine, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.descLine, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.buttonLine, { opacity: fadeAnim }]} />
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingVertical: 12,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    gap: 12,
  },
  headerBadge: {
    width: 90,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  titleLine: {
    width: '65%',
    height: 20,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  metaLine: {
    width: '40%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  descLine: {
    width: '90%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  buttonLine: {
    width: '100%',
    height: 38,
    borderRadius: 8,
    backgroundColor: '#334155',
    marginTop: 8,
  },
});
