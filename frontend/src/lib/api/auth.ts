import { apiClient } from './client';

export const authApi = {
    login: async (credentials: { email: string; password: string }) => {
        const response = await apiClient.post('/auth/login', credentials);
        return response.data;
    },

    register: async (data: { name: string; email: string; password: string; role: string }) => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    },
};
