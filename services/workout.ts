import { API_URL } from './auth';


export type Exercise = {
  name: string;
  sets: number;
  reps: number;
  duration?: string;
};

export type Workout = {
  workout_id: string;
  title: string;
  description?: string;
  coach_id: string;
  athlete_id: string;
  exercises: Exercise[];
  date: string;
  status: 'pending' | 'completed' | 'skipped';
  created_at: string;
};

export async function createWorkout(
  token: string,
  workoutData: {
    title: string;
    description?: string;
    athlete_id: string;
    exercises: Exercise[];
    date: string;
    status?: string;
  }
): Promise<{ message: string; workout_id: string }> {
  const response = await fetch(`${API_URL}/workouts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(workoutData),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to create workout plan');
  }
  return response.json();
}

export async function fetchCoachWorkouts(token: string, coachId: string): Promise<Workout[]> {
  const response = await fetch(`${API_URL}/workouts/coach/${coachId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to fetch coach workouts');
  }
  return response.json();
}

export async function fetchAthleteWorkouts(token: string, athleteId: string): Promise<Workout[]> {
  const response = await fetch(`${API_URL}/workouts/athlete/${athleteId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to fetch athlete workouts');
  }
  return response.json();
}

export async function updateWorkoutStatus(
  token: string,
  workoutId: string,
  status: 'pending' | 'completed' | 'skipped'
): Promise<{ message: string; status: string }> {
  const response = await fetch(`${API_URL}/workouts/${workoutId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to update workout status');
  }
  return response.json();
}
