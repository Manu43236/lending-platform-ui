import api from './axios'

export const emiPaymentApi = {
  getAll:     (params) => api.get('/api/emi-payments', { params }),
  process:    (data)   => api.post('/api/emi-payments', data),
  bulkClear:  (data)   => api.post('/api/emi-payments/bulk-clear', data),
}
