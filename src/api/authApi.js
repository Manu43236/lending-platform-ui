import api from './axios'

export const authApi = {
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  getLoginHistory: (params) => api.get('/api/auth/login-history', { params }),
  getLoginHistoryByUsername: (username, params) => api.get(`/api/auth/login-history/${username}`, { params }),
}
