import api from './axios'

export const reportApi = {
  getLoanBook:     ()           => api.get('/api/reports/loan-book'),
  getCollection:   (from, to)   => api.get('/api/reports/collection',   { params: { from, to } }),
  getDpdAging:     ()           => api.get('/api/reports/dpd-aging'),
  getNpa:          ()           => api.get('/api/reports/npa'),
  getDisbursement: (from, to)   => api.get('/api/reports/disbursement', { params: { from, to } }),
}
