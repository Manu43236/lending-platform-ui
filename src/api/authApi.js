import api from './axios'

export const authApi = {
  login: (data) => api.post('/api/auth/login', data),
}
