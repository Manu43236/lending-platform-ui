import { useState, useCallback } from 'react'
import {
  Input, Card, Row, Col, Alert, Button, Descriptions, Tag, Space, Modal, Divider,
} from 'antd'
import { SearchOutlined, CheckCircleFilled, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import { loanApi } from '../../api/loanApi'
import { formatCurrency, formatDate, formatTenure } from '../../utils/formatters'
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
                  {loan.loanStatusCode}
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
                  message={`Loan closure is only available for ACTIVE, OVERDUE, or NPA loans. Current status: ${loan.loanStatusCode}`} />
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
                          {summary.collateralType} — Released
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
