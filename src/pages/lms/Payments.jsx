import { useState, useCallback } from 'react'
import {
  Input, Tag, Space, Card, Table, Row, Col, Alert,
  Form, Select, InputNumber, DatePicker, Button,
} from 'antd'
import { SearchOutlined, CreditCardOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import { loanApi } from '../../api/loanApi'
import { emiPaymentApi } from '../../api/emiPaymentApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError, showSuccess } from '../../utils/errorHandler'

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

const PAYMENT_MODES = ['NACH', 'UPI', 'NEFT', 'RTGS', 'CASH', 'CHEQUE']
const PAYABLE_STATUSES = ['DISBURSED', 'CURRENT', 'ACTIVE', 'OVERDUE', 'NPA']

const Payments = () => {
  const [search, setSearch]     = useState('')
  const [loan, setLoan]         = useState(null)
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searched, setSearched] = useState(false)
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
        loanNumber: loan.loanNumber,
        emiNumber: values.emiNumber,
        paymentAmount: values.paymentAmount,
        paymentMode: values.paymentMode,
        paymentDate: values.paymentDate?.format('YYYY-MM-DD'),
        transactionId: values.transactionId,
        referenceNumber: values.referenceNumber,
      })
      showSuccess('Payment processed successfully.')
      form.resetFields()
      // Reload schedule to reflect updated status
      const scheduleRes = await loanApi.getEmiSchedule(loan.loanNumber)
      setSchedule(scheduleRes.data?.data || [])
      const loanRes = await loanApi.getByLoanNumber(loan.loanNumber)
      setLoan(loanRes.data?.data)
    } catch (err) {
      showError(err, 'Payment failed')
    } finally {
      setSubmitting(false)
    }
  }

  const canPay = loan && PAYABLE_STATUSES.includes(loan.loanStatusCode)

  // Next pending/overdue EMI for quick-fill
  const nextDueEmi = schedule.find((e) => e.status === 'OVERDUE' || e.status === 'PENDING')

  const columns = [
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
      <PageHeader
        title="Payments"
        subtitle="Process EMI payments for active loan accounts"
        breadcrumbs={[{ label: 'LMS' }, { label: 'Payments' }]}
      />

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
          {/* Loan summary bar */}
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
                  <Button type="primary" htmlType="submit" loading={submitting} icon={<CreditCardOutlined />} block>
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
                columns={columns}
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

export default Payments
