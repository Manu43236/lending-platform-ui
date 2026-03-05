import { notification, message } from 'antd'

// Normalize error from API response
export const getErrorMessage = (error) => {
  // Spring Boot GlobalExceptionHandler response format
  if (error.response?.data?.message) return error.response.data.message
  if (error.response?.data?.error) return error.response.data.error
  if (error.message === 'Network Error') return 'Unable to connect to server. Please check your connection.'
  if (error.response?.status === 403) return 'You do not have permission to perform this action.'
  if (error.response?.status === 404) return 'The requested resource was not found.'
  if (error.response?.status === 500) return 'Internal server error. Please try again later.'
  return error.message || 'Something went wrong. Please try again.'
}

// Show error notification (top-right, for async operations)
export const showError = (error, title = 'Error') => {
  notification.error({
    message: title,
    description: getErrorMessage(error),
    placement: 'topRight',
    duration: 5,
  })
}

// Show success notification
export const showSuccess = (msg, title = 'Success') => {
  notification.success({
    message: title,
    description: msg,
    placement: 'topRight',
    duration: 3,
  })
}

// Show warning notification
export const showWarning = (msg, title = 'Warning') => {
  notification.warning({
    message: title,
    description: msg,
    placement: 'topRight',
    duration: 4,
  })
}

// Show quick inline message (bottom center, for simple actions)
export const showMessage = {
  success: (msg) => message.success(msg),
  error: (msg) => message.error(msg),
  warning: (msg) => message.warning(msg),
  loading: (msg) => message.loading(msg),
}
