import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const Payments = () => (
  <>
    <PageHeader
      title="Payments"
      subtitle="Record and track EMI payments"
      breadcrumbs={[{ label: 'LMS' }, { label: 'Payments' }]}
    />
    <ComingSoon title="Payment Processing" description="Record EMI payments — NACH, UPI, NEFT, RTGS, Cash, Cheque." />
  </>
)

export default Payments
