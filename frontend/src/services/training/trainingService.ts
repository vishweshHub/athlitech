import { api } from '../api/api';
import { ENDPOINTS } from '../api/endpoints';
import { TodayTrainingResponse } from '../../types';

export const trainingService = {
  getTodayTraining: async (athleteId?: string, targetDate?: string): Promise<TodayTrainingResponse> => {
    const params: Record<string, string> = {};
    if (athleteId) params.athlete_id = athleteId;
    if (targetDate) params.target_date = targetDate;

    const response = await api.get<TodayTrainingResponse>(ENDPOINTS.TRAINING.TODAY, { params });
    return response.data;
  },

  getTrainingPlans: async (athleteId?: string): Promise<any[]> => {
    const params: Record<string, string> = {};
    if (athleteId) params.athlete_id = athleteId;

    const response = await api.get<any[]>(ENDPOINTS.TRAINING.PLANS, { params });
    return response.data;
  },

  getTrainingPlanById: async (planId: string): Promise<any> => {
    const response = await api.get<any>(ENDPOINTS.TRAINING.PLAN_BY_ID(planId));
    return response.data;
  },
};
