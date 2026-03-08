import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Divider, Statistic } from 'antd'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import { reportApi } from '../../api/reportApi'
import { formatCurrency } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'
import { exportToCsv } from '../../utils/csvExport'

const BUCKET_COLOR = {
  CURRENT: 'green',
  'SMA-0': 'gold',
  'SMA-1': 'orange',
  'SMA-2': 'volcano',
  NPA: 'red',
}

const DPDNpaReport = () => {
  const [buckets, setBuckets]   = useState([])
  const [npaLoans, setNpaLoans] = useState([])
  const [loading, setLoading]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [agingRes, npaRes] = await Promise.all([
        reportApi.getDpdAging(),
        reportApi.getNpa(),
      ])
      setBuckets(agingRes.data?.data || [])
      setNpaLoans(npaRes.data?.data || [])
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const bucketColumns = [
    {
      title: 'Bucket',
      dataIndex: 'bucket',
      key: 'bucket',
      render: (v) => <Tag color={BUCKET_COLOR[v] || 'default'} style={{ fontWeight: 600 }}>{v}</Tag>,
    },
    { title: 'DPD Range',     dataIndex: 'dpdRange',         key: 'dpdRange' },
    { title: 'Loan Count',    dataIndex: 'loanCount',        key: 'loanCount',       align: 'center' },
    { title: 'Outstanding',   dataIndex: 'outstandingAmount', key: 'outstanding',    align: 'right', render: (v) => formatCurrency(v) },
    { title: 'Overdue Amount', dataIndex: 'overdueAmount',   key: 'overdueAmount',  align: 'right', render: (v) => formatCurrency(v) },
  ]

  const npaColumns = [
    { title: 'Loan No.',       dataIndex: 'loanNumber',      key: 'loanNumber',      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: 'Customer',       dataIndex: 'customerName',    key: 'customerName' },
    { title: 'Cust No.',       dataIndex: 'customerNumber',  key: 'customerNumber',  render: (v) => <span style={{ fontSize: 11, color: '#888' }}>{v}</span> },
    { title: 'Loan Amount',    dataIndex: 'loanAmount',      key: 'loanAmount',      align: 'right', render: (v) => formatCurrency(v) },
    { title: 'Outstanding',    dataIndex: 'outstandingAmount', key: 'outstanding',   align: 'right', render: (v) => formatCurrency(v) },
    { title: 'Overdue Amt',    dataIndex: 'overdueAmount',   key: 'overdueAmount',   align: 'right', render: (v) => <span style={{ color: '#f5222d' }}>{formatCurrency(v)}</span> },
    { title: 'Current DPD',    dataIndex: 'currentDpd',      key: 'currentDpd',      align: 'center', render: (v) => <span style={{ color: '#f5222d', fontWeight: 700 }}>{v}</span> },
    { title: 'Highest DPD',    dataIndex: 'highestDpd',      key: 'highestDpd',      align: 'center' },
    { title: 'Overdue EMIs',   dataIndex: 'overdueEmis',     key: 'overdueEmis',     align: 'center', render: (v) => <span style={{ color: '#fa8c16' }}>{v}</span> },
  ]

  const totalNpaOutstanding = npaLoans.reduce((s, l) => s + (l.outstandingAmount || 0), 0)
  const totalNpaOverdue     = npaLoans.reduce((s, l) => s + (l.overdueAmount || 0), 0)

  return (
    <>
      <PageHeader
        title="DPD & NPA Report"
        subtitle="Days past due aging and non-performing asset classification"
        breadcrumbs={[{ label: 'Reports' }, { label: 'DPD & NPA' }]}
        actions={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={load} loading={loading}>Refresh</Button>,
          <Button key="export" icon={<DownloadOutlined />} onClick={() => exportToCsv(npaLoans, 'npa-report')}>Export NPA CSV</Button>,
        ]}
      />

      {/* Aging buckets */}
      <Card title="DPD Aging Buckets" size="small" style={{ borderRadius: 10, marginBottom: 16 }}>
        <Table
          dataSource={buckets}
          columns={bucketColumns}
          rowKey="bucket"
          size="small"
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'No data' }}
        />
      </Card>

      {/* NPA summary */}
      <Card
        title="NPA Loan List"
        size="small"
        style={{ borderRadius: 10 }}
        extra={
          <Row gutter={32}>
            <Col>
              <Statistic title="NPA Outstanding" value={formatCurrency(totalNpaOutstanding)} valueStyle={{ fontSize: 14, color: '#f5222d' }} />
            </Col>
            <Col>
              <Statistic title="Total Overdue" value={formatCurrency(totalNpaOverdue)} valueStyle={{ fontSize: 14, color: '#fa8c16' }} />
            </Col>
          </Row>
        }
      >
        <Table
          dataSource={npaLoans}
          columns={npaColumns}
          rowKey="loanNumber"
          size="small"
          loading={loading}
          pagination={{ pageSize: 10, size: 'small' }}
          locale={{ emptyText: 'No NPA loans' }}
          scroll={{ x: 900 }}
        />
      </Card>
    </>
  )
}

export default DPDNpaReport
