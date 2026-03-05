import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const CollectionReport = () => (
  <>
    <PageHeader
      title="Collection Report"
      subtitle="EMI collections by date, branch and product"
      breadcrumbs={[{ label: 'Reports' }, { label: 'Collection' }]}
    />
    <ComingSoon title="Collection Report" description="Date-wise collection summary — paid, overdue, bounce analysis." />
  </>
)

export default CollectionReport
