import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const DPDBuckets = () => (
  <>
    <PageHeader
      title="DPD Buckets"
      subtitle="Days Past Due bucket-wise loan classification"
      breadcrumbs={[{ label: 'Collections' }, { label: 'DPD Buckets' }]}
    />
    <ComingSoon title="DPD Bucket Analysis" description="0-30 / 30-60 / 60-90 / 90+ DPD bucket view with loan counts and outstanding." />
  </>
)

export default DPDBuckets
