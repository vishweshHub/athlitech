export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  TRAINING: {
    TODAY: '/training/today',
    PLANS: '/training-plans/',
    PLAN_BY_ID: (id: string) => `/training-plans/${id}`,
  },
  WORKOUT_SESSION: {
    START: '/workout-sessions/start',
    PAUSE: (id: string) => `/workout-sessions/${id}/pause`,
    RESUME: (id: string) => `/workout-sessions/${id}/resume`,
    COMPLETE: (id: string) => `/workout-sessions/${id}/complete`,
    CANCEL: (id: string) => `/workout-sessions/${id}/cancel`,
    ACTIVE: '/workout-sessions/active',
    BY_ID: (id: string) => `/workout-sessions/${id}`,
  },
  PERFORMANCE_LOG: {
    CREATE: '/performance-logs',
    BY_ID: (id: string) => `/performance-logs/${id}`,
    BY_SESSION: (sessionId: string) => `/performance-logs/workout-session/${sessionId}`,
    BY_ATHLETE: (athleteId: string) => `/performance-logs/athlete/${athleteId}`,
  },
  METRIC_DEFINITION: {
    LIST: '/metric-definitions',
    CREATE: '/metric-definitions',
  },
  ACTIVITY_FEED: {
    GET_FEED: '/activity-feed',
  },
  SAVED_WORKOUTS: {
    LIST: '/athletes/me/saved-workouts',
    SAVE: '/athletes/me/saved-workouts',
    REMOVE: (templateId: string) => `/athletes/me/saved-workouts/${templateId}`,
  },
};

