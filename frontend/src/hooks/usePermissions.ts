import { useMemo } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { hasPermission, PERMISSIONS, PermissionType } from '@/utils/permissions';

export function usePermissions() {
  const { currentWorkspace, statusData } = useWorkspace();

  const activeRole = currentWorkspace || 'athlete';

  const can = useMemo(() => {
    return (permission: PermissionType | string): boolean => {
      return hasPermission(activeRole, permission);
    };
  }, [activeRole]);

  return {
    activeRole,
    can,
    PERMISSIONS,
    hasPermission: (permission: PermissionType | string) => can(permission),
  };
}
