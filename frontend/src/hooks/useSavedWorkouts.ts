import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { savedWorkoutsService } from '../services/savedWorkouts/savedWorkoutsService';
import { SavedWorkoutItem } from '../types';

export function useSavedWorkouts() {
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkoutItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedWorkouts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await savedWorkoutsService.getSavedWorkouts();
      setSavedWorkouts(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || err?.message || 'Failed to load saved workouts.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedWorkouts();
  }, [fetchSavedWorkouts]);

  useFocusEffect(
    useCallback(() => {
      fetchSavedWorkouts();
    }, [fetchSavedWorkouts])
  );

  const saveWorkout = async (workoutTemplateId: string): Promise<SavedWorkoutItem> => {
    try {
      const item = await savedWorkoutsService.saveWorkout(workoutTemplateId);
      await fetchSavedWorkouts();
      return item;
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || err?.message || 'Failed to save workout.';
      throw new Error(message);
    }
  };

  const removeWorkout = async (workoutTemplateId: string): Promise<void> => {
    try {
      await savedWorkoutsService.removeSavedWorkout(workoutTemplateId);
      await fetchSavedWorkouts();
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || err?.message || 'Failed to remove workout.';
      throw new Error(message);
    }
  };

  return {
    savedWorkouts,
    isLoading,
    error,
    refetch: fetchSavedWorkouts,
    saveWorkout,
    removeWorkout,
  };
}
