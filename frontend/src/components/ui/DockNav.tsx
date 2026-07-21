/**
 * DockNav
 *
 * A floating pill-style navigation bar with:
 * - Frosted glass blur background (web)
 * - Hover magnification effect on each nav item (web, Animated.spring)
 * - Brand logo with emerald pulse dot
 * - Auth CTA buttons
 *
 * Replaces the original NavBar on the landing page.
 */

import { Href, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { RADIUS, SHADOW, useThemeColors } from '@/styles/tokens';
import ThemeToggle from '@/components/ui/ThemeToggle';

const LOGIN_ROUTE = '/login' as Href;
const REGISTER_ROUTE = '/register' as Href;

const NAV_LINKS = ['Features', 'How It Works', 'Benefits', 'FAQ'] as const;

function NavItem({ label, colors, styles }: { label: string; colors: any; styles: any }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleIn = Platform.OS === 'web'
    ? () => Animated.spring(scale, { toValue: 1.1, useNativeDriver: true, tension: 300, friction: 10 }).start()
    : undefined;

  const handleOut = Platform.OS === 'web'
    ? () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start()
    : undefined;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        // @ts-ignore — web only
        onMouseEnter={handleIn}
        onMouseLeave={handleOut}
        style={styles.navLink}
      >
        <Text style={styles.navLinkText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function DockNav() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isNarrow = width < 680;
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.outer} pointerEvents="box-none">
      {Platform.OS === 'web'
        ? React.createElement('div', {
            'aria-hidden': true,
            style: {
              position: 'absolute',
              inset: 0,
              borderRadius: 999,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              pointerEvents: 'none',
            },
          })
        : null}

      <View style={styles.inner}>
        {/* Logo */}
        <Pressable
          onPress={() => {}}
          style={styles.logoRow}
        >
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>AthliTech</Text>
        </Pressable>

        {/* Nav links — desktop only */}
        {!isNarrow && (
          <View style={styles.links}>
            {NAV_LINKS.map((label) => (
              <NavItem key={label} label={label} colors={colors} styles={styles} />
            ))}
          </View>
        )}

        {/* Auth buttons */}
        <View style={styles.auth}>
          <ThemeToggle />
          <Pressable
            onPress={() => router.push(LOGIN_ROUTE)}
            style={({ pressed }) => [
              styles.signInBtn,
              pressed && styles.signInBtnPressed,
            ]}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </Pressable>

          {!isNarrow && (
            <Pressable
              onPress={() => router.push(REGISTER_ROUTE)}
              style={({ pressed }) => [
                styles.getStartedBtn,
                pressed && styles.getStartedBtnPressed,
              ]}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  outer: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    zIndex: 100,
    borderRadius: RADIUS.full,
    backgroundColor: colors.bgGlass || 'rgba(10,15,26,0.75)',
    borderColor: colors.border || 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOW.card,
    shadowColor: colors.cardShadow || '#000',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: colors.emerald,
  },
  logoText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navLink: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  navLinkText: {
    color: colors.textSub,
    fontSize: 14,
    fontWeight: '500',
  },
  auth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  signInBtnPressed: {
    backgroundColor: colors.borderSubtle || 'rgba(255,255,255,0.06)',
  },
  signInText: {
    color: colors.textSub,
    fontSize: 14,
    fontWeight: '600',
  },
  getStartedBtn: {
    backgroundColor: colors.emerald,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    ...SHADOW.emerald,
    shadowColor: colors.emerald,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  getStartedBtnPressed: {
    backgroundColor: colors.emeraldPressed,
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
