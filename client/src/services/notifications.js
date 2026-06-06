import { api } from './api';

export const notificationService = {
  getAll: () => api.get('/notifications'),
  create: (data) => api.post('/notifications', data),
  update: (id, data) => api.put(`/notifications/${id}`, data),
};
