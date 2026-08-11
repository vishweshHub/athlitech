import { API_URL } from './auth';
import { ApiError, formatApiDetailMessage } from '@/utils/ApiError';

export interface AthleteProfilePayload {
  sport: string;
  event: string;
  height?: number | null;
  weight?: number | null;
  dob?: string | null;
  personal_best?: string | null;
  primary_goal?: string | null;
  goal_timeline?: string | null;
}

export interface CoachProfilePayload {
  primary_sport: string;
  specialization: string;
  years_experience: number;
  bio?: string | null;
}

export interface WorkoutRecommendation {
  title: string;
  category: string;
  description: string;
  tags: string[];
}

async function handleResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const msg = formatApiDetailMessage(data?.detail ?? data?.message, fallbackMessage);
    throw new ApiError(msg, response.status, `HTTP_${response.status}`, data);
  }
  return response.json();
}

export async function completeProfile(token: string, payload: AthleteProfilePayload | CoachProfilePayload) {
  const response = await fetch(`${API_URL}/profile/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response, 'Failed to save profile');
}

export async function fetchMyProfile(token: string) {
  const response = await fetch(`${API_URL}/profile/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response, 'Failed to fetch profile');
}

export async function fetchWorkoutRecommendations(token: string): Promise<WorkoutRecommendation[]> {
  const response = await fetch(`${API_URL}/profile/recommendations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<WorkoutRecommendation[]>(response, 'Failed to fetch workout recommendations');
}

