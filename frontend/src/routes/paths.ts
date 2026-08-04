export const ROUTES = {
  landing: '/landing',
  login: '/',
  register: '/register',
  roleHub: '/role-hub',
  exploreRole: '/explore-role',
  planSelection: '/plan-selection',
  mockCheckout: '/mock-checkout',
  planConfirmation: '/plan-confirmation',
  dashboard: '/dashboard',



  athleteDashboard: '/athlete-dashboard',
  athleteDetails: '/athlete-details',
  coachDashboard: '/coach-dashboard',
  coachDetails: '/coach-details',
  modal: '/modal',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];
