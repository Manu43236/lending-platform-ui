import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const MISReport = () => (
  <>
    <PageHeader
      title="MIS Report"
      subtitle="Management information system — portfolio summary and KPIs"
      breadcrumbs={[{ label: 'Reports' }, { label: 'MIS' }]}
    />
    <ComingSoon title="MIS Report" description="Portfolio health dashboard — AUM, PAR, NPA ratio, collection efficiency, branch-wise performance." />
  </>
)

export default MISReport
