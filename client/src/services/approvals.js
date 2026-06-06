import { api } from './api';

export const approvalService = {
  getAll: () => api.get('/approvals'),
  create: (data) => api.post('/approvals', data),
  update: (id, data) => api.put(`/approvals/${id}`, data),
};
