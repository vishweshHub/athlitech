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
  completed_at?: string;
  completion_percentage?: number;
  athlete_notes?: string;
  created_at: string;
};

export type WorkoutTemplate = {
  id: string;
  title: string;
  description?: string;
  sport: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration_minutes: number;
  equipment: string[];
  instructions?: string;
  exercises?: Exercise[];
  created_by: string;
  created_by_role: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchWorkoutTemplates(
  token: string,
  params?: { sport?: string; category?: string; difficulty?: string; search?: string }
): Promise<WorkoutTemplate[]> {
  const query = new URLSearchParams();
  if (params?.sport) query.append('sport', params.sport);
  if (params?.category) query.append('category', params.category);
  if (params?.difficulty) query.append('difficulty', params.difficulty);
  if (params?.search) query.append('search', params.search);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const response = await fetch(`${API_URL}/workouts${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to fetch workout templates');
  }
  return response.json();
}

export async function fetchWorkoutTemplateById(token: string, id: string): Promise<WorkoutTemplate> {
  const response = await fetch(`${API_URL}/workouts/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to fetch workout template details');
  }
  return response.json();
}

export async function createWorkout(
  token: string,
  workoutData: {
    workout_template_id?: string;
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
  status: 'pending' | 'completed' | 'skipped',
  completed_at?: string,
  completion_percentage?: number,
  athlete_notes?: string
): Promise<{ message: string; status: string }> {
  const response = await fetch(`${API_URL}/workouts/${workoutId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      status,
      completed_at,
      completion_percentage,
      athlete_notes,
    }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to update workout status');
  }
  return response.json();
}

export async function fetchAllWorkouts(token: string): Promise<Workout[]> {
  const response = await fetch(`${API_URL}/workouts/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Failed to fetch workouts');
  }
  return response.json();
}

export type WorkoutMetadata = {
  sports: string[];
  categories: string[];
  difficulties: string[];
  equipment: string[];
};

export async function fetchWorkoutMetadata(token?: string): Promise<WorkoutMetadata> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/workouts/metadata`, { headers });
  if (!response.ok) {
    return {
      sports: ["Track & Field", "Football", "Basketball", "Cricket", "General Fitness"],
      categories: ["Speed", "Endurance", "Strength", "Technique", "Mobility", "Recovery"],
      difficulties: ["Beginner", "Intermediate", "Advanced"],
      equipment: ["Starting Blocks", "Spikes", "Stopwatch", "Agility Cones", "Foam Roller", "Barbell", "Dumbbells"],
    };
  }
  return response.json();
}

export async function fetchSports(token?: string): Promise<string[]> {
  const meta = await fetchWorkoutMetadata(token);
  return meta.sports;
}
