import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const OverdueLoans = () => (
  <>
    <PageHeader
      title="Overdue Loans"
      subtitle="Loans with missed EMI payments"
      breadcrumbs={[{ label: 'Collections' }, { label: 'Overdue Loans' }]}
    />
    <ComingSoon title="Overdue Loan Accounts" description="Loans past due date with DPD, overdue amount and collection status." />
  </>
)

export default OverdueLoans
