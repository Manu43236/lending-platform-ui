import { useState, useCallback } from 'react'
import {
  Input, Card, Row, Col, Alert, Button, Descriptions, Tag, Space, Modal, Divider, Form, Select, DatePicker, Spin, Statistic,
} from 'antd'
import { SearchOutlined, CheckCircleFilled, LockOutlined, SafetyOutlined, CreditCardOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import { loanApi } from '../../api/loanApi'
import { formatCurrency, formatDate, formatTenure, formatEnum } from '../../utils/formatters'
import { showError, showSuccess } from '../../utils/errorHandler'

const CLOSEABLE_STATUSES = ['ACTIVE', 'OVERDUE', 'NPA']
const PAYMENT_MODES = ['NACH', 'UPI', 'NEFT', 'RTGS', 'CASH', 'CHEQUE']

const LoanClosure = () => {
  const [search, setSearch]           = useState('')
  const [loan, setLoan]               = useState(null)
  const [loading, setLoading]         = useState(false)
  const [closing, setClosing]         = useState(false)
  const [searched, setSearched]       = useState(false)
  const [summary, setSummary]         = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Pre-closure state
  const [preCloseModal, setPreCloseModal]       = useState(false)
  const [quote, setQuote]                       = useState(null)
  const [quoteLoading, setQuoteLoading]         = useState(false)
  const [preCloseSubmitting, setPreCloseSubmitting] = useState(false)
  const [preCloseResult, setPreCloseResult]     = useState(null)
  const [preCloseForm]                          = Form.useForm()

  const fetchLoan = useCallback(async () => {
    if (!search.trim()) return
    setLoading(true)
    setSearched(true)
    setSummary(null)
    try {
      const res = await loanApi.getByLoanNumber(search.trim())
      setLoan(res.data?.data)
    } catch {
      setLoan(null)
      showError(null, 'Loan not found: ' + search.trim())
    } finally {
      setLoading(false)
    }
  }, [search])

  const handleClose = async () => {
    setClosing(true)
    try {
      const res = await loanApi.close(loan.loanNumber)
      setSummary(res.data?.data)
      setConfirmOpen(false)
      showSuccess('Loan closed successfully.')
      const loanRes = await loanApi.getByLoanNumber(loan.loanNumber)
      setLoan(loanRes.data?.data)
    } catch (err) {
      showError(err, 'Loan closure failed')
      setConfirmOpen(false)
    } finally {
      setClosing(false)
    }
  }

  const openPreCloseModal = async () => {
    setPreCloseResult(null)
    preCloseForm.resetFields()
    preCloseForm.setFieldsValue({ paymentDate: dayjs() })
    setPreCloseModal(true)
    setQuoteLoading(true)
    setQuote(null)
    try {
      const res = await loanApi.preClosureQuote(loan.loanNumber)
      setQuote(res.data?.data)
    } catch (err) {
      showError(err, 'Could not load pre-closure quote')
      setPreCloseModal(false)
    } finally {
      setQuoteLoading(false)
    }
  }

  const handlePreClose = async (values) => {
    setPreCloseSubmitting(true)
    try {
      const res = await loanApi.preClose(loan.loanNumber, {
        paymentMode: values.paymentMode,
        paymentDate: values.paymentDate ? values.paymentDate.format('YYYY-MM-DD') : undefined,
        transactionId: values.transactionId,
        referenceNumber: values.referenceNumber,
      })
      setPreCloseResult(res.data?.data)
      const loanRes = await loanApi.getByLoanNumber(loan.loanNumber)
      setLoan(loanRes.data?.data)
    } catch (err) { showError(err, 'Pre-closure failed') }
    finally { setPreCloseSubmitting(false) }
  }

  const canClose = loan && CLOSEABLE_STATUSES.includes(loan.loanStatusCode)
  const alreadyClosed = loan?.loanStatusCode === 'CLOSED'
  const hasBlockers = loan && (loan.numberOfOverdueEmis > 0 || loan.totalPenaltyAmount > 0)

  return (
    <>
      <PageHeader
        title="Loan Closure"
        subtitle="Close fully repaid loan accounts or pre-close with outstanding balance"
        breadcrumbs={[{ label: 'LMS' }, { label: 'Loan Closure' }]}
      />

      {/* Search */}
      <Card size="small" style={{ borderRadius: 10, marginBottom: 20 }}>
        <Input
          placeholder="Enter loan number and press Enter..."
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          allowClear
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSearched(false); setSummary(null) }}
          onPressEnter={fetchLoan}
          style={{ maxWidth: 400 }}
        />
      </Card>

      {searched && !loan && !loading && (
        <Alert type="warning" showIcon message={`No loan found for: ${search}`} />
      )}

      {loan && (
        <Row gutter={[16, 16]}>
          {/* Loan details */}
          <Col xs={24} md={12}>
            <Card
              title="Loan Details"
              size="small"
              style={{ borderRadius: 10 }}
              extra={
                <Tag color={
                  loan.loanStatusCode === 'CLOSED'  ? 'success' :
                  loan.loanStatusCode === 'ACTIVE'  ? 'green' :
                  loan.loanStatusCode === 'OVERDUE' ? 'warning' :
                  loan.loanStatusCode === 'NPA'     ? 'error' : 'default'
                }>
                  {formatEnum(loan.loanStatusCode)}
                </Tag>
              }
            >
              <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 160 }}>
                <Descriptions.Item label="Loan Number">
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{loan.loanNumber}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Customer">{loan.customerName}</Descriptions.Item>
                <Descriptions.Item label="Loan Type">{loan.loanTypeName}</Descriptions.Item>
                <Descriptions.Item label="Loan Amount">{formatCurrency(loan.loanAmount, 0)}</Descriptions.Item>
                <Descriptions.Item label="Outstanding">{formatCurrency(loan.outstandingAmount, 0)}</Descriptions.Item>
                <Descriptions.Item label="EMI / Month">{formatCurrency(loan.emiAmount, 0)}</Descriptions.Item>
                <Descriptions.Item label="Tenure">{formatTenure(loan.tenureMonths)}</Descriptions.Item>
                <Descriptions.Item label="EMIs Paid">{loan.numberOfPaidEmis ?? 0}</Descriptions.Item>
                <Descriptions.Item label="Overdue EMIs">
                  {loan.numberOfOverdueEmis > 0
                    ? <span style={{ color: '#cf1322', fontWeight: 600 }}>{loan.numberOfOverdueEmis}</span>
                    : <span style={{ color: '#52c41a' }}>0</span>}
                </Descriptions.Item>
                <Descriptions.Item label="Total Penalty">
                  {loan.totalPenaltyAmount > 0
                    ? <span style={{ color: '#cf1322' }}>{formatCurrency(loan.totalPenaltyAmount, 0)}</span>
                    : <span style={{ color: '#52c41a' }}>None</span>}
                </Descriptions.Item>
                {loan.disbursedDate && (
                  <Descriptions.Item label="Disbursed On">{formatDate(loan.disbursedDate)}</Descriptions.Item>
                )}
              </Descriptions>

              <Divider style={{ margin: '12px 0' }} />

              {alreadyClosed && (
                <Alert type="success" showIcon icon={<CheckCircleFilled />}
                  message={`Loan closed on ${formatDate(loan.closedDate)}`} />
              )}

              {canClose && !summary && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {hasBlockers && (
                    <Alert
                      type="warning"
                      showIcon
                      icon={<WarningOutlined />}
                      message="Outstanding balance detected"
                      description={`${loan.numberOfOverdueEmis > 0 ? `${loan.numberOfOverdueEmis} overdue EMI(s)` : ''}${loan.numberOfOverdueEmis > 0 && loan.totalPenaltyAmount > 0 ? ' + ' : ''}${loan.totalPenaltyAmount > 0 ? `penalties ${formatCurrency(loan.totalPenaltyAmount, 0)}` : ''}. Use Pre-close Loan to settle everything in one payment.`}
                    />
                  )}
                  {/* Pre-close is the primary action when there are blockers */}
                  <Button
                    type="primary"
                    icon={<CreditCardOutlined />}
                    block
                    onClick={openPreCloseModal}
                    style={hasBlockers
                      ? { background: '#d46b08', borderColor: '#d46b08' }
                      : { background: '#1B3A6B', borderColor: '#1B3A6B' }
                    }
                  >
                    Pre-close Loan (Pay All &amp; Close)
                  </Button>
                  {!hasBlockers && (
                    <Button
                      type="primary"
                      danger
                      icon={<LockOutlined />}
                      block
                      onClick={() => setConfirmOpen(true)}
                    >
                      Close Loan (All EMIs Paid)
                    </Button>
                  )}
                  {hasBlockers && (
                    <Button
                      danger
                      icon={<LockOutlined />}
                      block
                      onClick={() => setConfirmOpen(true)}
                    >
                      Force Close (All EMIs must be PAID first)
                    </Button>
                  )}
                </Space>
              )}

              {!canClose && !alreadyClosed && (
                <Alert type="info" showIcon
                  message={`Loan closure is only available for Active, Overdue, or NPA loans. Current: ${formatEnum(loan.loanStatusCode)}`} />
              )}
            </Card>
          </Col>

          {/* Closure summary — shown after successful close */}
          {summary && (
            <Col xs={24} md={12}>
              <Card
                title={<Space><CheckCircleFilled style={{ color: '#52c41a' }} />Closure Summary</Space>}
                size="small"
                style={{ borderRadius: 10, borderColor: '#b7eb8f' }}
              >
                <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 180 }}>
                  <Descriptions.Item label="Loan Number">
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{summary.loanNumber}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Customer">{summary.customerName}</Descriptions.Item>
                  <Descriptions.Item label="Loan Amount">{formatCurrency(summary.loanAmount, 0)}</Descriptions.Item>
                  <Descriptions.Item label="Total Principal Paid">{formatCurrency(summary.totalPrincipalPaid, 0)}</Descriptions.Item>
                  <Descriptions.Item label="Total Interest Paid">{formatCurrency(summary.totalInterestPaid, 0)}</Descriptions.Item>
                  <Descriptions.Item label="Total Penalties Paid">{formatCurrency(summary.totalPenaltiesPaid, 0)}</Descriptions.Item>
                  <Descriptions.Item label="Total Amount Paid">
                    <span style={{ fontWeight: 700, color: '#1B3A6B', fontSize: 14 }}>{formatCurrency(summary.totalAmountPaid, 0)}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="EMIs Paid">{summary.totalEmisPaid}</Descriptions.Item>
                  <Descriptions.Item label="Tenure">{formatTenure(summary.tenureMonths)}</Descriptions.Item>
                  <Descriptions.Item label="Disbursed On">{formatDate(summary.disbursedDate)}</Descriptions.Item>
                  <Descriptions.Item label="Closed On">{formatDate(summary.closedDate)}</Descriptions.Item>
                  {summary.collateralReleased && (
                    <Descriptions.Item label="Collateral">
                      <Space>
                        <SafetyOutlined style={{ color: '#52c41a' }} />
                        <span style={{ color: '#52c41a', fontWeight: 600 }}>
                          {formatEnum(summary.collateralType)} — Released
                        </span>
                      </Space>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Pre-Closure Modal */}
      <Modal
        title="Pre-close Loan — Pay All &amp; Close"
        open={preCloseModal}
        onCancel={() => { setPreCloseModal(false); setPreCloseResult(null) }}
        footer={null}
        width={520}
        destroyOnClose
      >
        {preCloseResult ? (
          /* ── Success view ── */
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 52, color: '#52c41a', marginBottom: 12 }} />
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Loan Pre-closed Successfully!</div>
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
              {[
                { label: 'Outstanding Principal', value: formatCurrency(preCloseResult.outstandingPrincipal, 0) },
                { label: 'Pre-closure Charge',    value: formatCurrency(preCloseResult.preClosureCharge, 0) },
                { label: 'Penalties Cleared',      value: formatCurrency(preCloseResult.pendingPenalties, 0) },
                { label: 'Total Paid',             value: formatCurrency(preCloseResult.totalAmountPaid, 0) },
              ].map(s => (
                <Col span={12} key={s.label}>
                  <div style={{ background: '#f6ffed', borderRadius: 8, padding: '10px 14px', border: '1px solid #b7eb8f' }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#237804' }}>{s.value}</div>
                  </div>
                </Col>
              ))}
            </Row>
            {preCloseResult.collateralReleased && (
              <Alert type="success" showIcon icon={<SafetyOutlined />}
                message={`Collateral (${formatEnum(preCloseResult.collateralType)}) released`}
                style={{ marginBottom: 16 }}
              />
            )}
            <Button type="primary" onClick={() => { setPreCloseModal(false); setPreCloseResult(null) }}>Done</Button>
          </div>
        ) : quoteLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: '#888' }}>Calculating pre-closure amount...</div>
          </div>
        ) : quote ? (
          /* ── Quote + payment form ── */
          <>
            {/* Breakdown */}
            <div style={{ background: '#fafafa', borderRadius: 8, padding: '14px 16px', marginBottom: 20, border: '1px solid #f0f0f0' }}>
              <div style={{ fontWeight: 600, marginBottom: 12, color: '#444' }}>Pre-closure Breakdown</div>
              <Row gutter={[0, 8]}>
                {[
                  { label: 'Outstanding Principal', value: formatCurrency(quote.outstandingPrincipal, 0), color: '#1B3A6B' },
                  {
                    label: `Pre-closure Charge (${quote.chargeType === 'PERCENTAGE' ? `${quote.chargeValue}%` : 'Flat'})`,
                    value: formatCurrency(quote.preClosureCharge, 0),
                    color: '#d46b08',
                  },
                  { label: 'Pending Penalties', value: formatCurrency(quote.pendingPenalties, 0), color: '#cf1322' },
                ].map(row => (
                  <Col span={24} key={row.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666', fontSize: 13 }}>{row.label}</span>
                      <span style={{ fontWeight: 600, color: row.color }}>{row.value}</span>
                    </div>
                  </Col>
                ))}
                <Col span={24}><Divider style={{ margin: '8px 0' }} /></Col>
                <Col span={24}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Total Payable</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: '#1B3A6B' }}>{formatCurrency(quote.totalPayable, 0)}</span>
                  </div>
                </Col>
              </Row>
              <div style={{ marginTop: 10, fontSize: 12, color: '#888' }}>
                Clears {quote.remainingEmis} remaining EMI(s) and closes the loan instantly.
              </div>
            </div>

            {/* Payment form */}
            <Form form={preCloseForm} layout="vertical" onFinish={handlePreClose} requiredMark="optional">
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Payment Mode" name="paymentMode" rules={[{ required: true }]}>
                    <Select placeholder="Select mode">
                      {PAYMENT_MODES.map(m => <Select.Option key={m} value={m}>{m}</Select.Option>)}
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
                  <Form.Item label="Reference Number" name="referenceNumber">
                    <Input placeholder="Optional" />
                  </Form.Item>
                </Col>
              </Row>
              <Alert
                type="warning"
                showIcon
                message={`This will pay ${formatCurrency(quote.totalPayable, 0)}, clear all EMIs, and permanently close the loan.`}
                style={{ marginBottom: 16 }}
              />
              <Button
                type="primary"
                block
                htmlType="submit"
                loading={preCloseSubmitting}
                icon={<CreditCardOutlined />}
                style={{ background: '#d46b08', borderColor: '#d46b08', height: 40 }}
              >
                Confirm Pre-closure — Pay {formatCurrency(quote.totalPayable, 0)}
              </Button>
            </Form>
          </>
        ) : null}
      </Modal>

      {/* Standard close confirm */}
      <Modal
        title="Confirm Loan Closure"
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onOk={handleClose}
        okText="Yes, Close Loan"
        okButtonProps={{ danger: true }}
        confirmLoading={closing}
      >
        <p>Are you sure you want to close loan <strong>{loan?.loanNumber}</strong>?</p>
        <p style={{ color: '#888', fontSize: 13 }}>
          This will mark the loan as CLOSED and release any pledged collateral. This action cannot be undone.
        </p>
      </Modal>
    </>
  )
}

export default LoanClosure
