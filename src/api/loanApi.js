import api from './axios'

export const loanApi = {
  // Get all loans with filters + pagination
  getAll: (params) => api.get('/api/loans', { params }),

  // Get loan by ID
  getById: (id) => api.get(`/api/loans/${id}`),

  // Get loan by loan number
  getByLoanNumber: (loanNumber) => api.get(`/api/loans/loan-number/${loanNumber}`),

  // Get loans by customer ID
  getByCustomerId: (customerId, params) =>
    api.get(`/api/loans/customer/${customerId}`, { params }),

  // Create loan
  create: (data) => api.post('/api/loans', data),

  // Get loan timeline
  getTimeline: (loanNumber) => api.get(`/api/loans/${loanNumber}/timeline`),

  // Close loan
  close: (loanNumber) => api.post(`/api/loans/${loanNumber}/close`),
}
