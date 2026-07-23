import { API_URL } from './auth';

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

export async function completeProfile(token: string, payload: AthleteProfilePayload | CoachProfilePayload) {
  const response = await fetch(`${API_URL}/profile/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save profile');
  }

  return response.json();
}

export async function fetchMyProfile(token: string) {
  const response = await fetch(`${API_URL}/profile/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch profile');
  }

  return response.json();
}

export async function fetchWorkoutRecommendations(token: string): Promise<WorkoutRecommendation[]> {
  const response = await fetch(`${API_URL}/profile/recommendations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}
