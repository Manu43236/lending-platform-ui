import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const Disbursements = () => (
  <>
    <PageHeader
      title="Disbursements"
      subtitle="Process and track loan disbursements"
      breadcrumbs={[{ label: 'Disbursements' }]}
    />
    <ComingSoon title="Disbursement Processing" description="Disburse approved loans — NEFT, RTGS, IMPS. Track UTR and status." />
  </>
)

export default Disbursements
