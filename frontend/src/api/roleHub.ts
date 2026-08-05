import { API_URL, getStoredToken } from '@/constants/api';

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

export async function fetchRoleHubStatus(): Promise<RoleHubStatusResponse> {
  const token = await getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const url = `${API_URL}/role-profiles/status`;
  console.log('[fetchRoleHubStatus] Fetching:', url);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[fetchRoleHubStatus] HTTP ${response.status}:`, errorBody);
    throw new Error(`Failed to fetch role hub status (HTTP ${response.status}).`);
  }

  return response.json();
}

export async function activateRole(role: 'athlete' | 'coach' | 'organization'): Promise<{ message: string; role: string; active: boolean }> {
  const token = await getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const requestUrl = `${API_URL}/role-profiles/activate`;
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to activate ${role} role (HTTP ${response.status}): ${responseText}`);
  }

  return response.json();
}

export async function deactivateRole(role: 'athlete' | 'coach' | 'organization'): Promise<{ message: string; role: string; active: boolean }> {
  const token = await getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const requestUrl = `${API_URL}/role-profiles/deactivate`;
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to deactivate ${role} subscription (HTTP ${response.status}): ${responseText}`);
  }

  return response.json();
}
