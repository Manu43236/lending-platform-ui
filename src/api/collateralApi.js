import api from './axios'

export const collateralApi = {
  // Register collateral
  register: (data) => api.post('/api/collateral', data),

  // Get collateral by loan number
  getByLoan: (loanNumber) => api.get(`/api/collateral/loan/${loanNumber}`),

  // Release collateral
  release: (loanNumber) => api.put(`/api/collateral/release/${loanNumber}`),
}
