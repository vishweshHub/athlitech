import { API_URL } from '@/constants/api';

export interface OrganizationData {
  organization_id: string;
  name: string;
  slug: string;
  owner_account_id: string;
  org_type: string;
  sport: string;
  country: string;
  state?: string;
  logo_url?: string;
  timezone: string;
  plan_tier: 'club' | 'academy' | 'enterprise';
  status: string;
  created_at?: string;
}

export interface CreateOrgPayload {
  name: string;
  org_type?: string;
  sport?: string;
  country?: string;
  state?: string;
  logo_url?: string;
  timezone?: string;
  plan_tier?: 'club' | 'academy' | 'enterprise';
}

export interface PendingInvitation {
  invitation_id: string;
  email: string;
  role: string;
  sent_at: string;
  expires_at?: string;
  status: string;
  invite_link: string;
}

export interface MemberRequest {
  request_id: string;
  name: string;
  email: string;
  role: string;
  requested_at: string;
  status: string;
}

export interface AcceptedMember {
  member_id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

export interface OrganizationInvitationsResponse {
  organization_id: string;
  pending_invitations: PendingInvitation[];
  member_requests: MemberRequest[];
  accepted_members: AcceptedMember[];
  expired_invitations: any[];
}

export async function fetchMyOrganization(token: string): Promise<OrganizationData | null> {
  try {
    const res = await fetch(`${API_URL}/organization/my-organization`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.organization || null;
  } catch (err) {
    console.warn('[Organization API] Failed to fetch organization:', err);
    return null;
  }
}

export async function createOrganization(
  token: string,
  payload: CreateOrgPayload
): Promise<OrganizationData> {
  const res = await fetch(`${API_URL}/organization/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to create organization');
  }

  const data = await res.json();
  return data.organization;
}

export async function updateOrganizationPlan(
  token: string,
  planTier: 'club' | 'academy' | 'enterprise'
): Promise<void> {
  const res = await fetch(`${API_URL}/organization/my-organization/plan`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan_tier: planTier }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to update organization plan');
  }
}

export async function fetchOrganizationInvitations(
  token: string
): Promise<OrganizationInvitationsResponse> {
  const res = await fetch(`${API_URL}/organization/my-organization/invitations`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch invitations (HTTP ${res.status})`);
  }

  return await res.json();
}

export async function createOrganizationInvitation(
  token: string,
  payload: { email: string; role: string }
): Promise<PendingInvitation> {
  const res = await fetch(`${API_URL}/organization/my-organization/invitations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to generate invitation link');
  }

  const data = await res.json();
  return data.invitation;
}
