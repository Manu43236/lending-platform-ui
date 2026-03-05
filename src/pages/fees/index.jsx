import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const Fees = () => (
  <>
    <PageHeader
      title="Fees & Charges"
      subtitle="Processing fees, penal charges and waivers"
      breadcrumbs={[{ label: 'Fees & Charges' }]}
    />
    <ComingSoon title="Fee Management" description="Fee configuration, collection history and waiver approvals." />
  </>
)

export default Fees
