import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence, 
  withDelay 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const STAR_COUNT = 30;

function Star({ delay, top, left, size }: { delay: number; top: number; left: number; size: number }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withRepeat(
        withSequence(
          withDelay(delay, withTiming(0.2, { duration: 1000 })),
          withTiming(0.8, { duration: 1000 }),
          withTiming(0.2, { duration: 1000 })
        ),
        -1,
        true
      ),
    };
  });

  return (
    <Animated.View
      style={[
        styles.star,
        {
          top,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

function ShootingStar() {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withRepeat(
            withSequence(
              withTiming(-width, { duration: 0 }),
              withDelay(Math.random() * 10000 + 5000, withTiming(width * 1.5, { duration: 1500 }))
            ),
            -1,
            false
          )
        },
        {
          translateY: withRepeat(
            withSequence(
              withTiming(-height, { duration: 0 }),
              withDelay(Math.random() * 10000 + 5000, withTiming(height, { duration: 1500 }))
            ),
            -1,
            false
          )
        }
      ],
      opacity: withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withDelay(Math.random() * 10000 + 5000, withTiming(1, { duration: 200 })),
          withTiming(0, { duration: 1300 })
        ),
        -1,
        false
      )
    };
  });

  return (
    <Animated.View style={[styles.shootingStar, animatedStyle]} />
  );
}

export default function Stars() {
  const [stars, setStars] = useState<{ id: number; top: number; left: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: STAR_COUNT }).map((_, i) => ({
      id: i,
      top: Math.random() * height,
      left: Math.random() * width,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3000,
    }));
    setStars(newStars);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((star) => (
        <Star key={star.id} {...star} />
      ))}
      <ShootingStar />
      <ShootingStar />
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  shootingStar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    height: 50,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
  },
});
