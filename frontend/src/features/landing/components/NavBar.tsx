import { Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const LOGIN_ROUTE = '/login' as Href;
const REGISTER_ROUTE = '/register' as Href;

export default function NavBar() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isNarrow = width < 640;

  return (
    <View style={styles.navbar}>
      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={styles.logoDot} />
        <Text style={styles.logoText}>AthliTech</Text>
      </View>

      {/* Nav links (desktop only) */}
      {!isNarrow && (
        <View style={styles.navLinks}>
          {['Features', 'How It Works', 'Benefits', 'FAQ'].map((label, i) => (
            <Text key={i} style={styles.navLink}>
              {label}
            </Text>
          ))}
        </View>
      )}

      {/* Auth buttons */}
      <View style={styles.authRow}>
        <Pressable
          onPress={() => router.push(LOGIN_ROUTE)}
          style={({ pressed }) => [styles.signInBtn, pressed && styles.signInBtnPressed]}
        >
          <Text style={styles.signInText}>Sign In</Text>
        </Pressable>

        {!isNarrow && (
          <Pressable
            onPress={() => router.push(REGISTER_ROUTE)}
            style={({ pressed }) => [styles.getStartedBtn, pressed && styles.getStartedBtnPressed]}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(10,15,26,0.95)',
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1,
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
    backgroundColor: '#10b981',
  },
  logoText: {
    color: '#f0f4f8',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 28,
    alignItems: 'center',
  },
  navLink: {
    color: '#8a9ab5',
    fontSize: 14,
    fontWeight: '500',
  },
  authRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  signInBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signInBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  signInText: {
    color: '#c8d8e8',
    fontSize: 14,
    fontWeight: '600',
  },
  getStartedBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedBtnPressed: {
    backgroundColor: '#059669',
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
