import { api } from '../api/api';
import { ENDPOINTS } from '../api/endpoints';
import { SavedWorkoutItem } from '../../types';

export const savedWorkoutsService = {
  getSavedWorkouts: async (): Promise<SavedWorkoutItem[]> => {
    const response = await api.get<SavedWorkoutItem[]>(ENDPOINTS.SAVED_WORKOUTS.LIST);
    return response.data;
  },

  saveWorkout: async (workoutTemplateId: string): Promise<SavedWorkoutItem> => {
    const response = await api.post<SavedWorkoutItem>(ENDPOINTS.SAVED_WORKOUTS.SAVE, {
      workout_template_id: workoutTemplateId,
    });
    return response.data;
  },

  removeSavedWorkout: async (workoutTemplateId: string): Promise<void> => {
    await api.delete(ENDPOINTS.SAVED_WORKOUTS.REMOVE(workoutTemplateId));
  },
};
