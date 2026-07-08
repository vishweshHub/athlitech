export const ROUTES = {
  login: '/',
  register: '/register',
  dashboard: '/dashboard',
  athleteDashboard: '/athlete-dashboard',
  athleteDetails: '/athlete-details',
  coachDashboard: '/coach-dashboard',
  coachDetails: '/coach-details',
  modal: '/modal',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];
