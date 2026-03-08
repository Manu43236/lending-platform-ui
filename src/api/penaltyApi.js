import api from './axios'

export const penaltyApi = {
  // Get penalty type configs
  getConfigs: () => api.get('/api/penalties/configs'),

  // Get all applied penalties (paginated)
  getAll: (params) => api.get('/api/penalties', { params }),

  // Apply penalty
  apply: (emiScheduleId, penaltyCode) =>
    api.post('/api/penalties/apply', null, {
      params: { emiScheduleId, penaltyCode },
    }),

  // Get penalties by loan number
  getByLoan: (loanNumber, params) =>
    api.get(`/api/penalties/loan/${loanNumber}`, { params }),

  // Get penalties by EMI schedule
  getByEmi: (emiScheduleId) =>
    api.get(`/api/penalties/emi/${emiScheduleId}`),

  // Waive penalty
  waive: (penaltyId, waivedByUserId, reason) =>
    api.post(`/api/penalties/waive/${penaltyId}`, null, {
      params: { waivedByUserId, reason },
    }),
}
