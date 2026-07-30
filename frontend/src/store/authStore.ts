import { create } from 'zustand';
import { User, AuthTokens } from '../types';
import {
  getAccessToken,
  getRefreshToken,
  getUser,
  setAccessToken,
  setRefreshToken,
  setUser as setStorageUser,
  clearAuthStorage,
} from '../services/storage/secureStore';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, tokens: AuthTokens) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: (tokens: AuthTokens) => Promise<void>;
  initializeAuth: () => Promise<void>;
  setUser: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (user: User, tokens: AuthTokens) => {
    await setAccessToken(tokens.access_token);
    await setRefreshToken(tokens.refresh_token);
    await setStorageUser(user);
    set({
      user,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    await clearAuthStorage();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  refreshSession: async (tokens: AuthTokens) => {
    await setAccessToken(tokens.access_token);
    if (tokens.refresh_token) {
      await setRefreshToken(tokens.refresh_token);
    }
    set((state) => ({
      ...state,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || state.refreshToken,
      isAuthenticated: true,
    }));
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();
      const user = await getUser();

      if (accessToken && user) {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth state', error);
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: async (user: User) => {
    await setStorageUser(user);
    set((state) => ({ ...state, user }));
  },
}));
