import { api } from '../api/api';
import { ENDPOINTS } from '../api/endpoints';
import { PerformanceLog, PerformanceLogCreateRequest, MetricDefinition } from '../../types';

export const performanceService = {
  createPerformanceLog: async (payload: PerformanceLogCreateRequest): Promise<PerformanceLog> => {
    const response = await api.post<PerformanceLog>(ENDPOINTS.PERFORMANCE_LOG.CREATE, payload);
    return response.data;
  },

  getPerformanceLogById: async (id: string): Promise<PerformanceLog> => {
    const response = await api.get<PerformanceLog>(ENDPOINTS.PERFORMANCE_LOG.BY_ID(id));
    return response.data;
  },

  getLogsByWorkoutSession: async (sessionId: string): Promise<PerformanceLog[]> => {
    const response = await api.get<PerformanceLog[]>(ENDPOINTS.PERFORMANCE_LOG.BY_SESSION(sessionId));
    return response.data;
  },

  getLogsByAthlete: async (athleteId: string, skip = 0, limit = 100): Promise<PerformanceLog[]> => {
    const response = await api.get<PerformanceLog[]>(ENDPOINTS.PERFORMANCE_LOG.BY_ATHLETE(athleteId), {
      params: { skip, limit },
    });
    return response.data;
  },

  getMetricDefinitions: async (): Promise<MetricDefinition[]> => {
    const response = await api.get<MetricDefinition[]>(ENDPOINTS.METRIC_DEFINITION.LIST);
    return response.data;
  },
};
