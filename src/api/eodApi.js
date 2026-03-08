import api from './axios'

export const eodApi = {
  runNow:     () => api.post('/api/eod/run-now'),
  getHistory: (params) => api.get('/api/eod/history', { params }),
}
