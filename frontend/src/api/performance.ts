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

// ── SPRINT 5.1 PERFORMANCE LOG ENDPOINTS ──

export interface PerformanceLogPayload {
  workout_session_id: string;
  workout_template_id?: string;
  assignment_id?: string;
  activity_label?: string;
  source_type?: string;
  workout_name?: string;
  completed_at?: string;
  duration_minutes?: number;
  perceived_effort?: number; // 1-10
  completion_rating?: number; // 1-5
  notes?: string;
  metrics?: Record<string, any>;
}

export interface PerformanceLogResponse {
  id: string;
  workout_session_id: string;
  athlete_id: string;
  workout_template_id?: string;
  source_type: string;
  workout_name: string;
  completed_at: string;
  duration_minutes: number;
  perceived_effort: number;
  completion_rating: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function getSourceBadgeInfo(sourceType?: string): { label: string; variant: 'success' | 'info' } {
  const norm = (sourceType || '').toUpperCase();
  if (norm === 'PLANNED' || norm === 'COACH' || norm === 'COACH PLAN' || norm === 'COACH_PLAN') {
    return { label: 'Coach Plan', variant: 'success' };
  }
  return { label: 'Self Workout', variant: 'info' };
}


export function parseApiErrorMessage(data: any, fallbackMessage: string): string {
  if (!data) return fallbackMessage;
  const detail = data.detail;
  if (!detail) return data.message || fallbackMessage;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    const errorLines = detail.map((err: any) => {
      if (typeof err === 'string') return err;
      if (err && typeof err === 'object') {
        const locArr = Array.isArray(err.loc) ? err.loc : [];
        const fieldLoc = locArr.filter((l: any) => l !== 'body' && l !== 'query' && l !== 'path').join('.');
        let msg = err.msg || 'Invalid value';
        if (msg.startsWith('Value error, ')) {
          msg = msg.replace('Value error, ', '');
        }

        if (fieldLoc === 'perceived_effort' || fieldLoc === 'rpe') {
          return '• RPE is required and must be between 1 and 10.';
        }
        if (fieldLoc === 'completion_rating') {
          return '• Session Rating must be between 1 and 5.';
        }
        if (fieldLoc === 'workout_session_id') {
          return '• workout_session_id is missing or invalid.';
        }
        return fieldLoc ? `• ${fieldLoc}: ${msg}` : `• ${msg}`;
      }
      return String(err);
    });

    return errorLines.join('\n');
  }

  if (typeof detail === 'object') {
    return detail.message || detail.msg || JSON.stringify(detail);
  }

  return String(detail);
}

export async function createPerformanceLog(
  token: string,
  payload: PerformanceLogPayload
): Promise<PerformanceLogResponse> {
  const response = await fetch(`${API_URL}/performance-logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = parseApiErrorMessage(data, 'Failed to save performance log');
    throw new Error(message);
  }

  return response.json();
}

export async function fetchMyPerformanceLogs(token: string): Promise<PerformanceLogResponse[]> {
  const response = await fetch(`${API_URL}/performance-logs/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail || 'Failed to fetch performance logs');
  }

  return response.json();
}

export async function fetchAthletePerformanceLogs(token: string, athleteId: string): Promise<PerformanceLogResponse[]> {
  const response = await fetch(`${API_URL}/performance-logs/athlete/${athleteId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

/**
 * Fetch performance logs for a specific workout session.
 * Returns an empty array if none exist (never throws on 404).
 */
export async function fetchLogBySession(
  token: string,
  workoutSessionId: string
): Promise<PerformanceLogResponse[]> {
  const response = await fetch(
    `${API_URL}/performance-logs/workout-session/${workoutSessionId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) return [];
  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

/**
 * DEV-ONLY: Delete all performance logs for a workout session so the demo
 * workflow can be repeated without manual DB edits.
 * Only works when the backend is running with DEV_MODE=true.
 */
export async function deletePerformanceLogsBySession(
  token: string,
  workoutSessionId: string
): Promise<{ deleted: number; message: string }> {
  const response = await fetch(
    `${API_URL}/performance-logs/dev-reset/${workoutSessionId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail || 'Failed to reset performance log');
  }
  return response.json();
}
