import { api } from './api';

export const activityLogService = {
  getAll: () => api.get('/activity-logs'),
  create: (data) => api.post('/activity-logs', data),
};
