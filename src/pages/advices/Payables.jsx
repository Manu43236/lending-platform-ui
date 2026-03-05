import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const Payables = () => (
  <>
    <PageHeader
      title="Payables"
      subtitle="Pending disbursements, refunds and vendor payables"
      breadcrumbs={[{ label: 'Advices' }, { label: 'Payables' }]}
    />
    <ComingSoon title="Payables" description="Disbursement payables, refunds, vendor and commission payables." />
  </>
)

export default Payables
