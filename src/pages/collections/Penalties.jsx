import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const Penalties = () => (
  <>
    <PageHeader
      title="Penalties"
      subtitle="Manage penal charges on overdue loans"
      breadcrumbs={[{ label: 'Collections' }, { label: 'Penalties' }]}
    />
    <ComingSoon title="Penalty Management" description="Apply, view and waive penal charges on overdue EMIs." />
  </>
)

export default Penalties
