import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const DisbursementReport = () => (
  <>
    <PageHeader
      title="Disbursement Report"
      subtitle="Loan disbursements by date, branch and product"
      breadcrumbs={[{ label: 'Reports' }, { label: 'Disbursement' }]}
    />
    <ComingSoon title="Disbursement Report" description="Date-wise disbursement summary with filters by branch, loan type." />
  </>
)

export default DisbursementReport
