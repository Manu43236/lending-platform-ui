import api from './axios'

export const eodApi = {
  // Trigger EOD manually
  runNow: () => api.post('/api/eod/run-now'),

  // Health check (includes next EOD schedule)
  health: () => api.get('/api/health'),
}
