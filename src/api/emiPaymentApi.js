import api from './axios'

export const emiPaymentApi = {
  // Process EMI payment
  process: (data) => api.post('/api/emi-payments', data),
}
