import axios from 'axios'
import { Modal } from 'antd'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://money-moment-lending.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let sessionModalOpen = false

// Handle 401/403 — session expired or unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (!sessionModalOpen) {
        sessionModalOpen = true
        localStorage.clear()
        Modal.confirm({
          title: 'Session Expired',
          content: 'Your session has expired or you are not authorized. Please log in again to continue.',
          okText: 'Login Again',
          cancelButtonProps: { style: { display: 'none' } },
          onOk: () => {
            sessionModalOpen = false
            window.location.href = '/login'
          },
          onCancel: () => {
            sessionModalOpen = false
            window.location.href = '/login'
          },
        })
      }
    }
    return Promise.reject(error)
  }
)

export default api
