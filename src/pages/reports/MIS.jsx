import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Statistic, Tag, Button } from 'antd'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import { reportApi } from '../../api/reportApi'
import { formatCurrency, formatCurrencyShort } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'
import { exportToCsv } from '../../utils/csvExport'

const STATUS_COLOR = {
  ACTIVE: 'green', OVERDUE: 'orange', NPA: 'red',
  DISBURSED: 'blue', CURRENT: 'cyan', CLOSED: 'default',
  APPROVED: 'purple', INITIATED: 'gray', UNDER_ASSESSMENT: 'geekblue',
}

const MISReport = () => {
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

  const totalLoans       = data.reduce((s, r) => s + (r.loanCount || 0), 0)
  const totalDisbursed   = data.reduce((s, r) => s + (r.totalLoanAmount || 0), 0)
  const totalOutstanding = data.reduce((s, r) => s + (r.totalOutstanding || 0), 0)
  const npaRow           = data.find(r => r.statusCode === 'NPA')
  const npaOutstanding   = npaRow?.totalOutstanding || 0
  const npaRatio         = totalOutstanding > 0 ? ((npaOutstanding / totalOutstanding) * 100).toFixed(2) : '0.00'

  const columns = [
    {
      title: 'Status',
      dataIndex: 'statusCode',
      key: 'statusCode',
      render: (v) => <Tag color={STATUS_COLOR[v] || 'default'}>{v}</Tag>,
    },
    { title: 'Loan Count', dataIndex: 'loanCount', key: 'loanCount', align: 'center' },
    {
      title: 'Total Loan Amount',
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
      render: (v) => formatCurrency(v),
    },
  ]

  return (
    <>
      <PageHeader
        title="MIS Report"
        subtitle="Portfolio health snapshot — loan book by status"
        breadcrumbs={[{ label: 'Reports' }, { label: 'MIS' }]}
        actions={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={load} loading={loading}>Refresh</Button>,
          <Button key="export" icon={<DownloadOutlined />} onClick={() => exportToCsv(data, 'mis-report')}>Export CSV</Button>,
        ]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { label: 'Total Loans',       value: totalLoans,        prefix: '',   color: '#1890ff' },
          { label: 'Total Disbursed',   value: formatCurrencyShort(totalDisbursed),   isStr: true, color: '#722ed1' },
          { label: 'Total Outstanding', value: formatCurrencyShort(totalOutstanding), isStr: true, color: '#fa8c16' },
          { label: 'NPA Ratio',         value: npaRatio + '%',    isStr: true,  color: '#f5222d' },
        ].map((s) => (
          <Col key={s.label} xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
              {s.isStr
                ? <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                : <Statistic value={s.value} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />}
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card size="small" style={{ borderRadius: 10 }}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="statusCode"
          size="small"
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'No loan data available' }}
        />
      </Card>
    </>
  )
}

export default MISReport
