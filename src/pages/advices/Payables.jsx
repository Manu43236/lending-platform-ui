import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Statistic, Tabs } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { loanApi } from '../../api/loanApi'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

// Loans approved but not yet disbursed — money the lender owes to borrowers
const PendingDisbursements = () => {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage]       = useState(0)
  const navigate              = useNavigate()

  const load = async (p = 0) => {
    setLoading(true)
    try {
      const res = await loanApi.getAll({ status: 'APPROVED', page: p, size: 10 })
      setData(res.data?.data?.content || [])
      setTotal(res.data?.data?.totalElements || 0)
      setPage(p)
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(0) }, [])

  const totalPending = data.reduce((s, r) => s + (r.loanAmount || 0), 0)

  const columns = [
    {
      title: 'Loan No.',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      render: (v) => (
        <span
          style={{ fontFamily: 'monospace', fontSize: 12, color: '#1890ff', cursor: 'pointer' }}
          onClick={() => navigate(`/loans/${v}`)}
        >
          {v}
        </span>
      ),
    },
    { title: 'Customer',      dataIndex: 'customerName',   key: 'customerName' },
    { title: 'Cust No.',      dataIndex: 'customerNumber', key: 'customerNumber', render: (v) => <span style={{ fontSize: 11, color: '#888' }}>{v}</span> },
    { title: 'Loan Type',     dataIndex: 'loanTypeName',   key: 'loanType' },
    {
      title: 'Loan Amount',
      dataIndex: 'loanAmount',
      key: 'loanAmount',
      align: 'right',
      render: (v) => <span style={{ fontWeight: 600, color: '#722ed1' }}>{formatCurrency(v)}</span>,
    },
    { title: 'Rate (%)',   dataIndex: 'interestRate',  key: 'rate',    align: 'center', render: (v) => `${v}%` },
    { title: 'Tenure',    dataIndex: 'tenureMonths',  key: 'tenure',  align: 'center', render: (v) => `${v} Mo` },
    {
      title: 'EMI / Month',
      dataIndex: 'emiAmount',
      key: 'emiAmount',
      align: 'right',
      render: (v) => formatCurrency(v),
    },
    {
      title: 'Approved Date',
      dataIndex: 'approvedDate',
      key: 'approvedDate',
      render: (v) => formatDateTime(v),
    },
    {
      title: 'Status',
      dataIndex: 'loanStatusCode',
      key: 'status',
      render: (v) => <Tag color="purple">{v}</Tag>,
    },
  ]

  return (
    <>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#888' }}>
          These loans are approved and waiting for disbursement.
        </span>
        <span>
          <span style={{ color: '#888', fontSize: 13 }}>Total Payable: </span>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#722ed1' }}>{formatCurrency(totalPending)}</span>
          <span style={{ marginLeft: 16, color: '#888', fontSize: 13 }}>Count: </span>
          <span style={{ fontWeight: 700 }}>{total}</span>
        </span>
      </div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        size="small"
        loading={loading}
        locale={{ emptyText: 'No pending disbursements' }}
        pagination={{
          pageSize: 10,
          total,
          current: page + 1,
          size: 'small',
          onChange: (p) => load(p - 1),
        }}
        scroll={{ x: 900 }}
      />
    </>
  )
}

// Loans under assessment — pipeline visibility
const UnderAssessment = () => {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage]       = useState(0)
  const navigate              = useNavigate()

  const load = async (p = 0) => {
    setLoading(true)
    try {
      const res = await loanApi.getAll({ status: 'UNDER_ASSESSMENT', page: p, size: 10 })
      setData(res.data?.data?.content || [])
      setTotal(res.data?.data?.totalElements || 0)
      setPage(p)
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(0) }, [])

  const columns = [
    {
      title: 'Loan No.',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      render: (v) => (
        <span
          style={{ fontFamily: 'monospace', fontSize: 12, color: '#1890ff', cursor: 'pointer' }}
          onClick={() => navigate(`/loans/${v}`)}
        >
          {v}
        </span>
      ),
    },
    { title: 'Customer',   dataIndex: 'customerName',   key: 'customerName' },
    { title: 'Cust No.',   dataIndex: 'customerNumber', key: 'customerNumber', render: (v) => <span style={{ fontSize: 11, color: '#888' }}>{v}</span> },
    { title: 'Loan Type',  dataIndex: 'loanTypeName',   key: 'loanType' },
    {
      title: 'Loan Amount',
      dataIndex: 'loanAmount',
      key: 'loanAmount',
      align: 'right',
      render: (v) => formatCurrency(v),
    },
    {
      title: 'Applied Date',
      dataIndex: 'appliedDate',
      key: 'appliedDate',
      render: (v) => formatDateTime(v),
    },
    {
      title: 'Status',
      dataIndex: 'loanStatusCode',
      key: 'status',
      render: () => <Tag color="geekblue">UNDER ASSESSMENT</Tag>,
    },
  ]

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="id"
      size="small"
      loading={loading}
      locale={{ emptyText: 'No loans under assessment' }}
      pagination={{
        pageSize: 10,
        total,
        current: page + 1,
        size: 'small',
        onChange: (p) => load(p - 1),
      }}
      scroll={{ x: 700 }}
    />
  )
}

const Payables = () => {
  const [summary, setSummary]       = useState({ approvedCount: 0, approvedAmt: 0, pipelineCount: 0 })
  const [loadingSummary, setLoadingSummary] = useState(false)

  const loadSummary = async () => {
    setLoadingSummary(true)
    try {
      const [approvedRes, pipelineRes] = await Promise.all([
        loanApi.getAll({ status: 'APPROVED',         page: 0, size: 100 }),
        loanApi.getAll({ status: 'UNDER_ASSESSMENT', page: 0, size: 100 }),
      ])
      const approvedLoans = approvedRes.data?.data?.content || []
      setSummary({
        approvedCount:  approvedRes.data?.data?.totalElements || 0,
        approvedAmt:    approvedLoans.reduce((s, r) => s + (r.loanAmount || 0), 0),
        pipelineCount:  pipelineRes.data?.data?.totalElements || 0,
      })
    } catch { /* silent */ }
    finally { setLoadingSummary(false) }
  }

  useEffect(() => { loadSummary() }, [])

  const tabs = [
    {
      key: 'pending',
      label: 'Pending Disbursements',
      children: <PendingDisbursements />,
    },
    {
      key: 'pipeline',
      label: 'Pipeline (Under Assessment)',
      children: <UnderAssessment />,
    },
  ]

  return (
    <>
      <PageHeader
        title="Payables"
        subtitle="Loans approved pending disbursement and loan pipeline"
        breadcrumbs={[{ label: 'Advices' }, { label: 'Payables' }]}
        actions={[
          <Button key="refresh" icon={<ReloadOutlined />} loading={loadingSummary} onClick={loadSummary}>Refresh</Button>,
        ]}
      />

      {/* Summary cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { label: 'Pending Disbursements', value: summary.approvedCount, color: '#722ed1', isNum: true },
          { label: 'Amount to Disburse',    value: formatCurrency(summary.approvedAmt), color: '#722ed1' },
          { label: 'In Pipeline',           value: summary.pipelineCount, color: '#1890ff', isNum: true },
        ].map((s) => (
          <Col key={s.label} xs={12} sm={8}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
              {s.isNum
                ? <Statistic value={s.value} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />
                : <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>}
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card size="small" style={{ borderRadius: 10 }}>
        <Tabs items={tabs} defaultActiveKey="pending" />
      </Card>
    </>
  )
}

export default Payables
