import { Href, Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { fetchCurrentUser, getStoredToken, login, storeToken } from '@/api/auth';
import { Ionicons } from '@expo/vector-icons';

const DASHBOARD_ROUTE = '/dashboard' as Href;
const REGISTER_ROUTE = '/register' as Href;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function validateExistingSession() {
      const token = getStoredToken();

      if (!token) {
        if (isMounted) {
          setIsCheckingSession(false);
        }
        return;
      }

      try {
        await fetchCurrentUser(token);
        if (isMounted) {
          router.replace(DASHBOARD_ROUTE);
        }
      } catch {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    validateExistingSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleLogin() {
    setError('');

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);
      storeToken(result.access_token);
      router.replace(DASHBOARD_ROUTE);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredStatus}>
          <ActivityIndicator color="#1769aa" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.brandPanel}>
          <Text style={styles.brand}>AthliTech</Text>
          <Text style={styles.brandCopy}>
            Athlete management and performance tracking for focused teams.
          </Text>
        </View>

        <View style={styles.formPanel}>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Access your athlete dashboard.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#8a94a6"
              style={styles.input}
              value={email}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                autoCapitalize="none"
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#8a94a6"
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                value={password}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#647286"
                />
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={isLoading}
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.button,
              pressed && !isLoading ? styles.buttonPressed : null,
              isLoading ? styles.buttonDisabled : null,
            ]}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </Pressable>

          <Text style={styles.footerText}>
            New to AthliTech?{' '}
            <Link href={REGISTER_ROUTE} style={styles.footerLink}>
              Create account
            </Link>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  shell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centeredStatus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandPanel: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 28,
  },
  brand: {
    color: '#102033',
    fontSize: 42,
    fontWeight: '800',
  },
  brandCopy: {
    color: '#536174',
    fontSize: 17,
    lineHeight: 25,
    marginTop: 10,
  },
  formPanel: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderColor: '#dfe6ef',
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
  },
  title: {
    color: '#102033',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#647286',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#223046',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fbfcfe',
    borderColor: '#cfd8e5',
    borderRadius: 6,
    borderWidth: 1,
    color: '#102033',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  error: {
    color: '#b42318',
    fontSize: 14,
    marginBottom: 14,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1769aa',
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPressed: {
    backgroundColor: '#12598f',
  },
  buttonDisabled: {
    backgroundColor: '#7aa8cf',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerText: {
    color: '#536174',
    fontSize: 14,
    marginTop: 18,
    textAlign: 'center',
  },
  footerLink: {
    color: '#1769aa',
    fontWeight: '700',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbfcfe',
    borderColor: '#cfd8e5',
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 48,
  },
  passwordInput: {
    flex: 1,
    color: '#102033',
    fontSize: 16,
    paddingHorizontal: 14,
  },
  passwordToggle: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
