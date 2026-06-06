import { api } from './api';

export const rfqService = {
  getAll: () => api.get('/rfqs'),
  getById: (id) => api.get(`/rfqs/${id}`),
  create: (data) => api.post('/rfqs', data),
  update: (id, data) => api.put(`/rfqs/${id}`, data),
  delete: (id) => api.delete(`/rfqs/${id}`),
};
