import { API_URL } from './auth';

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type Role = {
  id?: string;
  name: string;
  permissions: string[];
};

export async function fetchAllUsers(token: string): Promise<User[]> {
  const response = await fetch(`${API_URL}/users/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to fetch users');
  }
  return response.json();
}

export async function fetchAllRoles(token: string): Promise<Role[]> {
  const response = await fetch(`${API_URL}/roles/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to fetch roles');
  }
  return response.json();
}

export async function updateUserRole(token: string, userId: string, role: string): Promise<User> {
  const response = await fetch(`${API_URL}/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to update user role');
  }
  return response.json();
}

export async function createRole(token: string, name: string, permissions: string[] = []): Promise<Role> {
  const response = await fetch(`${API_URL}/roles/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, permissions }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to create role');
  }
  return response.json();
}

export async function assignAthleteToCoach(token: string, athleteId: string, coachId: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/athletes/${athleteId}/assign/${coachId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to assign athlete to coach');
  }
  return response.json();
}
