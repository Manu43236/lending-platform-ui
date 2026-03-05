import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const LoanClosure = () => (
  <>
    <PageHeader
      title="Loan Closure"
      subtitle="Close or foreclose loan accounts"
      breadcrumbs={[{ label: 'LMS' }, { label: 'Loan Closure' }]}
    />
    <ComingSoon title="Loan Closure" description="Regular closure and foreclosure with closure summary." />
  </>
)

export default LoanClosure
