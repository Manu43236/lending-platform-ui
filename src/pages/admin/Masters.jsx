import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const AdminMasters = () => (
  <>
    <PageHeader
      title="Master Data"
      subtitle="Loan types, interest rates, processing fees and tenure configuration"
      breadcrumbs={[{ label: 'Admin' }, { label: 'Masters' }]}
    />
    <ComingSoon title="Master Data Management" description="Configure loan products — interest rate slabs, processing fee rules, tenure options, document types and penalty configs." />
  </>
)

export default AdminMasters
