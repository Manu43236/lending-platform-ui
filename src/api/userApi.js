import api from './axios'

export const userApi = {
  // Get all users
  getAll: (params) => api.get('/api/users', { params }),

  // Get user by ID
  getById: (id) => api.get(`/api/users/${id}`),

  // Get user by employee ID
  getByEmployeeId: (employeeId) => api.get(`/api/users/employee/${employeeId}`),

  // Get users by role
  getByRole: (roleCode, params) =>
    api.get(`/api/users/role/${roleCode}`, { params }),

  // Get users by branch
  getByBranch: (branchCode, params) =>
    api.get(`/api/users/branch/${branchCode}`, { params }),

  // Create user
  create: (data) => api.post('/api/users', data),

  // Bulk create users
  bulkCreate: (data) => api.post('/api/users/bulk', data),

  // Assign roles
  assignRoles: (employeeId, data) =>
    api.post(`/api/users/${employeeId}/roles`, data),

  // Remove role
  removeRole: (employeeId, roleCode) =>
    api.delete(`/api/users/${employeeId}/roles/${roleCode}`),

  // Profile
  getMyProfile: () => api.get('/api/profile/me'),
  updateMyProfile: (data) => api.put('/api/profile/me', data),
  changePassword: (data) => api.put('/api/profile/me/change-password', data),
}
