import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const AdminRoles = () => (
  <>
    <PageHeader
      title="Role Management"
      subtitle="System roles and access control configuration"
      breadcrumbs={[{ label: 'Admin' }, { label: 'Roles' }]}
    />
    <ComingSoon title="Role Management" description="View and manage system roles — LOAN_OFFICER, CREDIT_MANAGER, BRANCH_MANAGER, REGIONAL_MANAGER, OPERATIONS, COLLECTIONS, ADMIN." />
  </>
)

export default AdminRoles
