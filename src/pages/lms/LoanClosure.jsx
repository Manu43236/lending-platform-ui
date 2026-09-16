import { useState, useCallback } from 'react'
import {
  Input, Card, Row, Col, Alert, Button, Descriptions, Tag, Space, Modal, Divider, Form, Select, DatePicker,
} from 'antd'
import { SearchOutlined, CheckCircleFilled, LockOutlined, SafetyOutlined, CreditCardOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import { loanApi } from '../../api/loanApi'
import { emiPaymentApi } from '../../api/emiPaymentApi'
import { formatCurrency, formatDate, formatTenure, formatEnum } from '../../utils/formatters'
import { showError, showSuccess } from '../../utils/errorHandler'

const CLOSEABLE_STATUSES = ['ACTIVE', 'OVERDUE', 'NPA']

const LoanClosure = () => {
  const [search, setSearch]         = useState('')
  const [loan, setLoan]             = useState(null)
  const [loading, setLoading]       = useState(false)
  const [closing, setClosing]       = useState(false)
  const [searched, setSearched]     = useState(false)
  const [summary, setSummary]       = useState(null)   // closure summary after close
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  const [bulkForm] = Form.useForm()

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
      // Refresh loan
      const loanRes = await loanApi.getByLoanNumber(loan.loanNumber)
      setLoan(loanRes.data?.data)
    } catch (err) {
      showError(err, 'Loan closure failed')
      setConfirmOpen(false)
    } finally {
      setClosing(false)
    }
  }

  const handleBulkPayment = async (values) => {
    setBulkSubmitting(true)
    try {
      const res = await emiPaymentApi.bulkClear({
        loanNumber: loan.loanNumber,
        paymentMode: values.paymentMode,
        paymentDate: values.paymentDate ? values.paymentDate.format('YYYY-MM-DD') : undefined,
        transactionId: values.transactionId,
        referenceNumber: values.referenceNumber,
      })
      setBulkResult(res.data?.data)
      bulkForm.resetFields()
      const loanRes = await loanApi.getByLoanNumber(loan.loanNumber)
      setLoan(loanRes.data?.data)
    } catch (err) { showError(err, 'Bulk payment failed') }
    finally { setBulkSubmitting(false) }
  }

  const canClose = loan && CLOSEABLE_STATUSES.includes(loan.loanStatusCode)
  const alreadyClosed = loan?.loanStatusCode === 'CLOSED'

  return (
    <>
      <PageHeader
        title="Loan Closure"
        subtitle="Close fully repaid loan accounts and release collateral"
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
                  {loan.numberOfOverdueEmis > 0 && (
                    <Alert type="warning" showIcon
                      message={`${loan.numberOfOverdueEmis} overdue EMI(s) detected. All EMIs must be PAID before closure.`} />
                  )}
                  {loan.totalPenaltyAmount > 0 && (
                    <Alert type="warning" showIcon
                      message="Pending penalties exist. Pay or waive all penalties before closure." />
                  )}
                  {loan.numberOfOverdueEmis > 0 && (
                    <Button
                      block
                      icon={<CreditCardOutlined />}
                      onClick={() => { setBulkResult(null); setBulkModal(true) }}
                      style={{ background: '#fa8c16', borderColor: '#fa8c16', color: '#fff' }}
                    >
                      Pay All Outstanding ({loan.numberOfOverdueEmis} EMIs)
                    </Button>
                  )}
                  <Button
                    type="primary"
                    danger
                    icon={<LockOutlined />}
                    block
                    onClick={() => setConfirmOpen(true)}
                  >
                    Close Loan
                  </Button>
                </Space>
              )}

              {!canClose && !alreadyClosed && (
                <Alert type="info" showIcon
                  message={`Loan closure is only available for Active, Overdue, or NPA loans. Current status: ${formatEnum(loan.loanStatusCode)}`} />
              )}
            </Card>
          </Col>

          {/* Closure summary — shown after successful close */}
          {summary && (
            <Col xs={24} md={12}>
              <Card
                title={
                  <Space>
                    <CheckCircleFilled style={{ color: '#52c41a' }} />
                    Closure Summary
                  </Space>
                }
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

      {/* Bulk Payment Modal */}
      <Modal
        title="Pay All Outstanding EMIs"
        open={bulkModal}
        onCancel={() => { setBulkModal(false); setBulkResult(null) }}
        footer={null}
        width={460}
      >
        {bulkResult ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }} />
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>All EMIs Cleared!</div>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              {[
                { label: 'EMIs Cleared', value: bulkResult.emisCleared },
                { label: 'Penalties Cleared', value: formatCurrency(bulkResult.penaltiesCleared, 0) },
                { label: 'Total Paid', value: formatCurrency(bulkResult.totalAmountPaid, 0) },
                { label: 'Loan Status', value: bulkResult.newLoanStatus },
              ].map(s => (
                <Col span={12} key={s.label}>
                  <div style={{ background: '#f6ffed', borderRadius: 8, padding: '10px 12px', border: '1px solid #b7eb8f' }}>
                    <div style={{ fontSize: 11, color: '#888' }}>{s.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#237804' }}>{s.value}</div>
                  </div>
                </Col>
              ))}
            </Row>
            <Button type="primary" onClick={() => { setBulkModal(false); setBulkResult(null) }}>
              Done — Now Close Loan
            </Button>
          </div>
        ) : (
          <Form form={bulkForm} layout="vertical" onFinish={handleBulkPayment} requiredMark="optional">
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Payment Mode" name="paymentMode" rules={[{ required: true }]}>
                  <Select placeholder="Select mode">
                    {['NACH', 'UPI', 'NEFT', 'RTGS', 'CASH', 'CHEQUE'].map(m => (
                      <Select.Option key={m} value={m}>{m}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Payment Date" name="paymentDate" rules={[{ required: true }]} initialValue={dayjs()}>
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
            <Button type="primary" danger block htmlType="submit" loading={bulkSubmitting} icon={<CreditCardOutlined />}>
              Confirm — Pay All {loan?.numberOfOverdueEmis} Overdue EMIs
            </Button>
          </Form>
        )}
      </Modal>

      {/* Confirm Modal */}
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
          This will mark the loan as CLOSED and release any pledged collateral.
          This action cannot be undone.
        </p>
      </Modal>
    </>
  )
}

export default LoanClosure
