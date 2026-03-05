import { Navigate } from 'react-router-dom'
import { Result, Button } from 'antd'
import useAuthStore from '../store/authStore'

const RoleGuard = ({ allowedRoles, children }) => {
  const { user } = useAuthStore()

  // No role restriction — allow all logged-in users
  if (!allowedRoles || allowedRoles.length === 0) return children

  const userRoles = user?.roles?.map((r) => r.roleCode) || []
  const hasAccess = allowedRoles.some((role) => userRoles.includes(role))

  if (!hasAccess) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="You don't have permission to access this page."
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        }
      />
    )
  }

  return children
}

export default RoleGuard
