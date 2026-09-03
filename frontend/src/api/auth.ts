import { API_URL } from '@/constants/api';
import { formatApiDetailMessage } from '@/utils/ApiError';

export { API_URL, TOKEN_KEY, getStoredToken, storeToken, clearStoredToken } from '@/constants/api';

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

async function parseJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function throwHttpResponseError(status: number, data: any, default401Message: string): never {
  if (status === 401) {
    const message = formatApiDetailMessage(data?.detail, default401Message);
    throw new Error(message);
  }

  if (status === 422) {
    const message = formatApiDetailMessage(data?.detail, 'Validation error. Please check your input.');
    throw new Error(message);
  }

  if (status >= 500) {
    const message = data?.detail
      ? formatApiDetailMessage(data.detail, `Server error (${status}).`)
      : `Server error (${status}). Please try again later.`;
    throw new Error(message);
  }

  const message = formatApiDetailMessage(data?.detail, `Request failed (${status}).`);
  throw new Error(message);
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
    throw new Error('Unable to connect to the backend server. Please check your connection.');
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throwHttpResponseError(response.status, data, 'Invalid email or password.');
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
    throw new Error('Unable to connect to the backend server. Please check your connection.');
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throwHttpResponseError(response.status, data, 'Registration failed.');
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
    throw new Error('Unable to connect to the backend server. Please check your connection.');
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throwHttpResponseError(response.status, data, 'Session expired.');
  }

  return data;
}
