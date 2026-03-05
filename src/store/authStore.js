import { create } from 'zustand'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  login: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.clear()
    set({ token: null, user: null })
  },

  hasRole: (roleCode) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    return user?.roles?.some((r) => r.roleCode === roleCode) || false
  },
}))

export default useAuthStore
