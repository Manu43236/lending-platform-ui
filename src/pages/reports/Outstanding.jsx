import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Statistic } from 'antd'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import { reportApi } from '../../api/reportApi'
import { formatCurrency } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'
import { exportToCsv } from '../../utils/csvExport'

const STATUS_COLOR = {
  ACTIVE: 'green', OVERDUE: 'orange', NPA: 'red',
  DISBURSED: 'blue', CURRENT: 'cyan',
}

// Statuses that represent "live" portfolio
const LIVE_STATUSES = ['DISBURSED', 'CURRENT', 'ACTIVE', 'OVERDUE', 'NPA']

const OutstandingReport = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await reportApi.getLoanBook()
      setData(res.data?.data || [])
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Filter to live portfolio only
  const liveData = data.filter(r => LIVE_STATUSES.includes(r.statusCode))

  const totalOutstanding = liveData.reduce((s, r) => s + (r.totalOutstanding || 0), 0)
  const totalLoans       = liveData.reduce((s, r) => s + (r.loanCount || 0), 0)
  const totalLoanAmount  = liveData.reduce((s, r) => s + (r.totalLoanAmount || 0), 0)
  const collections      = totalLoanAmount > 0 ? (((totalLoanAmount - totalOutstanding) / totalLoanAmount) * 100).toFixed(2) : '0.00'

  const columns = [
    {
      title: 'Status',
      dataIndex: 'statusCode',
      key: 'statusCode',
      render: (v) => <Tag color={STATUS_COLOR[v] || 'default'} style={{ fontWeight: 600 }}>{v}</Tag>,
    },
    { title: 'Loans', dataIndex: 'loanCount', key: 'loanCount', align: 'center' },
    {
      title: 'Original Loan Amount',
      dataIndex: 'totalLoanAmount',
      key: 'totalLoanAmount',
      align: 'right',
      render: (v) => formatCurrency(v),
    },
    {
      title: 'Outstanding Amount',
      dataIndex: 'totalOutstanding',
      key: 'totalOutstanding',
      align: 'right',
      render: (v) => <span style={{ fontWeight: 600, color: '#fa8c16' }}>{formatCurrency(v)}</span>,
    },
    {
      title: 'Amount Recovered',
      key: 'recovered',
      align: 'right',
      render: (_, r) => formatCurrency((r.totalLoanAmount || 0) - (r.totalOutstanding || 0)),
    },
  ]

  return (
    <>
      <PageHeader
        title="Outstanding Report"
        subtitle="Live portfolio outstanding — principal balance across all active loans"
        breadcrumbs={[{ label: 'Reports' }, { label: 'Outstanding' }]}
        actions={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={load} loading={loading}>Refresh</Button>,
          <Button key="export" icon={<DownloadOutlined />} onClick={() => exportToCsv(liveData, 'outstanding-report')}>Export CSV</Button>,
        ]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { label: 'Live Loans',         value: totalLoans,       color: '#1890ff', isNum: true },
          { label: 'Total Disbursed AUM', value: formatCurrency(totalLoanAmount), color: '#722ed1' },
          { label: 'Total Outstanding',  value: formatCurrency(totalOutstanding), color: '#fa8c16' },
          { label: 'Recovered',          value: collections + '%', color: '#52c41a' },
        ].map((s) => (
          <Col key={s.label} xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
              {s.isNum
                ? <Statistic value={s.value} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />
                : <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>}
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card size="small" style={{ borderRadius: 10 }}>
        <Table
          dataSource={liveData}
          columns={columns}
          rowKey="statusCode"
          size="small"
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'No outstanding loans' }}
        />
      </Card>
    </>
  )
}

export default OutstandingReport
