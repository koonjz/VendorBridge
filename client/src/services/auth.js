import { api } from './api';

export const authService = {
  login: async (email, password) => {
    return await api.post('/auth/login', { email, password });
  }
};
