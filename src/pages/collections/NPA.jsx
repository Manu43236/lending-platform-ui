import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const NPA = () => (
  <>
    <PageHeader
      title="NPA Accounts"
      subtitle="Non-Performing Assets — loans overdue 90+ days"
      breadcrumbs={[{ label: 'Collections' }, { label: 'NPA Accounts' }]}
    />
    <ComingSoon title="NPA Portfolio" description="RBI classified NPA accounts with recovery status and legal action tracking." />
  </>
)

export default NPA
