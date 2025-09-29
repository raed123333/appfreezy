import { TokenManager } from './TokenManager';

// Enhanced API client with automatic token handling
export const apiClient = {
  get: async (url: string) => {
    const token = await TokenManager.getToken();
    return fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  },

  post: async (url: string, data: any) => {
    const token = await TokenManager.getToken();
    return fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  put: async (url: string, data: any) => {
    const token = await TokenManager.getToken();
    return fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  delete: async (url: string) => {
    const token = await TokenManager.getToken();
    return fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};