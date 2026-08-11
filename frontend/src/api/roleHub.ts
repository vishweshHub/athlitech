import { API_URL, getStoredToken } from '@/constants/api';
import { ApiError, formatApiDetailMessage } from '@/utils/ApiError';

export type RoleStatusInfo = {
  active: boolean;
  has_existing_profile?: boolean;
  role_profile_id: string | null;
  status?: string;
  plan_tier?: string;
  billing_status?: string;
};

export type RoleHubStatusResponse = {
  account_id: string;
  email: string;
  roles: {
    athlete: RoleStatusInfo;
    coach: RoleStatusInfo;
    organization: RoleStatusInfo;
  };
  active_roles: string[];
};

async function handleResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const msg = formatApiDetailMessage(errorBody?.detail ?? errorBody?.message, fallbackMessage);
    throw new ApiError(msg, response.status, `HTTP_${response.status}`, errorBody);
  }
  return response.json();
}

export async function fetchRoleHubStatus(): Promise<RoleHubStatusResponse> {
  const token = await getStoredToken();
  if (!token) throw new ApiError('Not authenticated', 401, 'UNAUTHORIZED');

  const url = `${API_URL}/role-profiles/status`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return handleResponse<RoleHubStatusResponse>(response, 'Failed to fetch workspace role status');
}

export async function activateRole(role: 'athlete' | 'coach' | 'organization'): Promise<{ message: string; role: string; active: boolean }> {
  const token = await getStoredToken();
  if (!token) throw new ApiError('Not authenticated', 401, 'UNAUTHORIZED');

  const requestUrl = `${API_URL}/role-profiles/activate`;
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });

  return handleResponse<{ message: string; role: string; active: boolean }>(response, `Failed to activate ${role} role`);
}

export async function deactivateRole(role: 'athlete' | 'coach' | 'organization'): Promise<{ message: string; role: string; active: boolean }> {
  const token = await getStoredToken();
  if (!token) throw new ApiError('Not authenticated', 401, 'UNAUTHORIZED');

  const requestUrl = `${API_URL}/role-profiles/deactivate`;
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });

  return handleResponse<{ message: string; role: string; active: boolean }>(response, `Failed to deactivate ${role} role`);
}

