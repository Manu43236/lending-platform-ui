import { Outlet, Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const AuthLayout = () => {
  const { token } = useAuthStore()

  if (token) return <Navigate to="/dashboard" replace />

  return <Outlet />
}

export default AuthLayout
