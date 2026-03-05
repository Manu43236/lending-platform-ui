import api from './axios'

export const documentApi = {
  // Get all documents
  getAll: (params) => api.get('/api/documents', { params }),

  // Get documents by customer number
  getByCustomer: (customerNumber, params) =>
    api.get(`/api/documents/customer/${customerNumber}`, { params }),

  // Get documents by loan number
  getByLoan: (loanNumber, params) =>
    api.get(`/api/documents/loan/${loanNumber}`, { params }),

  // Upload document (multipart)
  upload: (formData) =>
    api.post('/api/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Verify document
  verify: (documentNumber, data) =>
    api.put(`/api/documents/${documentNumber}/verify`, data),
}
