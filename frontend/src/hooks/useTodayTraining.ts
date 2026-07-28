import { useState, useEffect, useCallback, useRef } from 'react';
import { trainingService } from '../services/training/trainingService';
import { TodayTrainingResponse } from '../types';

export const useTodayTraining = (athleteId?: string, targetDate?: string) => {
  const [data, setData] = useState<TodayTrainingResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isUsingCache, setIsUsingCache] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cachedData = useRef<TodayTrainingResponse | null>(null);

  const fetchTodayTraining = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else if (!cachedData.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await trainingService.getTodayTraining(athleteId, targetDate);
      setData(response);
      cachedData.current = response;
      setIsUsingCache(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch today training';
      if (cachedData.current) {
        setData(cachedData.current);
        setIsUsingCache(true);
        setError('Unable to refresh. Showing last synced training.');
      } else {
        setError(errorMessage);
        setData(null);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [athleteId, targetDate]);

  useEffect(() => {
    fetchTodayTraining();
  }, [fetchTodayTraining]);

  return {
    todayTraining: data,
    isLoading: isLoading && !data,
    isRefreshing,
    isUsingCache,
    error,
    refetch: () => fetchTodayTraining(true),
  };
};
