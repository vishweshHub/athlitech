/**
 * AthliTech Frontend System Constants.
 *
 * Centralizes storage keys, role names, and pagination defaults.
 */

export const STORAGE_KEYS = {
  TOKEN_KEY: 'athlitech_access_token',
  REFRESH_TOKEN_KEY: 'athlitech_refresh_token',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  ATHLETE: 'athlete',
} as const;

export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;
