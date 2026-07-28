import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { User } from '../../types';

const ACCESS_TOKEN_KEY = 'athlitech_access_token';
const REFRESH_TOKEN_KEY = 'athlitech_refresh_token';
const USER_KEY = 'athlitech_user_data';

export const getAccessToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  }
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error reading access token from SecureStore', error);
    return null;
  }
};

export const setAccessToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving access token to SecureStore', error);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  }
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error reading refresh token from SecureStore', error);
    return null;
  }
};

export const setRefreshToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving refresh token to SecureStore', error);
  }
};

export const getUser = async (): Promise<User | null> => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      const json = localStorage.getItem(USER_KEY);
      return json ? JSON.parse(json) : null;
    }
    return null;
  }
  try {
    const json = await SecureStore.getItemAsync(USER_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('Error reading user from SecureStore', error);
    return null;
  }
};

export const setUser = async (user: User): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to SecureStore', error);
  }
};

export const clearAuthStorage = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('Error clearing auth storage', error);
  }
};
