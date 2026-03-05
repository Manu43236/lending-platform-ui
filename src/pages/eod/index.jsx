import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const EOD = () => (
  <>
    <PageHeader
      title="End of Day Processing"
      subtitle="EOD status, steps tracker and history"
      breadcrumbs={[{ label: 'EOD' }]}
    />
    <ComingSoon title="EOD Dashboard" description="EOD steps tracker — DPD update, NPA classification, report generation. Manual trigger." />
  </>
)

export default EOD
