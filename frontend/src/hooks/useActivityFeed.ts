import { useState, useCallback, useEffect } from 'react';
import { activityService } from '../services/activity/activityService';
import { ActivityFeedDayGroup, ActivityFeedResponse } from '../types';

export const useActivityFeed = (athleteId?: string, limit = 10) => {
  const [days, setDays] = useState<ActivityFeedDayGroup[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response: ActivityFeedResponse = await activityService.getActivityFeed(athleteId, undefined, limit);
        setDays(response.days || []);
        setNextCursor(response.next_cursor);
      } catch (err: any) {
        const msg = err.response?.data?.detail || err.message || 'Failed to fetch activity feed';
        setError(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [athleteId, limit]
  );

  const fetchNextPage = async () => {
    if (!nextCursor || isLoading) return;

    try {
      const response: ActivityFeedResponse = await activityService.getActivityFeed(athleteId, nextCursor, limit);
      setDays((prevDays) => [...prevDays, ...(response.days || [])]);
      setNextCursor(response.next_cursor);
    } catch (err: any) {
      console.error('Failed to fetch next page of activity feed', err);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return {
    days,
    nextCursor,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchFeed(true),
    fetchNextPage,
  };
};
