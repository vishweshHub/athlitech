import { api } from '../api/api';
import { ENDPOINTS } from '../api/endpoints';
import {
  WorkoutSession,
  WorkoutSessionStartRequest,
  WorkoutSessionCompleteRequest,
  WorkoutSessionCancelRequest,
} from '../../types';

export const workoutService = {
  startWorkoutSession: async (payload: WorkoutSessionStartRequest): Promise<WorkoutSession> => {
    const response = await api.post<WorkoutSession>(ENDPOINTS.WORKOUT_SESSION.START, payload);
    return response.data;
  },

  pauseWorkoutSession: async (id: string): Promise<WorkoutSession> => {
    const response = await api.post<WorkoutSession>(ENDPOINTS.WORKOUT_SESSION.PAUSE(id));
    return response.data;
  },

  resumeWorkoutSession: async (id: string): Promise<WorkoutSession> => {
    const response = await api.post<WorkoutSession>(ENDPOINTS.WORKOUT_SESSION.RESUME(id));
    return response.data;
  },

  completeWorkoutSession: async (id: string, payload: WorkoutSessionCompleteRequest): Promise<WorkoutSession> => {
    const response = await api.post<WorkoutSession>(ENDPOINTS.WORKOUT_SESSION.COMPLETE(id), payload);
    return response.data;
  },

  cancelWorkoutSession: async (id: string, payload: WorkoutSessionCancelRequest): Promise<WorkoutSession> => {
    const response = await api.post<WorkoutSession>(ENDPOINTS.WORKOUT_SESSION.CANCEL(id), payload);
    return response.data;
  },

  getActiveWorkoutSession: async (athleteId?: string): Promise<WorkoutSession> => {
    const params: Record<string, string> = {};
    if (athleteId) params.athlete_id = athleteId;

    const response = await api.get<WorkoutSession>(ENDPOINTS.WORKOUT_SESSION.ACTIVE, { params });
    return response.data;
  },

  getWorkoutSessionById: async (id: string): Promise<WorkoutSession> => {
    const response = await api.get<WorkoutSession>(ENDPOINTS.WORKOUT_SESSION.BY_ID(id));
    return response.data;
  },
};
