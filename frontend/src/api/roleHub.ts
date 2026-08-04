import { API_URL, getStoredToken } from '@/constants/api';

export type RoleStatusInfo = {
  active: boolean;
  role_profile_id: string | null;
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
  const requestBody = JSON.stringify({ role });
  const authHeader = `Bearer ${token.substring(0, 8)}...`;

  console.log('------------------------------------');
  console.log('[activateRole] 1. API_URL:', API_URL);
  console.log('[activateRole] 2. Request URL:', requestUrl);
  console.log('[activateRole] 3. Request Payload:', requestBody);
  console.log('[activateRole] 4. Authorization:', authHeader);

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: requestBody,
  });

  console.log('[activateRole] 5. Response Status:', response.status, response.statusText);

  if (!response.ok) {
    const responseText = await response.text();
    console.error('[activateRole] 6. Response Error Body:', responseText);
    throw new Error(`Failed to activate ${role} role (HTTP ${response.status}): ${responseText}`);
  }

  const responseData = await response.json();
  console.log('[activateRole] 6. Response Data:', responseData);
  console.log('------------------------------------');

  return responseData;
}
