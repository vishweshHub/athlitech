import { useState, useCallback, useEffect } from 'react';
import { workoutService } from '../services/workout/workoutService';
import { parseApiError } from '../utils/ApiError';
import {
  WorkoutSession,
  WorkoutSessionStartRequest,
  WorkoutSessionCompleteRequest,
  WorkoutSessionCancelRequest,
} from '../types';

export const useWorkoutSession = (athleteId?: string) => {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await workoutService.getActiveWorkoutSession(athleteId);
      setActiveSession(session);
      return session;
    } catch (err: any) {
      const parsed = parseApiError(err, 'Failed to fetch active workout session');
      if (parsed.status === 404) {
        setActiveSession(null);
        return null;
      } else {
        setError(parsed.message);
        return null;
      }
    } finally {
      setIsLoading(false);
    }
  }, [athleteId]);

  const startSession = async (payload: WorkoutSessionStartRequest): Promise<WorkoutSession | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Check local state or remote active session first to avoid duplicate start calls
      if (activeSession) {
        return activeSession;
      }

      const existingActive = await workoutService.getActiveWorkoutSession(athleteId).catch(() => null);
      if (existingActive) {
        setActiveSession(existingActive);
        return existingActive;
      }

      // 2. Create new session only if no active session exists
      const session = await workoutService.startWorkoutSession(payload);
      setActiveSession(session);
      return session;
    } catch (err: any) {
      const parsed = parseApiError(err, 'Failed to start workout session');
      setError(parsed.message);
      // Fallback: If 400 active session conflict returned, hydrate from existing active session
      if (parsed.status === 400 && parsed.message.includes('already has an active workout session')) {
        try {
          const active = await workoutService.getActiveWorkoutSession(athleteId);
          setActiveSession(active);
          return active;
        } catch (activeErr) {
          return null;
        }
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };


  const pauseSession = async (id: string): Promise<WorkoutSession | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await workoutService.pauseWorkoutSession(id);
      setActiveSession(session);
      return session;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to pause workout session';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const resumeSession = async (id: string): Promise<WorkoutSession | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await workoutService.resumeWorkoutSession(id);
      setActiveSession(session);
      return session;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to resume workout session';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const completeSession = async (
    id: string,
    payload: WorkoutSessionCompleteRequest = {}
  ): Promise<WorkoutSession | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await workoutService.completeWorkoutSession(id, payload);
      setActiveSession(null);
      return session;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to complete workout session';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSession = async (
    id: string,
    payload: WorkoutSessionCancelRequest = {}
  ): Promise<WorkoutSession | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await workoutService.cancelWorkoutSession(id, payload);
      setActiveSession(null);
      return session;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to cancel workout session';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  return {
    activeSession,
    isLoading,
    error,
    fetchActiveSession,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    cancelSession,
  };
};
