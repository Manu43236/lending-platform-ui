import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const AdminUsers = () => (
  <>
    <PageHeader
      title="User Management"
      subtitle="Manage system users, roles and branch assignments"
      breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
    />
    <ComingSoon title="User Management" description="Create and manage users — assign roles (Loan Officer, Credit Manager, Branch Manager, etc.) and branch codes." />
  </>
)

export default AdminUsers
