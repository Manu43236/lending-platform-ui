import api from './axios'

export const masterApi = {
  // Loan types
  getLoanTypes: () => api.get('/api/masters/loan-types'),

  // Loan purposes
  getLoanPurposes: () => api.get('/api/masters/loan-purposes'),

  // Loan statuses
  getLoanStatuses: () => api.get('/api/masters/loan-statuses'),

  // Disbursement modes
  getDisbursementModes: () => api.get('/api/masters/disbursement-modes'),

  // Tenures by loan type
  getTenures: (loanTypeCode) =>
    api.get('/api/masters/tenures', { params: { loanTypeCode } }),

  // Processing fee config by loan type
  getProcessingFeeConfig: (loanTypeCode) =>
    api.get(`/api/masters/processing-fee/${loanTypeCode}`),

  // All processing fee configs
  getAllProcessingFees: () => api.get('/api/masters/processing-fees'),

  // All interest rate configs
  getInterestRates: () => api.get('/api/masters/interest-rates'),

  // Applicable interest rate
  getApplicableRate: (params) =>
    api.get('/api/masters/interest-rate', { params }),

  // Document types
  getDocumentTypes: (applicableFor) =>
    api.get('/api/masters/document-types', {
      params: applicableFor ? { applicableFor } : {},
    }),

  // All roles
  getRoles: () => api.get('/api/masters/roles'),
}
