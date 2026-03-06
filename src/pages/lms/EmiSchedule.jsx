import { useState, useCallback } from 'react'
import { Input, Tag, Space, Card, Table, Row, Col, Alert } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import { loanApi } from '../../api/loanApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

const STATUS_COLORS = {
  PAID:    { color: '#389e0d', bg: '#f6ffed' },
  PENDING: { color: '#d46b08', bg: '#fffbe6' },
  OVERDUE: { color: '#cf1322', bg: '#fff1f0' },
}

const EmiStatusTag = ({ status }) => {
  const c = STATUS_COLORS[status] || { color: '#666', bg: '#f5f5f5' }
  return (
    <Tag style={{ color: c.color, background: c.bg, border: 'none', fontWeight: 600, fontSize: 11 }}>
      {status}
    </Tag>
  )
}

const SUMMARY_FIELDS = [
  { label: 'Loan Amount',    key: 'loanAmount' },
  { label: 'Total Interest', key: 'totalInterest' },
  { label: 'Total Payable',  key: 'totalAmount' },
  { label: 'Outstanding',    key: 'outstandingAmount' },
  { label: 'EMI / Month',    key: 'emiAmount' },
  { label: 'Tenure',         key: 'tenureMonths', format: (v) => `${v} months` },
]

const EmiSchedule = () => {
  const [search, setSearch]     = useState('')
  const [loan, setLoan]         = useState(null)
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!search.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const [loanRes, scheduleRes] = await Promise.all([
        loanApi.getByLoanNumber(search.trim()),
        loanApi.getEmiSchedule(search.trim()),
      ])
      setLoan(loanRes.data?.data)
      setSchedule(scheduleRes.data?.data || [])
    } catch {
      setLoan(null)
      setSchedule([])
      showError(null, 'Loan not found: ' + search.trim())
    } finally {
      setLoading(false)
    }
  }, [search])

  const paid    = schedule.filter((e) => e.status === 'PAID').length
  const overdue = schedule.filter((e) => e.status === 'OVERDUE').length
  const pending = schedule.filter((e) => e.status === 'PENDING').length

  const columns = [
    {
      title: '#',
      dataIndex: 'emiNumber',
      key: 'emiNumber',
      width: 50,
      align: 'center',
      render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (v) => formatDate(v),
    },
    {
      title: 'Principal',
      dataIndex: 'principalAmount',
      key: 'principalAmount',
      align: 'right',
      render: (v) => formatCurrency(v, 0),
    },
    {
      title: 'Interest',
      dataIndex: 'interestAmount',
      key: 'interestAmount',
      align: 'right',
      render: (v) => formatCurrency(v, 0),
    },
    {
      title: 'EMI Amount',
      dataIndex: 'emiAmount',
      key: 'emiAmount',
      align: 'right',
      render: (v) => <span style={{ fontWeight: 700 }}>{formatCurrency(v, 0)}</span>,
    },
    {
      title: 'Outstanding',
      dataIndex: 'outstandingPrincipal',
      key: 'outstandingPrincipal',
      align: 'right',
      render: (v) => formatCurrency(v, 0),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <EmiStatusTag status={v} />,
    },
    {
      title: 'Paid Date',
      dataIndex: 'paidDate',
      key: 'paidDate',
      render: (v) => v ? formatDate(v) : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Paid Amount',
      dataIndex: 'amountPaid',
      key: 'amountPaid',
      align: 'right',
      render: (v) => v ? formatCurrency(v, 0) : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'DPD',
      dataIndex: 'daysPastDue',
      key: 'daysPastDue',
      align: 'center',
      width: 70,
      render: (v) => v
        ? <span style={{ color: v > 30 ? '#cf1322' : '#faad14', fontWeight: 600 }}>{v}d</span>
        : <span style={{ color: '#bbb' }}>0</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title="EMI Schedule"
        subtitle="View full repayment schedule for any loan"
        breadcrumbs={[{ label: 'LMS' }, { label: 'EMI Schedule' }]}
      />

      {/* Search */}
      <Card size="small" style={{ borderRadius: 10, marginBottom: 20 }}>
        <Input
          placeholder="Enter loan number and press Enter..."
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          allowClear
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSearched(false) }}
          onPressEnter={handleSearch}
          style={{ maxWidth: 400 }}
        />
      </Card>

      {searched && !loan && !loading && (
        <Alert type="warning" showIcon message={`No loan found for: ${search}`} />
      )}

      {loan && (
        <>
          {/* Loan summary */}
          <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card size="small" style={{ borderRadius: 10 }}>
                <Space size={32} wrap>
                  <Space direction="vertical" size={0}>
                    <span style={{ fontSize: 11, color: '#888' }}>Loan Number</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1B3A6B' }}>{loan.loanNumber}</span>
                  </Space>
                  <Space direction="vertical" size={0}>
                    <span style={{ fontSize: 11, color: '#888' }}>Customer</span>
                    <span style={{ fontWeight: 600 }}>{loan.customerName}</span>
                  </Space>
                  <Space direction="vertical" size={0}>
                    <span style={{ fontSize: 11, color: '#888' }}>Loan Amount</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(loan.loanAmount, 0)}</span>
                  </Space>
                  <Space direction="vertical" size={0}>
                    <span style={{ fontSize: 11, color: '#888' }}>EMI / Month</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(loan.emiAmount, 0)}</span>
                  </Space>
                  <Space direction="vertical" size={0}>
                    <span style={{ fontSize: 11, color: '#888' }}>Outstanding</span>
                    <span style={{ fontWeight: 600, color: '#1B3A6B' }}>{formatCurrency(loan.outstandingAmount, 0)}</span>
                  </Space>
                  <Space size={8}>
                    <Tag color="success">Paid: {paid}</Tag>
                    <Tag color="warning">Pending: {pending}</Tag>
                    {overdue > 0 && <Tag color="error">Overdue: {overdue}</Tag>}
                  </Space>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Schedule table */}
          <Card size="small" style={{ borderRadius: 10 }}>
            <Table
              columns={columns}
              dataSource={schedule}
              rowKey="id"
              size="small"
              loading={loading}
              pagination={false}
              scroll={{ x: 900 }}
              rowClassName={(r) => r.status === 'OVERDUE' ? 'row-overdue' : ''}
              locale={{ emptyText: 'No EMI schedule found' }}
            />
          </Card>
        </>
      )}
    </>
  )
}

export default EmiSchedule
