import api from './axios'

export const eodApi = {
  runNow:       () => api.post('/api/eod/run-now'),
  getStatus:    () => api.get('/api/eod/status'),
  getHistory:   (params) => api.get('/api/eod/history', { params }),
  getJobDetail: (jobId) => api.get(`/api/eod/history/${jobId}`),
}
