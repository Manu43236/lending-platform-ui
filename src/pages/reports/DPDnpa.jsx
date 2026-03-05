import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const DPDNpaReport = () => (
  <>
    <PageHeader
      title="DPD & NPA Report"
      subtitle="Days past due and non-performing assets classification"
      breadcrumbs={[{ label: 'Reports' }, { label: 'DPD & NPA' }]}
    />
    <ComingSoon title="DPD & NPA Report" description="DPD bucket-wise loan classification — SMA0, SMA1, SMA2, NPA with aging analysis." />
  </>
)

export default DPDNpaReport
