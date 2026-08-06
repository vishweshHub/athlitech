/**
 * AthliTech Reusable Granular Permission Utility
 */

export const PERMISSIONS = {
  VIEW_ATHLETE_PROFILES: 'view_athlete_profiles',
  ASSIGN_WORKOUTS: 'assign_workouts',
  EDIT_WORKOUTS: 'edit_workouts',
  MANAGE_ORGANIZATIONS: 'manage_organizations',
  INVITE_MEMBERS: 'invite_members',
  MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_COACHES: 'manage_coaches',
  MANAGE_ATHLETES: 'manage_athletes',
  VIEW_SELF: 'view_self',
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
} as const;

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_ATHLETES,
    PERMISSIONS.MANAGE_COACHES,
    PERMISSIONS.MANAGE_ORGANIZATIONS,
    PERMISSIONS.INVITE_MEMBERS,
    PERMISSIONS.MANAGE_SUBSCRIPTIONS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_ATHLETE_PROFILES,
    PERMISSIONS.ASSIGN_WORKOUTS,
    PERMISSIONS.EDIT_WORKOUTS,
    PERMISSIONS.VIEW_SELF,
  ],
  organization: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_ATHLETES,
    PERMISSIONS.MANAGE_COACHES,
    PERMISSIONS.MANAGE_ORGANIZATIONS,
    PERMISSIONS.INVITE_MEMBERS,
    PERMISSIONS.MANAGE_SUBSCRIPTIONS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_ATHLETE_PROFILES,
    PERMISSIONS.ASSIGN_WORKOUTS,
    PERMISSIONS.EDIT_WORKOUTS,
    PERMISSIONS.VIEW_SELF,
  ],
  coach: [
    PERMISSIONS.MANAGE_ATHLETES,
    PERMISSIONS.VIEW_ATHLETE_PROFILES,
    PERMISSIONS.ASSIGN_WORKOUTS,
    PERMISSIONS.EDIT_WORKOUTS,
    PERMISSIONS.INVITE_MEMBERS,
    PERMISSIONS.MANAGE_SUBSCRIPTIONS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_SELF,
  ],
  athlete: [
    PERMISSIONS.VIEW_SELF,
    PERMISSIONS.VIEW_ATHLETE_PROFILES,
    PERMISSIONS.MANAGE_SUBSCRIPTIONS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
};

export function hasPermission(
  role: string | null | undefined,
  permission: string,
  customPermissions?: string[]
): boolean {
  if (!role) return false;
  if (customPermissions && customPermissions.includes(permission)) {
    return true;
  }
  const normRole = role.toLowerCase().trim();
  const perms = DEFAULT_ROLE_PERMISSIONS[normRole] || DEFAULT_ROLE_PERMISSIONS['athlete'] || [];
  return perms.includes(permission);
}
