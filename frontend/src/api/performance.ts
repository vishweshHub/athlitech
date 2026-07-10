import { API_URL } from './auth';

export type PerformanceRecord = {
  performance_id: string;
  athlete_id: string;
  coach_id: string;
  date?: string;
  sprint_time?: number;
  weight?: number;
  height?: number;
  coach_remarks?: string;
  
  // New Fields
  workout_id?: string;
  sport_event?: string;
  value?: number;
  unit?: string;
  feedback?: string;
  recorded_at?: string;
  
  created_at: string;
};

export type PerformanceCreateInput = {
  athlete_id: string;
  date?: string;
  sprint_time?: number;
  weight?: number;
  height?: number;
  coach_remarks?: string;

  // New Fields
  workout_id?: string;
  sport_event?: string;
  value?: number;
  unit?: string;
  feedback?: string;
  recorded_at?: string;
};

export async function fetchAthletePerformances(token: string, athleteId: string): Promise<PerformanceRecord[]> {
  const response = await fetch(`${API_URL}/performances/athlete/${athleteId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to fetch athlete performance records');
  }
  return response.json();
}

export async function createPerformance(
  token: string,
  performanceData: PerformanceCreateInput
): Promise<{ message: string; performance_id: string }> {
  const response = await fetch(`${API_URL}/performances/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(performanceData),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to record performance data');
  }
  return response.json();
}

export async function fetchAllPerformances(token: string): Promise<PerformanceRecord[]> {
  const response = await fetch(`${API_URL}/performances/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to fetch performance records');
  }
  return response.json();
}
