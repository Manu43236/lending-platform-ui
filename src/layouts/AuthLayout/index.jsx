import { Outlet, Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const AuthLayout = () => {
  const { token } = useAuthStore()

  if (token) return <Navigate to="/dashboard" replace />

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1B3A6B 0%, #2E5FA3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Outlet />
    </div>
  )
}

export default AuthLayout
