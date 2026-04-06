import api from './axios'

export const aiApi = {
  chat: (sessionId, message) => {
    return api.post('/api/ai/chat', { sessionId, message })
  },
}
