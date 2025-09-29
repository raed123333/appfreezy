import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

export const TokenManager = {
  // Save token securely
  saveToken: async (token: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  },

  // Retrieve token
  getToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  },

  // Delete token (logout)
  deleteToken: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error deleting token:', error);
      throw error;
    }
  },

  // Save user data
  saveUser: async (userData: any): Promise<void> => {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  },

  // Get user data
  getUser: async (): Promise<any> => {
    try {
      const userData = await SecureStore.getItemAsync(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  },

  // Clear all auth data
  clearAuthData: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  }
};