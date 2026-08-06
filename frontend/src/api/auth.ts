import { API_URL } from '@/constants/api';
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
