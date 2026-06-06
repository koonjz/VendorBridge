import { api } from './api';

export const poService = {
  getAll: () => api.get('/purchase-orders'),
  create: (data) => api.post('/purchase-orders', data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data),
};
