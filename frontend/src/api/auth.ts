import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'athlitech_access_token';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  coach_id?: string;
  profile_completed?: boolean;
};

export type LoginResult = {
  access_token: string;
  token_type: string;
};

export type RegisterInput = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role?: string;
};

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000';

export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  }
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to retrieve secure token:', err);
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (err) {
    console.warn('Failed to store secure token:', err);
  }
}

export async function clearStoredToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to delete secure token:', err);
  }
}

async function parseJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<LoginResult> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
  } catch {
    throw new Error('Unable to connect to the backend.');
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    let message = 'Invalid email or password.';
    if (data) {
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        // FastAPI validation errors are arrays of objects with 'msg'
        message = data.detail[0].msg ?? JSON.stringify(data.detail);
      } else if (typeof data.detail === 'object' && data.detail !== null) {
        message = data.detail.msg ?? JSON.stringify(data.detail);
      }
    }
    throw new Error(message);
  }

  if (!data?.access_token) {
    throw new Error('Login response did not include an access token.');
  }

  return data;
}

export async function registerUser(user: RegisterInput) {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        password: user.password,
        confirm_password: user.confirm_password,
        role: user.role ?? 'athlete',
      }),
    });
  } catch {
    throw new Error('Unable to connect to the backend.');
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    let message = 'Registration failed.';
    if (data) {
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        message = data.detail[0].msg ?? JSON.stringify(data.detail);
      } else if (typeof data.detail === 'object' && data.detail !== null) {
        message = data.detail.msg ?? JSON.stringify(data.detail);
      }
    }
    throw new Error(message);
  }

  return data;
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error('Unable to connect to the backend.');
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    let message = 'Session expired.';
    if (data) {
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        message = data.detail[0].msg ?? JSON.stringify(data.detail);
      } else if (typeof data.detail === 'object' && data.detail !== null) {
        message = data.detail.msg ?? JSON.stringify(data.detail);
      }
    }
    throw new Error(message);
  }

  return data;
}
