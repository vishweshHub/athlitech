import axios from 'axios';
import { API_BASE_URL } from './endpoints';
import { setupAuthInterceptors } from './auth.interceptor';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

setupAuthInterceptors(api);
