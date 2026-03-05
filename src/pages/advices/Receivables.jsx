import PageHeader from '../../components/PageHeader'
import ComingSoon from '../../components/ComingSoon'

const Receivables = () => (
  <>
    <PageHeader
      title="Receivables"
      subtitle="EMI dues, overdue and penal receivables"
      breadcrumbs={[{ label: 'Advices' }, { label: 'Receivables' }]}
    />
    <ComingSoon title="Receivables" description="EMI due today/week/month, overdue receivables, penal interest receivable." />
  </>
)

export default Receivables
