import api from './axios'

export const aiApi = {
  chat: (sessionId, message, customerId = null) => {
    return api.post('/api/ai/chat', { sessionId, message, customerId })
  },
}
