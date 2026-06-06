import { api } from './api';

export const invoiceService = {
  getAll: () => api.get('/invoices'),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
};
