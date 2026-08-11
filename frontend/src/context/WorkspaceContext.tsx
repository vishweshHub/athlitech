import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { fetchRoleHubStatus, RoleHubStatusResponse } from '@/api/roleHub';
import { getStoredToken } from '@/constants/api';
import { ApiError, parseApiError } from '@/utils/ApiError';

export type WorkspaceRole = 'athlete' | 'coach' | 'organization';

const STORAGE_ACTIVE_WORKSPACE_KEY = 'athlitech_active_workspace';

interface WorkspaceContextType {
  currentWorkspace: WorkspaceRole | null;
  activeRoles: WorkspaceRole[];
  statusData: RoleHubStatusResponse | null;
  isLoading: boolean;
  error: ApiError | null;
  setCurrentWorkspace: (role: WorkspaceRole) => void;
  refreshWorkspaceStatus: () => Promise<RoleHubStatusResponse | null>;
  clearWorkspaceState: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentWorkspace, setCurrentWorkspaceState] = useState<WorkspaceRole | null>(null);
  const [activeRoles, setActiveRoles] = useState<WorkspaceRole[]>([]);
  const [statusData, setStatusData] = useState<RoleHubStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Helper to persist active workspace choice locally
  const persistWorkspace = (role: WorkspaceRole) => {
    setCurrentWorkspaceState(role);
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_WORKSPACE_KEY, role);
    }
  };

  const refreshWorkspaceStatus = useCallback(async (): Promise<RoleHubStatusResponse | null> => {
    setIsLoading(true);
    setError(null);
    const token = await getStoredToken();
    if (!token) {
      setActiveRoles([]);
      setCurrentWorkspaceState(null);
      setStatusData(null);
      setIsLoading(false);
      return null;
    }

    try {
      const data = await fetchRoleHubStatus();
      setStatusData(data);

      const resolvedRoles: WorkspaceRole[] = [];
      if (data?.roles?.athlete?.active) resolvedRoles.push('athlete');
      if (data?.roles?.coach?.active) resolvedRoles.push('coach');
      if (data?.roles?.organization?.active) resolvedRoles.push('organization');

      setActiveRoles(resolvedRoles);

      // Restore previously saved workspace if valid, or auto-assign first available
      let saved: string | null = null;
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        saved = localStorage.getItem(STORAGE_ACTIVE_WORKSPACE_KEY);
      }

      if (saved && resolvedRoles.includes(saved as WorkspaceRole)) {
        setCurrentWorkspaceState(saved as WorkspaceRole);
      } else if (resolvedRoles.length > 0) {
        persistWorkspace(resolvedRoles[0]);
      }

      return data;
    } catch (err) {
      const parsedError = parseApiError(err, 'Failed to refresh workspace status');
      console.warn('[WorkspaceContext] Failed to refresh workspace status:', parsedError);
      setError(parsedError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWorkspaceStatus();
  }, [refreshWorkspaceStatus]);

  const setCurrentWorkspace = (role: WorkspaceRole) => {
    persistWorkspace(role);
    const targetRoute =
      role === 'athlete'
        ? ('/athlete-dashboard' as Href)
        : role === 'coach'
        ? ('/coach-dashboard' as Href)
        : ('/dashboard' as Href);

    router.push(targetRoute);
  };

  const clearWorkspaceState = () => {
    setCurrentWorkspaceState(null);
    setActiveRoles([]);
    setStatusData(null);
    setError(null);
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_ACTIVE_WORKSPACE_KEY);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        activeRoles,
        statusData,
        isLoading,
        error,
        setCurrentWorkspace,
        refreshWorkspaceStatus,
        clearWorkspaceState,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}


export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
