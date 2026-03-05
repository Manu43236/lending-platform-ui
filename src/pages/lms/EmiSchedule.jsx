import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const EmiSchedule = () => (
  <>
    <PageHeader
      title="EMI Schedule"
      subtitle="Repayment schedule for loan accounts"
      breadcrumbs={[{ label: 'LMS' }, { label: 'EMI Schedule' }]}
    />
    <ComingSoon title="EMI Schedule" description="Due dates, principal, interest breakup, payment status per EMI." />
  </>
)

export default EmiSchedule
