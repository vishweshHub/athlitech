import { API_URL } from '@/constants/api';
import { ApiError, formatApiDetailMessage } from '@/utils/ApiError';

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

async function handleResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    const msg = formatApiDetailMessage(errData?.detail ?? errData?.message, fallbackMessage);
    throw new ApiError(msg, res.status, `HTTP_${res.status}`, errData);
  }
  return res.json();
}

export async function fetchMyOrganization(token: string): Promise<OrganizationData | null> {
  const res = await fetch(`${API_URL}/organization/my-organization`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    const errData = await res.json().catch(() => null);
    const msg = formatApiDetailMessage(errData?.detail ?? errData?.message, 'Failed to fetch organization details');
    throw new ApiError(msg, res.status, `HTTP_${res.status}`, errData);
  }

  const data = await res.json();
  return data.organization || null;
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

  const data = await handleResponse<{ organization: OrganizationData }>(res, 'Failed to create organization');
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
    const errData = await res.json().catch(() => null);
    const msg = formatApiDetailMessage(errData?.detail ?? errData?.message, 'Failed to update organization plan');
    throw new ApiError(msg, res.status, `HTTP_${res.status}`, errData);
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

  return handleResponse<OrganizationInvitationsResponse>(res, 'Failed to fetch invitations');
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

  const data = await handleResponse<{ invitation: PendingInvitation }>(res, 'Failed to generate invitation link');
  return data.invitation;
}

