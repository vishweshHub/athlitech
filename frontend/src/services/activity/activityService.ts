import { api } from '../api/api';
import { ENDPOINTS } from '../api/endpoints';
import { ActivityFeedResponse } from '../../types';

export const activityService = {
  getActivityFeed: async (athleteId?: string, cursor?: string, limit = 10): Promise<ActivityFeedResponse> => {
    const params: Record<string, any> = { limit };
    if (athleteId) params.athlete_id = athleteId;
    if (cursor) params.cursor = cursor;

    const response = await api.get<ActivityFeedResponse>(ENDPOINTS.ACTIVITY_FEED.GET_FEED, { params });
    return response.data;
  },
};
