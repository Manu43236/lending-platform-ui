import api from './axios'

export const disbursementApi = {
  // Get all disbursements (paginated)
  getAll: (params) => api.get('/api/disbursements', { params }),

  // Process disbursement
  process: (data) => api.post('/api/disbursements', data),

  // Get disbursement by loan number
  getByLoan: (loanNumber) => api.get(`/api/disbursements/loan/${loanNumber}`),

  // Schedule EMIs for a loan
  scheduleEmis: (loanNumber) =>
    api.post(`/api/disbursements/emi/scheduleEmis/${loanNumber}`),
}
