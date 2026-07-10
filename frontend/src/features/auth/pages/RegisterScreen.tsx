import { Href, Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { login, registerUser, storeToken } from '@/api/auth';
import { Ionicons } from '@expo/vector-icons';

const DASHBOARD_ROUTE = '/dashboard' as Href;

/**
 * Validates a password against the application policy.
 * Returns an error string if invalid, or null if valid.
 * Rules: 8–20 characters, uppercase, lowercase, digit, special character.
 */
function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (password.length > 20) {
    return 'Password must be at most 20 characters.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!/[!@#$%^&*()\-_=+\[\]{};':",.<>/?`~\\|]/.test(password)) {
    return 'Password must contain at least one special character (e.g. !@#$%).';
  }
  return null;
}

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    setError('');

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError('Complete all fields to create your account.');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await registerUser({
        name: trimmedName,
        email: trimmedEmail,
        password,
        role: 'athlete',
      });

      const result = await login(trimmedEmail, password);
      storeToken(result.access_token);
      router.replace(DASHBOARD_ROUTE);
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.brandPanel}>
          <Text style={styles.brand}>AthliTech</Text>
          <Text style={styles.brandCopy}>Create your athlete account and start securely.</Text>
        </View>

        <View style={styles.formPanel}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Use this email and password to sign in later.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#8a94a6"
              style={styles.input}
              value={name}
            />
          </View>

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
                placeholder="8–20 chars, A-Z, a-z, 0-9, !@#$"
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

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                autoCapitalize="none"
                onChangeText={setConfirmPassword}
                placeholder="Repeat password"
                placeholderTextColor="#8a94a6"
                secureTextEntry={!showConfirmPassword}
                style={styles.passwordInput}
                value={confirmPassword}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.passwordToggle}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#647286"
                />
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={isLoading}
            onPress={handleRegister}
            style={({ pressed }) => [
              styles.button,
              pressed && !isLoading ? styles.buttonPressed : null,
              isLoading ? styles.buttonDisabled : null,
            ]}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </Pressable>

          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Link href="/" style={styles.footerLink}>
              Sign in
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
