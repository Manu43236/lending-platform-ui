import api from './axios'

export const approvalApi = {
  // Approve or reject loan
  process: (data) => api.post('/api/loan-approval', data),

  // Get approval history by loan number
  getHistory: (loanNumber) =>
    api.get(`/api/loan-approval/history/${loanNumber}`),
}
