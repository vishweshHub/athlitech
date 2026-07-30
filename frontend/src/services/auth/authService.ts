import { api } from '../api/api';
import { ENDPOINTS } from '../api/endpoints';
import { LoginResponse, User } from '../../types';

export const authService = {
  login: async (credentials: Record<string, any>): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  register: async (userData: Record<string, any>): Promise<User> => {
    const response = await api.post<User>(ENDPOINTS.AUTH.REGISTER, userData);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ access_token: string; refresh_token: string }> => {
    const response = await api.post(ENDPOINTS.AUTH.REFRESH, { refresh_token: refreshToken });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>(ENDPOINTS.AUTH.ME);
    return response.data;
  },
};
