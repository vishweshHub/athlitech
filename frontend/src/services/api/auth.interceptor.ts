import { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '../storage/secureStore';
import { ENDPOINTS, API_BASE_URL } from './endpoints';
import axios from 'axios';

export const setupAuthInterceptors = (axiosInstance: AxiosInstance): void => {
  // Request Interceptor: Attach Bearer Token
  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getAccessToken();
      if (token && config.headers) {
        if (typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response Interceptor: Handle 401 & Automatic Refresh
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = await getRefreshToken();
          if (!refreshToken) {
            return Promise.reject(error);
          }

          // Call refresh endpoint directly using clean axios instance
          const refreshResponse = await axios.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: new_refresh_token } = refreshResponse.data;

          await setAccessToken(access_token);
          if (new_refresh_token) {
            await setRefreshToken(new_refresh_token);
          }

          if (originalRequest.headers) {
            if (typeof originalRequest.headers.set === 'function') {
              originalRequest.headers.set('Authorization', `Bearer ${access_token}`);
            } else {
              originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
            }
          }

          return axiosInstance(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};
