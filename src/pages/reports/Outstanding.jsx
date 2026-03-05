import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const OutstandingReport = () => (
  <>
    <PageHeader
      title="Outstanding Report"
      subtitle="Loan portfolio outstanding as of date"
      breadcrumbs={[{ label: 'Reports' }, { label: 'Outstanding' }]}
    />
    <ComingSoon title="Outstanding Portfolio Report" description="Outstanding principal, interest, overdue and total AUM." />
  </>
)

export default OutstandingReport
