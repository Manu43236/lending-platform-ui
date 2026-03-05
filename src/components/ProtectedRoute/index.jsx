import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user } = useAuthStore()

  if (!token) return <Navigate to="/login" replace />

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = user?.roles?.map((r) => r.roleCode) || []
    const hasAccess = allowedRoles.some((role) => userRoles.includes(role))
    if (!hasAccess) return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
