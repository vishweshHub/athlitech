import { Platform } from 'react-native';

const TOKEN_KEY = 'athlitech_access_token';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type LoginResult = {
  access_token: string;
  token_type: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role?: string;
};

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000';

export function getStoredToken() {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string) {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearStoredToken() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
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
    throw new Error(data?.detail ?? 'Invalid email or password.');
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
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role ?? 'athlete',
      }),
    });
  } catch {
    throw new Error('Unable to connect to the backend.');
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.detail ?? 'Registration failed.');
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
    throw new Error(data?.detail ?? 'Session expired.');
  }

  return data;
}
