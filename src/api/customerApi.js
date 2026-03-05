import api from './axios'

export const customerApi = {
  // Get all customers with filters + pagination
  getAll: (params) => api.get('/api/customers', { params }),

  // Get customer by ID
  getById: (id) => api.get(`/api/customers/${id}`),

  // Create customer
  create: (data) => api.post('/api/customers', data),

  // Update customer
  update: (id, data) => api.put(`/api/customers/${id}`, data),

  // Soft delete customer
  deactivate: (id) => api.delete(`/api/customers/${id}`),
}
