import { api } from './api';

export const quotationService = {
  getAll: () => api.get('/quotations'),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
};
