import api from './axios'

export const creditAssessmentApi = {
  // Create credit assessment
  create: (data) => api.post('/api/credit-assessment', data),

  // Get assessment by ID
  getById: (id) => api.get(`/api/credit-assessment/${id}`),

  // Get latest assessment by loan number
  getByLoanNumber: (loanNumber) =>
    api.get(`/api/credit-assessment/loan/${loanNumber}`),
}
