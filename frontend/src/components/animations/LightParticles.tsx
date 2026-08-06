import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming, 
  Easing, 
  withDelay 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 15;

function Particle({ delay, initialTop, initialLeft, size }: { delay: number; initialTop: number; initialLeft: number; size: number }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withRepeat(
        withSequence(
          withDelay(delay, withTiming(0.6, { duration: 2000 })),
          withTiming(0, { duration: 2000 })
        ),
        -1,
        true
      ),
      transform: [
        {
          translateY: withRepeat(
            withTiming(-50, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
          )
        },
        {
          translateX: withRepeat(
            withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
          )
        }
      ]
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          top: initialTop,
          left: initialLeft,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function LightParticles() {
  const [particles, setParticles] = useState<{ id: number; top: number; left: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
      id: i,
      top: Math.random() * height,
      left: Math.random() * width,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 4000,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' as any }]}>
      {particles.map((particle) => (
        <Particle key={particle.id} initialTop={particle.top} initialLeft={particle.left} size={particle.size} delay={particle.delay} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    backgroundColor: '#fcd34d', // Warm light yellow
    shadowColor: '#fcd34d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
});
