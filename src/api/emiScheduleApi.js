import api from './axios'

export const emiScheduleApi = {
  getAll: (params) => api.get('/api/emi-schedules', { params }),
}
