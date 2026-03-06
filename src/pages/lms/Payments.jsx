import { useState, useEffect, useCallback } from 'react'
import {
  Input, Tag, Space, Card, Table, Row, Col, Alert,
  Form, Select, InputNumber, DatePicker, Button, Tabs, Statistic,
} from 'antd'
import { SearchOutlined, CreditCardOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { loanApi } from '../../api/loanApi'
import { emiPaymentApi } from '../../api/emiPaymentApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError, showSuccess } from '../../utils/errorHandler'

const { RangePicker } = DatePicker

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYMENT_MODES   = ['NACH', 'UPI', 'NEFT', 'RTGS', 'CASH', 'CHEQUE']
const PAYABLE_STATUSES = ['DISBURSED', 'CURRENT', 'ACTIVE', 'OVERDUE', 'NPA']

const STATUS_COLORS = {
  PAID:    { color: '#389e0d', bg: '#f6ffed' },
  PENDING: { color: '#d46b08', bg: '#fffbe6' },
  OVERDUE: { color: '#cf1322', bg: '#fff1f0' },
}

const PAYMENT_STATUS_COLORS = {
  SUCCESS:  { color: '#389e0d', bg: '#f6ffed' },
  FAILED:   { color: '#cf1322', bg: '#fff1f0' },
  PENDING:  { color: '#d46b08', bg: '#fffbe6' },
  BOUNCED:  { color: '#820014', bg: '#fff1f0' },
}

const PAYMENT_TYPE_COLORS = {
  FULL:    '#52c41a',
  PARTIAL: '#faad14',
  EXCESS:  '#1890ff',
  ADVANCE: '#722ed1',
}

const today = dayjs()

const DEFAULT_FILTERS = {
  dateRange:     [today, today],
  paymentStatus: null,
  paymentMode:   null,
  paymentType:   null,
  loanNumber:    '',
}

// ─── Small components ─────────────────────────────────────────────────────────

const EmiStatusTag = ({ status }) => {
  const c = STATUS_COLORS[status] || { color: '#666', bg: '#f5f5f5' }
  return (
    <Tag style={{ color: c.color, background: c.bg, border: 'none', fontWeight: 600, fontSize: 11 }}>
      {status}
    </Tag>
  )
}

const PaymentStatusTag = ({ status }) => {
  const c = PAYMENT_STATUS_COLORS[status] || { color: '#666', bg: '#f5f5f5' }
  return (
    <Tag style={{ color: c.color, background: c.bg, border: 'none', fontWeight: 600, fontSize: 11 }}>
      {status}
    </Tag>
  )
}

// ─── Tab 1: Payment Register ──────────────────────────────────────────────────

const PaymentRegister = () => {
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(false)
  const [pagination, setPagination] = useState({ page: 0, size: 50, totalElements: 0 })
  const [filters, setFilters]   = useState(DEFAULT_FILTERS)

  const buildParams = useCallback((page, size, f) => ({
    page,
    size,
    dateFrom:      f.dateRange?.[0]?.format('YYYY-MM-DD') || undefined,
    dateTo:        f.dateRange?.[1]?.format('YYYY-MM-DD') || undefined,
    paymentStatus: f.paymentStatus || undefined,
    paymentMode:   f.paymentMode   || undefined,
    paymentType:   f.paymentType   || undefined,
    loanNumber:    f.loanNumber?.trim() || undefined,
  }), [])

  const fetchData = useCallback(async (page = 0, size = 50, f = filters) => {
    setLoading(true)
    try {
      const res = await emiPaymentApi.getAll(buildParams(page, size, f))
      const paged = res.data?.data
      setData(paged?.content || [])
      setPagination({ page, size, totalElements: paged?.totalElements || 0 })
    } catch (err) {
      showError(err, 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [filters, buildParams])

  useEffect(() => { fetchData(0, 50, DEFAULT_FILTERS) }, []) // eslint-disable-line

  const handleFilter = (key, value) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    fetchData(0, 50, next)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    fetchData(0, 50, DEFAULT_FILTERS)
  }

  // Summary stats from current page
  const totalCollected = data.filter((p) => p.paymentStatus === 'SUCCESS')
    .reduce((s, p) => s + (p.paymentAmount || 0), 0)
  const successCount = data.filter((p) => p.paymentStatus === 'SUCCESS').length
  const failedCount  = data.filter((p) => p.paymentStatus === 'FAILED' || p.paymentStatus === 'BOUNCED').length

  const STAT_CARDS = [
    { label: 'Transactions',     value: data.length,                      color: '#1890ff', bg: '#e6f7ff' },
    { label: 'Successful',       value: successCount,                     color: '#389e0d', bg: '#f6ffed' },
    { label: 'Failed / Bounced', value: failedCount,                      color: '#cf1322', bg: '#fff1f0' },
    { label: 'Amount Collected', value: formatCurrency(totalCollected, 0), color: '#722ed1', bg: '#f9f0ff' },
  ]

  const columns = [
    {
      title: 'Payment No.',
      dataIndex: 'paymentNumber',
      key: 'paymentNumber',
      width: 160,
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#1B3A6B', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Loan / Customer',
      key: 'loan',
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#1B3A6B', fontWeight: 600 }}>{row.loanNumber}</span>
          <span style={{ fontSize: 12 }}>{row.customerName}</span>
        </Space>
      ),
    },
    {
      title: 'EMI #',
      dataIndex: 'emiNumber',
      key: 'emiNumber',
      width: 60,
      align: 'center',
    },
    {
      title: 'Payment Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (v) => formatDate(v),
    },
    {
      title: 'Amount',
      dataIndex: 'paymentAmount',
      key: 'paymentAmount',
      align: 'right',
      render: (v) => <span style={{ fontWeight: 700 }}>{formatCurrency(v, 0)}</span>,
    },
    {
      title: 'Mode',
      dataIndex: 'paymentMode',
      key: 'paymentMode',
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: 'Type',
      dataIndex: 'paymentType',
      key: 'paymentType',
      render: (v) => v ? <Tag color={PAYMENT_TYPE_COLORS[v]}>{v}</Tag> : '—',
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (v) => <PaymentStatusTag status={v} />,
    },
    {
      title: 'Outstanding',
      dataIndex: 'loanOutstandingAmount',
      key: 'loanOutstandingAmount',
      align: 'right',
      render: (v) => v != null ? formatCurrency(v, 0) : '—',
    },
  ]

  return (
    <>
      {/* Summary cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {STAT_CARDS.map((c) => (
          <Col key={c.label} xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8, background: c.bg, border: 'none', textAlign: 'center' }}
              bodyStyle={{ padding: '10px 4px' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{c.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Card size="small" style={{ borderRadius: 10, marginBottom: 16 }}>
        <Row gutter={[12, 8]} align="middle">
          <Col xs={24} sm={12} md={5}>
            <Input
              placeholder="Loan number..."
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              allowClear
              value={filters.loanNumber}
              onChange={(e) => handleFilter('loanNumber', e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Select placeholder="Status" allowClear style={{ width: '100%' }}
              value={filters.paymentStatus} onChange={(v) => handleFilter('paymentStatus', v)}>
              {['SUCCESS', 'FAILED', 'PENDING', 'BOUNCED'].map((s) => (
                <Select.Option key={s} value={s}>{s}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Select placeholder="Mode" allowClear style={{ width: '100%' }}
              value={filters.paymentMode} onChange={(v) => handleFilter('paymentMode', v)}>
              {PAYMENT_MODES.map((m) => (
                <Select.Option key={m} value={m}>{m}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Select placeholder="Type" allowClear style={{ width: '100%' }}
              value={filters.paymentType} onChange={(v) => handleFilter('paymentType', v)}>
              {['FULL', 'PARTIAL', 'EXCESS', 'ADVANCE'].map((t) => (
                <Select.Option key={t} value={t}>{t}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={7}>
            <RangePicker style={{ width: '100%' }} format="DD MMM YYYY"
              value={filters.dateRange}
              onChange={(v) => handleFilter('dateRange', v)}
              placeholder={['From', 'To']}
            />
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Button icon={<ReloadOutlined />} onClick={handleReset} style={{ width: '100%' }}>Reset</Button>
          </Col>
        </Row>
      </Card>

      <DataTable
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onPageChange={(page, size) => fetchData(page, size)}
        scroll={{ x: 1100 }}
        locale={{ emptyText: 'No payments found for the selected filters' }}
      />
    </>
  )
}

// ─── Tab 2: Process Payment ───────────────────────────────────────────────────

const ProcessPayment = () => {
  const [search, setSearch]         = useState('')
  const [loan, setLoan]             = useState(null)
  const [schedule, setSchedule]     = useState([])
  const [loading, setLoading]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searched, setSearched]     = useState(false)
  const [form] = Form.useForm()

  const fetchLoan = useCallback(async () => {
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

  const handlePayment = async (values) => {
    setSubmitting(true)
    try {
      await emiPaymentApi.process({
        loanNumber:     loan.loanNumber,
        emiNumber:      values.emiNumber,
        paymentAmount:  values.paymentAmount,
        paymentMode:    values.paymentMode,
        paymentDate:    values.paymentDate?.format('YYYY-MM-DD'),
        transactionId:  values.transactionId,
        referenceNumber: values.referenceNumber,
      })
      showSuccess('Payment processed successfully.')
      form.resetFields()
      const [scheduleRes, loanRes] = await Promise.all([
        loanApi.getEmiSchedule(loan.loanNumber),
        loanApi.getByLoanNumber(loan.loanNumber),
      ])
      setSchedule(scheduleRes.data?.data || [])
      setLoan(loanRes.data?.data)
    } catch (err) {
      showError(err, 'Payment failed')
    } finally {
      setSubmitting(false)
    }
  }

  const canPay = loan && PAYABLE_STATUSES.includes(loan.loanStatusCode)
  const nextDueEmi = schedule.find((e) => e.status === 'OVERDUE' || e.status === 'PENDING')

  const scheduleColumns = [
    { title: '#', dataIndex: 'emiNumber', key: 'emiNumber', width: 50, align: 'center' },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: (v) => formatDate(v) },
    { title: 'EMI Amount', dataIndex: 'emiAmount', key: 'emiAmount', align: 'right', render: (v) => <span style={{ fontWeight: 700 }}>{formatCurrency(v, 0)}</span> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <EmiStatusTag status={v} /> },
    { title: 'Paid Date', dataIndex: 'paidDate', key: 'paidDate', render: (v) => v ? formatDate(v) : <span style={{ color: '#bbb' }}>—</span> },
    { title: 'Paid Amount', dataIndex: 'amountPaid', key: 'amountPaid', align: 'right', render: (v) => v ? formatCurrency(v, 0) : <span style={{ color: '#bbb' }}>—</span> },
    {
      title: 'DPD', dataIndex: 'daysPastDue', key: 'daysPastDue', align: 'center', width: 70,
      render: (v) => v
        ? <span style={{ color: v > 30 ? '#cf1322' : '#faad14', fontWeight: 600 }}>{v}d</span>
        : <span style={{ color: '#bbb' }}>0</span>,
    },
  ]

  return (
    <>
      {/* Search */}
      <Card size="small" style={{ borderRadius: 10, marginBottom: 20 }}>
        <Input
          placeholder="Enter loan number and press Enter..."
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          allowClear
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSearched(false) }}
          onPressEnter={fetchLoan}
          style={{ maxWidth: 400 }}
        />
      </Card>

      {searched && !loan && !loading && (
        <Alert type="warning" showIcon message={`No loan found for: ${search}`} />
      )}

      {loan && (
        <Row gutter={[16, 16]}>
          {/* Loan summary */}
          <Col span={24}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Space size={32} wrap>
                <Space direction="vertical" size={0}>
                  <span style={{ fontSize: 11, color: '#888' }}>Loan</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1B3A6B' }}>{loan.loanNumber}</span>
                </Space>
                <Space direction="vertical" size={0}>
                  <span style={{ fontSize: 11, color: '#888' }}>Customer</span>
                  <span style={{ fontWeight: 600 }}>{loan.customerName}</span>
                </Space>
                <Space direction="vertical" size={0}>
                  <span style={{ fontSize: 11, color: '#888' }}>Outstanding</span>
                  <span style={{ fontWeight: 700, color: '#1B3A6B' }}>{formatCurrency(loan.outstandingAmount, 0)}</span>
                </Space>
                <Space direction="vertical" size={0}>
                  <span style={{ fontSize: 11, color: '#888' }}>EMI / Month</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(loan.emiAmount, 0)}</span>
                </Space>
                {loan.totalOverdueAmount > 0 && (
                  <Space direction="vertical" size={0}>
                    <span style={{ fontSize: 11, color: '#888' }}>Overdue Amount</span>
                    <span style={{ fontWeight: 700, color: '#cf1322' }}>{formatCurrency(loan.totalOverdueAmount, 0)}</span>
                  </Space>
                )}
                <Tag color={
                  loan.loanStatusCode === 'DISBURSED' ? 'blue' :
                  loan.loanStatusCode === 'CURRENT'   ? 'cyan' :
                  loan.loanStatusCode === 'ACTIVE'    ? 'success' :
                  loan.loanStatusCode === 'OVERDUE'   ? 'warning' :
                  loan.loanStatusCode === 'NPA'       ? 'error' : 'default'
                }>{loan.loanStatusCode}</Tag>
              </Space>
            </Card>
          </Col>

          {/* Payment form */}
          <Col xs={24} md={10}>
            {!canPay ? (
              <Alert type="info" showIcon
                message={`Payments not allowed for loans in ${loan.loanStatusCode} status.`}
                description="Only DISBURSED, CURRENT, ACTIVE, OVERDUE and NPA loans can accept payments." />
            ) : (
              <Card title="Process Payment" size="small" style={{ borderRadius: 10 }}>
                <Form form={form} layout="vertical" onFinish={handlePayment} requiredMark="optional">
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label="EMI Number" name="emiNumber" rules={[{ required: true }]}
                        initialValue={nextDueEmi?.emiNumber}>
                        <InputNumber style={{ width: '100%' }} min={1} placeholder="e.g. 1" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Amount (₹)" name="paymentAmount" rules={[{ required: true }]}
                        initialValue={nextDueEmi?.emiAmount}>
                        <InputNumber style={{ width: '100%' }} min={1} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Payment Mode" name="paymentMode" rules={[{ required: true }]}>
                        <Select placeholder="Select mode">
                          {PAYMENT_MODES.map((m) => <Select.Option key={m} value={m}>{m}</Select.Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Payment Date" name="paymentDate" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Transaction ID" name="transactionId">
                        <Input placeholder="Optional" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Reference No." name="referenceNumber">
                        <Input placeholder="Optional" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Button type="primary" htmlType="submit" loading={submitting}
                    icon={<CreditCardOutlined />} block>
                    Process Payment
                  </Button>
                </Form>
              </Card>
            )}
          </Col>

          {/* EMI schedule */}
          <Col xs={24} md={14}>
            <Card title="EMI Schedule" size="small" style={{ borderRadius: 10 }}>
              <Table
                columns={scheduleColumns}
                dataSource={schedule}
                rowKey="id"
                size="small"
                loading={loading}
                pagination={false}
                scroll={{ x: 700 }}
                rowClassName={(r) => r.status === 'OVERDUE' ? 'row-overdue' : ''}
              />
            </Card>
          </Col>
        </Row>
      )}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const Payments = () => (
  <>
    <PageHeader
      title="Payments"
      subtitle="Payment register and EMI payment processing"
      breadcrumbs={[{ label: 'LMS' }, { label: 'Payments' }]}
    />
    <Tabs
      defaultActiveKey="register"
      items={[
        {
          key:      'register',
          label:    'Payment Register',
          children: <PaymentRegister />,
        },
        {
          key:      'process',
          label:    'Process Payment',
          children: <ProcessPayment />,
        },
      ]}
    />
  </>
)

export default Payments
