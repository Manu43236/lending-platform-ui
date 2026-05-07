import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Tabs, Card, Row, Col, Descriptions, Tag, Space, Button, Spin,
  Table, Form, Input, Select, InputNumber, DatePicker, Typography,
  Timeline as AntTimeline, Alert, Divider, Tooltip, Modal, Upload,
} from 'antd'
import {
  ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined,
  DollarOutlined, UploadOutlined, FileTextOutlined, ClockCircleOutlined,
  WarningOutlined, SafetyOutlined, CreditCardOutlined, AuditOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import { loanApi } from '../../api/loanApi'
import { creditAssessmentApi } from '../../api/creditAssessmentApi'
import { approvalApi } from '../../api/approvalApi'
import { disbursementApi } from '../../api/disbursementApi'
import { emiPaymentApi } from '../../api/emiPaymentApi'
import { collateralApi } from '../../api/collateralApi'
import { penaltyApi } from '../../api/penaltyApi'
import { documentApi } from '../../api/documentApi'
import { masterApi } from '../../api/masterApi'
import {
  formatCurrency, formatDate, formatPercent, formatTenure, formatDPD, formatEnum,
} from '../../utils/formatters'
import { loanStatusColors, emiStatusColors } from '../../theme/colors'
import { showError, showSuccess } from '../../utils/errorHandler'
import useAuthStore from '../../store/authStore'

const { Option } = Select
const { Text, Title } = Typography
const { TextArea } = Input

// ── Status tags ───────────────────────────────────────────────────────────────
const LoanStatusTag = ({ status }) => {
  const s = loanStatusColors[status] || loanStatusColors.INITIATED
  return (
    <Tag style={{ color: s.color, background: s.bg, border: '1px solid ' + s.border }}>
      {status?.replace(/_/g, ' ')}
    </Tag>
  )
}

const EmiStatusTag = ({ status }) => {
  const s = emiStatusColors[status] || emiStatusColors.PENDING
  return <Tag style={{ color: s.color, background: s.bg }}>{status}</Tag>
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
const OverviewTab = ({ loan }) => (
  <Row gutter={[16, 16]}>
    {/* Loan financials summary */}
    <Col span={24}>
      <Row gutter={12}>
        {[
          { label: 'Loan Amount', value: formatCurrency(loan.loanAmount, 0), color: '#1B3A6B' },
          { label: 'Processing Fee', value: formatCurrency(loan.processingFee, 0), color: '#595959' },
          { label: 'Total Interest', value: formatCurrency(loan.totalInterest, 0), color: '#d46b08' },
          { label: 'Total Payable', value: formatCurrency(loan.totalAmount, 0), color: '#096dd9' },
          { label: 'Outstanding', value: formatCurrency(loan.outstandingAmount, 0), color: loan.loanStatusCode === 'OVERDUE' ? '#cf1322' : '#237804' },
          { label: 'EMI / Month', value: formatCurrency(loan.emiAmount, 0), color: '#531dab' },
        ].map((k) => (
          <Col xs={12} sm={8} md={4} key={k.label}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }} bodyStyle={{ padding: '10px 8px' }}>
              <div style={{ fontSize: 11, color: '#888' }}>{k.label}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: k.color, marginTop: 2 }}>{k.value}</div>
            </Card>
          </Col>
        ))}
      </Row>
    </Col>

    {/* Loan Details */}
    <Col xs={24} md={12}>
      <Card title="Loan Details" size="small" style={{ borderRadius: 10 }}>
        <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 160 }}>
          <Descriptions.Item label="Loan Number">
            <Text strong style={{ fontFamily: 'monospace' }}>{loan.loanNumber}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Loan Type">{loan.loanTypeName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Purpose">{loan.loanPurposeName} — {loan.purpose}</Descriptions.Item>
          <Descriptions.Item label="Interest Rate">{formatPercent(loan.interestRate)}</Descriptions.Item>
          <Descriptions.Item label="Tenure">{formatTenure(loan.tenureMonths)}</Descriptions.Item>
          <Descriptions.Item label="Status"><LoanStatusTag status={loan.loanStatusCode} /></Descriptions.Item>
          <Descriptions.Item label="Branch">{loan.originatingBranchCode || '—'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Col>

    {/* Customer */}
    <Col xs={24} md={12}>
      <Card title="Customer" size="small" style={{ borderRadius: 10 }}>
        <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 160 }}>
          <Descriptions.Item label="Name">{loan.customerName}</Descriptions.Item>
          <Descriptions.Item label="Customer No.">{loan.customerNumber}</Descriptions.Item>
          <Descriptions.Item label="Applied On">{formatDate(loan.createdAt)}</Descriptions.Item>
          {loan.approvedDate && <Descriptions.Item label="Approved On">{formatDate(loan.approvedDate)}</Descriptions.Item>}
          {loan.disbursedDate && <Descriptions.Item label="Disbursed On">{formatDate(loan.disbursedDate)}</Descriptions.Item>}
          {loan.closedDate && <Descriptions.Item label="Closed On">{formatDate(loan.closedDate)}</Descriptions.Item>}
          {loan.rejectedDate && <Descriptions.Item label="Rejected On">{formatDate(loan.rejectedDate)}</Descriptions.Item>}
          {loan.rejectionReason && <Descriptions.Item label="Rejection Reason"><Text type="danger">{loan.rejectionReason}</Text></Descriptions.Item>}
        </Descriptions>
      </Card>
    </Col>

    {/* LMS Tracking (only for active/post-disbursed loans) */}
    {['ACTIVE','OVERDUE','NPA','CLOSED'].includes(loan.loanStatusCode) && (
      <Col span={24}>
        <Card title="Repayment Tracking" size="small" style={{ borderRadius: 10 }}>
          <Row gutter={16}>
            {[
              { label: 'EMIs Paid', value: loan.numberOfPaidEmis ?? 0 },
              { label: 'Overdue EMIs', value: loan.numberOfOverdueEmis ?? 0, danger: loan.numberOfOverdueEmis > 0 },
              { label: 'Current DPD', value: formatDPD(loan.currentDpd), danger: loan.currentDpd > 0 },
              { label: 'Highest DPD', value: formatDPD(loan.highestDpd), danger: loan.highestDpd > 30 },
              { label: 'Total Overdue', value: formatCurrency(loan.totalOverdueAmount, 0), danger: loan.totalOverdueAmount > 0 },
              { label: 'Total Penalty', value: formatCurrency(loan.totalPenaltyAmount, 0), danger: loan.totalPenaltyAmount > 0 },
            ].map((k) => (
              <Col xs={12} sm={8} md={4} key={k.label} style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{k.label}</Text>
                <Text strong style={{ color: k.danger ? '#cf1322' : undefined }}>{k.value}</Text>
              </Col>
            ))}
          </Row>
        </Card>
      </Col>
    )}

    {/* Disbursement account */}
    {loan.disbursementAccountNumber && (
      <Col xs={24} md={12}>
        <Card title="Disbursement Account" size="small" style={{ borderRadius: 10 }}>
          <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 160 }}>
            <Descriptions.Item label="Account No.">
              <Text style={{ fontFamily: 'monospace' }}>{loan.disbursementAccountNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="IFSC">
              <Text style={{ fontFamily: 'monospace' }}>{loan.disbursementIfsc}</Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
    )}
  </Row>
)

// ── Documents Tab ─────────────────────────────────────────────────────────────
const DocumentsTab = ({ loanNumber }) => {
  const { user } = useAuthStore()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [docTypes, setDocTypes] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadForm] = Form.useForm()

  // Verify/Reject modal
  const [verifyModal, setVerifyModal] = useState({ open: false, doc: null, action: null })
  const [verifyForm] = Form.useForm()
  const [verifying, setVerifying] = useState(false)

  const fetchDocs = async () => {
    const r = await documentApi.getByLoan(loanNumber, { page: 0, size: 50 })
    setDocs(r.data?.data?.content || r.data?.data || [])
  }

  useEffect(() => {
    Promise.all([
      documentApi.getByLoan(loanNumber, { page: 0, size: 50 }),
      masterApi.getDocumentTypes('LOAN'),
    ]).then(([docsRes, typesRes]) => {
      setDocs(docsRes.data?.data?.content || docsRes.data?.data || [])
      setDocTypes(typesRes.data?.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [loanNumber])

  const handleUpload = async (values) => {
    const formData = new FormData()
    formData.append('loanNumber', loanNumber)
    formData.append('documentTypeCode', values.documentTypeCode)
    formData.append('file', values.file.file)
    formData.append('uploadedBy', 'SYSTEM')
    setUploading(true)
    try {
      await documentApi.upload(formData)
      showSuccess('Document uploaded successfully.')
      uploadForm.resetFields()
      await fetchDocs()
    } catch (err) { showError(err, 'Upload failed') }
    finally { setUploading(false) }
  }

  const openVerify = (doc, action) => {
    setVerifyModal({ open: true, doc, action })
    verifyForm.resetFields()
  }

  const handleVerify = async (values) => {
    setVerifying(true)
    try {
      await documentApi.verify(verifyModal.doc.documentNumber, {
        verifiedBy: user?.username || user?.employeeId || 'SYSTEM',
        uploadStatus: verifyModal.action,
        verificationNotes: values.verificationNotes || '',
      })
      showSuccess(verifyModal.action === 'VERIFIED' ? 'Document verified.' : 'Document rejected.')
      setVerifyModal({ open: false, doc: null, action: null })
      await fetchDocs()
    } catch (err) { showError(err, 'Action failed') }
    finally { setVerifying(false) }
  }

  const columns = [
    { title: 'Document Type', dataIndex: 'documentTypeName', key: 'documentTypeName' },
    {
      title: 'File',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (v, row) => row.fileUrl
        ? <a href={row.fileUrl} target="_blank" rel="noreferrer">{v || 'View'}</a>
        : v || '—',
    },
    {
      title: 'Status',
      dataIndex: 'uploadStatus',
      key: 'uploadStatus',
      render: (v) => {
        const color = v === 'VERIFIED' ? 'success' : v === 'REJECTED' ? 'error' : 'processing'
        return <Tag color={color}>{v?.replace(/_/g, ' ')}</Tag>
      },
    },
    { title: 'Verified By', dataIndex: 'verifiedBy', key: 'verifiedBy', render: (v) => v || '—' },
    { title: 'Uploaded On', dataIndex: 'createdAt', key: 'createdAt', render: (v) => formatDate(v) },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, row) => {
        if (!['UPLOADED', 'PENDING_VERIFICATION'].includes(row.uploadStatus)) return null
        return (
          <Space size={4}>
            <Button type="link" size="small" style={{ color: '#52c41a', padding: 0 }}
              onClick={() => openVerify(row, 'VERIFIED')}>
              Verify
            </Button>
            <Button type="link" size="small" danger style={{ padding: 0 }}
              onClick={() => openVerify(row, 'REJECTED')}>
              Reject
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Upload Document" size="small" style={{ borderRadius: 10 }}>
            <Form form={uploadForm} layout="inline" onFinish={handleUpload}>
              <Form.Item name="documentTypeCode" rules={[{ required: true }]}>
                <Select placeholder="Document type" style={{ width: 200 }}>
                  {docTypes.map((d) => <Option key={d.code} value={d.code}>{d.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="file" rules={[{ required: true, message: 'Select a file' }]}>
                <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.jpg,.jpeg,.png">
                  <Button icon={<UploadOutlined />}>Choose File</Button>
                </Upload>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={uploading}>Upload</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col span={24}>
          <Card title="Documents" size="small" style={{ borderRadius: 10 }}>
            <Table columns={columns} dataSource={docs} rowKey="id" size="small"
              loading={loading} pagination={false}
              locale={{ emptyText: 'No documents uploaded yet' }} />
          </Card>
        </Col>
      </Row>

      <Modal
        title={verifyModal.action === 'VERIFIED' ? 'Verify Document' : 'Reject Document'}
        open={verifyModal.open}
        onCancel={() => setVerifyModal({ open: false, doc: null, action: null })}
        onOk={() => verifyForm.submit()}
        okText={verifyModal.action === 'VERIFIED' ? 'Verify' : 'Reject'}
        okButtonProps={{ danger: verifyModal.action === 'REJECTED' }}
        confirmLoading={verifying}
      >
        <p style={{ marginBottom: 12 }}>
          {verifyModal.action === 'VERIFIED'
            ? <>Verify <strong>{verifyModal.doc?.documentTypeName}</strong>?</>
            : <>Reject <strong>{verifyModal.doc?.documentTypeName}</strong>? Please provide a reason.</>}
        </p>
        <Form form={verifyForm} layout="vertical" onFinish={handleVerify}>
          <Form.Item
            label="Notes"
            name="verificationNotes"
            rules={verifyModal.action === 'REJECTED' ? [{ required: true, message: 'Rejection reason is required' }] : []}
          >
            <Input.TextArea rows={3} placeholder={verifyModal.action === 'REJECTED' ? 'Reason for rejection...' : 'Optional notes...'} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

// ── Credit Assessment Tab ─────────────────────────────────────────────────────
const AssessmentTab = ({ loanNumber, loanStatus, onStatusChange }) => {
  const { user } = useAuthStore()
  const [assessment, setAssessment] = useState(null)
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    Promise.all([
      creditAssessmentApi.getByLoanNumber(loanNumber).catch(() => ({ data: { data: null } })),
      documentApi.getByLoan(loanNumber, { page: 0, size: 50 }).catch(() => ({ data: { data: null } })),
    ]).then(([assessRes, docsRes]) => {
      setAssessment(assessRes.data?.data)
      setDocs(docsRes.data?.data?.content || docsRes.data?.data || [])
    }).finally(() => setLoading(false))
  }, [loanNumber])

  const unverifiedDocs = docs.filter((d) => d.uploadStatus !== 'VERIFIED')
  const docsReady = docs.length > 0 && unverifiedDocs.length === 0

  const handleAssess = async (values) => {
    setSubmitting(true)
    try {
      const r = await creditAssessmentApi.create({
        loanNumber,
        existingEmiObligations: values.existingEmiObligations || 0,
        assessedBy: user?.employeeId || user?.username,
      })
      setAssessment(r.data?.data)
      showSuccess('Credit assessment completed.')
      onStatusChange()
    } catch (err) { showError(err, 'Assessment failed') }
    finally { setSubmitting(false) }
  }

  if (loading) return <Spin />

  return (
    <Row gutter={[16, 16]}>
      {/* Form — only shown for INITIATED loans with no assessment yet */}
      {!assessment && loanStatus === 'INITIATED' && (
        <Col span={24}>
          {!docsReady ? (
            <Alert
              type="warning"
              showIcon
              message="Documents not ready for assessment"
              description={
                docs.length === 0
                  ? 'No documents uploaded. Upload and verify all required documents before running credit assessment.'
                  : `${unverifiedDocs.length} document(s) are pending verification. All documents must be verified before credit assessment can proceed.`
              }
            />
          ) : (
            <Card title="Run Credit Assessment" size="small" style={{ borderRadius: 10 }}>
              <Form form={form} layout="vertical" onFinish={handleAssess} style={{ maxWidth: 400 }}>
                <Form.Item
                  label="Existing EMI Obligations (₹)"
                  name="existingEmiObligations"
                  help="Total of all existing loan EMIs the customer is currently paying"
                >
                  <InputNumber min={0} placeholder="0" style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={submitting} icon={<AuditOutlined />}>
                    Run Assessment
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          )}
        </Col>
      )}

      {/* No assessment and loan not in assessable state */}
      {!assessment && loanStatus !== 'INITIATED' && (
        <Col span={24}>
          <Alert type="info" showIcon message="No credit assessment found for this loan." />
        </Col>
      )}

      {/* Assessment Result */}
      {assessment && (
        <Col span={24}>
          <Alert
            type={assessment.isEligible ? 'success' : 'error'}
            message={assessment.isEligible ? '✓ Eligible for Loan' : '✗ Not Eligible'}
            description={assessment.remarks}
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={[16, 16]}>
            {/* Left — Assessment result */}
            <Col xs={24} md={12}>
              <Card title="Assessment Result" size="small" style={{ borderRadius: 10 }}>
                <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 190 }}>
                  <Descriptions.Item label="Assessment No.">
                    <Text code style={{ fontSize: 12 }}>{assessment.assessmentNumber}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Credit Score">
                    <Text strong style={{
                      color: assessment.creditScore >= 750 ? '#52c41a' : assessment.creditScore >= 650 ? '#faad14' : '#f5222d',
                      fontSize: 15,
                    }}>
                      {assessment.creditScore}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>({assessment.creditScoreSource})</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Risk Category">
                    <Tag color={assessment.riskCategory === 'LOW' ? 'success' : assessment.riskCategory === 'MEDIUM' ? 'warning' : 'error'}>
                      {assessment.riskCategory}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Eligible">
                    {assessment.isEligible ? <Tag color="success">Yes</Tag> : <Tag color="error">No</Tag>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Recommendation">
                    <Tag color={
                      assessment.recommendation === 'APPROVE' ? 'success' :
                      assessment.recommendation === 'MANUAL_REVIEW' ? 'warning' : 'error'
                    }>
                      {assessment.recommendation?.replace(/_/g, ' ')}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Assessed By">{assessment.assessedBy}</Descriptions.Item>
                  <Descriptions.Item label="Assessed At">{formatDate(assessment.assessedAt)}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* Right — Financial ratios */}
            <Col xs={24} md={12}>
              <Card title="Financial Analysis" size="small" style={{ borderRadius: 10 }}>
                <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 190 }}>
                  <Descriptions.Item label="Monthly Income">{formatCurrency(assessment.monthlyIncome, 0)}</Descriptions.Item>
                  <Descriptions.Item label="Existing EMI Obligations">{formatCurrency(assessment.existingEmiObligations, 0)}</Descriptions.Item>
                  <Descriptions.Item label="Proposed EMI">{formatCurrency(assessment.proposedEmi, 0)}</Descriptions.Item>
                  <Descriptions.Item label="FOIR">
                    <Text style={{ color: assessment.foir <= 50 ? '#52c41a' : assessment.foir <= 60 ? '#faad14' : '#cf1322', fontWeight: 600 }}>
                      {formatPercent(assessment.foir, 1)}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>(limit: 50%)</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="DTI Ratio">
                    <Text style={{ fontWeight: 600 }}>{formatPercent(assessment.dtiRatio, 1)}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Loan Amount Requested">{formatCurrency(assessment.loanAmount, 0)}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* Recommended loan amount — shown when rejected with a suggestion */}
            {assessment.recommendedLoanAmount > 0 && (
              <Col span={24}>
                <Alert
                  type="warning"
                  showIcon
                  message={`Recommended Loan Amount: ${formatCurrency(assessment.recommendedLoanAmount, 0)}`}
                  description={assessment.recommendedLoanAmountRemark}
                />
              </Col>
            )}
          </Row>
        </Col>
      )}
    </Row>
  )
}

// ── Approval Tab ──────────────────────────────────────────────────────────────
const ApprovalTab = ({ loanNumber, loanStatus, onStatusChange }) => {
  const { user } = useAuthStore()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const canApprove = ['DOCUMENTS_VERIFIED', 'UNDER_REVIEW', 'MANUAL_REVIEW', 'UNDER_ASSESSMENT'].includes(loanStatus)

  const fetchHistory = async () => {
    try {
      const r = await approvalApi.getHistory(loanNumber)
      setHistory(r.data?.data || [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchHistory() }, [loanNumber]) // eslint-disable-line

  const handleAction = async (values) => {
    setSubmitting(true)
    try {
      await approvalApi.process({
        loanNumber,
        action: values.action,
        remarks: values.remarks,
        approvedByEmployeeId: user?.employeeId || user?.username,
      })
      showSuccess('Action recorded: ' + values.action)
      form.resetFields()
      fetchHistory()
      onStatusChange()
    } catch (err) { showError(err, 'Action failed') }
    finally { setSubmitting(false) }
  }

  const columns = [
    { title: 'Level', dataIndex: 'approvalLevel', key: 'approvalLevel', width: 70 },
    { title: 'By', dataIndex: 'approvedByName', key: 'approvedByName' },
    { title: 'Role', dataIndex: 'roleCode', key: 'roleCode', render: (v) => v ? <Tag>{v}</Tag> : '—' },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (v) => (
        <Tag color={v === 'APPROVE' ? 'success' : 'error'} icon={v === 'APPROVE' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {v}
        </Tag>
      ),
    },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', ellipsis: true, render: (v) => v || '—' },
    { title: 'Date', dataIndex: 'actionTakenAt', key: 'actionTakenAt', render: (v) => formatDate(v) },
  ]

  return (
    <Row gutter={[16, 16]}>
      {canApprove && (
        <Col span={24}>
          <Card title="Take Action" size="small" style={{ borderRadius: 10 }}>
            <Form form={form} layout="vertical" onFinish={handleAction} style={{ maxWidth: 500 }}>
              <Form.Item label="Action" name="action" rules={[{ required: true }]}>
                <Select placeholder="Approve or Reject">
                  <Option value="APPROVE"><Tag color="success">APPROVE</Tag></Option>
                  <Option value="REJECT"><Tag color="error">REJECT</Tag></Option>
                </Select>
              </Form.Item>
              <Form.Item label="Remarks" name="remarks">
                <TextArea rows={2} placeholder="Add remarks or reason for rejection..." />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting}>Submit</Button>
            </Form>
          </Card>
        </Col>
      )}
      <Col span={24}>
        <Card title="Approval History" size="small" style={{ borderRadius: 10 }}>
          <Table columns={columns} dataSource={history} rowKey="id" size="small"
            loading={loading} pagination={false}
            locale={{ emptyText: 'No approval actions yet' }} />
        </Card>
      </Col>
    </Row>
  )
}

// ── Disbursement Tab ──────────────────────────────────────────────────────────
const DisbursementTab = ({ loan, onStatusChange }) => {
  const { user } = useAuthStore()
  const [disbursement, setDisbursement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    disbursementApi.getByLoan(loan.loanNumber)
      .then((r) => setDisbursement(r.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [loan.loanNumber])

  const handleDisburse = async (values) => {
    setProcessing(true)
    try {
      const r = await disbursementApi.process({
        loanNumber: loan.loanNumber,
        disbursementMode: values.disbursementMode,
        disbursedByEmployeeId: user?.employeeId || user?.username,
      })
      setDisbursement(r.data?.data)
      showSuccess('Disbursement processed successfully.')
      onStatusChange()
    } catch (err) { showError(err, 'Disbursement failed') }
    finally { setProcessing(false) }
  }

  if (loading) return <Spin />

  return (
    <Row gutter={[16, 16]}>
      {loan.loanStatusCode === 'APPROVED' && !disbursement && (
        <Col span={24}>
          <Card title="Process Disbursement" size="small" style={{ borderRadius: 10 }}>
            <Form form={form} layout="inline" onFinish={handleDisburse}>
              <Form.Item label="Disbursement Mode" name="disbursementMode" rules={[{ required: true }]}>
                <Select placeholder="Select mode" style={{ width: 160 }}>
                  {['NEFT', 'RTGS', 'IMPS'].map((m) => <Option key={m} value={m}>{m}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={processing} icon={<DollarOutlined />}>
                  Disburse Loan
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      )}


      {disbursement && (
        <Col span={24}>
          <Card title="Disbursement Details" size="small" style={{ borderRadius: 10 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 200 }}>
                  <Descriptions.Item label="Disbursement No.">{disbursement.disbursementNumber}</Descriptions.Item>
                  <Descriptions.Item label="Mode">{formatEnum(disbursement.disbursementMode)}</Descriptions.Item>
                  <Descriptions.Item label="Disbursement Amount">{formatCurrency(disbursement.disbursementAmount, 0)}</Descriptions.Item>
                  <Descriptions.Item label="Processing Fee">{formatCurrency(disbursement.processingFee, 0)}</Descriptions.Item>
                  <Descriptions.Item label="Net Disbursement">
                    <Text strong style={{ color: '#1B3A6B' }}>{formatCurrency(disbursement.netDisbursement, 0)}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} md={12}>
                <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 200 }}>
                  <Descriptions.Item label="Account No.">{disbursement.beneficiaryAccountNumber}</Descriptions.Item>
                  <Descriptions.Item label="IFSC">{disbursement.beneficiaryIfsc}</Descriptions.Item>
                  <Descriptions.Item label="Transaction ID">{disbursement.transactionId || '—'}</Descriptions.Item>
                  <Descriptions.Item label="UTR No.">{disbursement.utrNumber || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Disbursed By">{disbursement.disbursedByName || disbursement.disbursedByEmployeeId}</Descriptions.Item>
                  <Descriptions.Item label="Disbursed At">{formatDate(disbursement.initiatedAt)}</Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>
        </Col>
      )}
    </Row>
  )
}

// ── EMI Schedule Tab ──────────────────────────────────────────────────────────
const EmiScheduleTab = ({ loanNumber }) => {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loanApi.getEmiSchedule(loanNumber)
      .then((r) => setSchedule(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [loanNumber])

  const columns = [
    { title: '#', dataIndex: 'emiNumber', key: 'emiNumber', width: 50, align: 'center' },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: (v) => formatDate(v) },
    { title: 'Principal', dataIndex: 'principalAmount', key: 'principalAmount', align: 'right', render: (v) => formatCurrency(v, 0) },
    { title: 'Interest', dataIndex: 'interestAmount', key: 'interestAmount', align: 'right', render: (v) => formatCurrency(v, 0) },
    { title: 'EMI Amount', dataIndex: 'emiAmount', key: 'emiAmount', align: 'right', render: (v) => <Text strong>{formatCurrency(v, 0)}</Text> },
    { title: 'Outstanding', dataIndex: 'outstandingPrincipal', key: 'outstandingPrincipal', align: 'right', render: (v) => formatCurrency(v, 0) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <EmiStatusTag status={v} /> },
    { title: 'Paid Date', dataIndex: 'paidDate', key: 'paidDate', render: (v) => v ? formatDate(v) : '—' },
    { title: 'Paid Amount', dataIndex: 'amountPaid', key: 'amountPaid', align: 'right', render: (v) => v ? formatCurrency(v, 0) : '—' },
    {
      title: 'DPD', dataIndex: 'daysPastDue', key: 'daysPastDue', align: 'center', width: 70,
      render: (v) => {
        if (!v) return <Text type="secondary">0</Text>
        return <Text style={{ color: v > 30 ? '#cf1322' : '#faad14', fontWeight: 600 }}>{v}d</Text>
      },
    },
  ]

  return (
    <Card size="small" style={{ borderRadius: 10 }}>
      <Table columns={columns} dataSource={schedule} rowKey="id" size="small"
        loading={loading} pagination={false}
        locale={{ emptyText: 'EMI schedule not generated yet. Process disbursement first.' }}
        scroll={{ x: 900 }}
        rowClassName={(r) => r.status === 'OVERDUE' ? 'ant-table-row-danger' : ''}
      />
    </Card>
  )
}

// ── Payments Tab ──────────────────────────────────────────────────────────────
const PaymentsTab = ({ loanNumber, loan }) => {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [oldestEmi, setOldestEmi] = useState(null)
  const [unpaidPenaltiesTotal, setUnpaidPenaltiesTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const loanStatus = loan?.loanStatusCode
  const canPay = ['ACTIVE', 'OVERDUE', 'NPA'].includes(loanStatus)

  useEffect(() => {
    if (!canPay) return
    setLoading(true)
    Promise.all([
      loanApi.getEmiSchedule(loanNumber),
      penaltyApi.getByLoan(loanNumber, { page: 0, size: 200 }),
    ]).then(([emiRes, penaltyRes]) => {
      const schedule = emiRes.data?.data || []
      const oldest = schedule
        .filter(e => ['OVERDUE', 'PARTIALLY_PAID', 'PENDING'].includes(e.status))
        .sort((a, b) => a.emiNumber - b.emiNumber)[0] || null
      setOldestEmi(oldest)

      const penalties = penaltyRes.data?.data?.content || penaltyRes.data?.data || []
      const penaltyTotal = penalties
        .filter(p => p.status !== 'PAID' && p.status !== 'WAIVED')
        .reduce((sum, p) => sum + ((p.penaltyAmount || 0) - (p.paidAmount || 0)), 0)
      setUnpaidPenaltiesTotal(penaltyTotal)

      if (oldest) {
        const emiDue = oldest.emiAmount - (oldest.amountPaid || 0)
        const totalDue = Math.round(penaltyTotal + emiDue)
        form.setFieldsValue({ emiNumber: oldest.emiNumber, paymentAmount: totalDue, paymentDate: dayjs() })
      }
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [loanNumber, canPay, refreshKey])

  const handlePayment = async (values) => {
    setSubmitting(true)
    try {
      await emiPaymentApi.process({
        loanNumber,
        emiNumber: values.emiNumber,
        paymentAmount: values.paymentAmount,
        paymentMode: values.paymentMode,
        paymentDate: values.paymentDate ? values.paymentDate.format('YYYY-MM-DD') : undefined,
        transactionId: values.transactionId,
        referenceNumber: values.referenceNumber,
      })
      showSuccess('Payment processed successfully.')
      form.resetFields()
      setRefreshKey(k => k + 1)
    } catch (err) { showError(err, 'Payment failed') }
    finally { setSubmitting(false) }
  }

  if (!canPay) {
    return <Alert type="info" showIcon message="Payment processing is only available for Active, Overdue and NPA loans." />
  }

  if (loading) return <Spin style={{ display: 'block', marginTop: 40 }} />

  const emiDue = oldestEmi ? (oldestEmi.emiAmount - (oldestEmi.amountPaid || 0)) : 0
  const totalDue = unpaidPenaltiesTotal + emiDue
  const npaCount = loan?.npaRecoveryPaymentCount || 0

  return (
    <Row gutter={[16, 16]}>
      <Col span={24} style={{ maxWidth: 620 }}>
        {loanStatus === 'NPA' && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message={`NPA Recovery: ${npaCount} / 3 full EMI payments made — ${Math.max(0, 3 - npaCount)} more needed to restore loan to ACTIVE`}
          />
        )}
        {oldestEmi ? (
          <Card size="small" style={{ borderRadius: 10, marginBottom: 12, background: '#fafafa', border: '1px solid #e8e8e8' }}>
            <Row gutter={16}>
              <Col span={unpaidPenaltiesTotal > 0 ? 8 : 12}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  EMI #{oldestEmi.emiNumber} due {formatDate(oldestEmi.dueDate)}
                  {oldestEmi.status === 'PARTIALLY_PAID' ? ' (partial)' : ''}
                </Text>
                <div><Text strong>{formatCurrency(emiDue, 0)}</Text></div>
              </Col>
              {unpaidPenaltiesTotal > 0 && (
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Unpaid Penalties</Text>
                  <div><Text strong style={{ color: '#cf1322' }}>{formatCurrency(unpaidPenaltiesTotal, 0)}</Text></div>
                </Col>
              )}
              <Col span={unpaidPenaltiesTotal > 0 ? 8 : 12}>
                <Text type="secondary" style={{ fontSize: 12 }}>Total Due</Text>
                <div><Text strong style={{ fontSize: 16 }}>{formatCurrency(totalDue, 0)}</Text></div>
              </Col>
            </Row>
          </Card>
        ) : (
          <Alert type="success" showIcon message="No pending EMIs." style={{ marginBottom: 12 }} />
        )}
      </Col>

      {oldestEmi && (
        <Col span={24}>
          <Card title="Process EMI Payment" size="small" style={{ borderRadius: 10, maxWidth: 620 }}>
            <Form form={form} layout="vertical" onFinish={handlePayment} requiredMark="optional">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="EMI Number" name="emiNumber" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={1} disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Payment Amount (₹)"
                    name="paymentAmount"
                    rules={[{ required: true }]}
                    extra={unpaidPenaltiesTotal > 0 ? <Text type="secondary" style={{ fontSize: 11 }}>Includes ₹{Math.round(unpaidPenaltiesTotal).toLocaleString()} penalties</Text> : null}
                  >
                    <InputNumber style={{ width: '100%' }} min={1} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Payment Mode" name="paymentMode" rules={[{ required: true }]}>
                    <Select placeholder="Select mode">
                      {['NACH', 'UPI', 'NEFT', 'RTGS', 'CASH', 'CHEQUE'].map((m) => (
                        <Option key={m} value={m}>{m}</Option>
                      ))}
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
              <Button type="primary" htmlType="submit" loading={submitting} icon={<CreditCardOutlined />}>
                Process Payment
              </Button>
            </Form>
          </Card>
        </Col>
      )}
    </Row>
  )
}

// ── Collateral Tab ────────────────────────────────────────────────────────────
const CollateralTab = ({ loanNumber, loanStatus }) => {
  const [collateral, setCollateral] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [collateralType, setCollateralType] = useState(null)

  useEffect(() => {
    collateralApi.getByLoan(loanNumber)
      .then((r) => setCollateral(r.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [loanNumber])

  const handleRegister = async (values) => {
    setSubmitting(true)
    try {
      const r = await collateralApi.register({ ...values, loanNumber })
      setCollateral(r.data?.data)
      showSuccess('Collateral registered successfully.')
    } catch (err) { showError(err, 'Failed to register collateral') }
    finally { setSubmitting(false) }
  }

  if (loading) return <Spin />

  return (
    <Row gutter={[16, 16]}>
      {!collateral && (
        <Col span={24}>
          <Card title="Register Collateral" size="small" style={{ borderRadius: 10 }}>
            <Form form={form} layout="vertical" onFinish={handleRegister} style={{ maxWidth: 600 }}>
              <Form.Item label="Collateral Type" name="collateralType" rules={[{ required: true }]}>
                <Select placeholder="Select type" onChange={setCollateralType}>
                  <Option value="PROPERTY">Property</Option>
                  <Option value="VEHICLE">Vehicle</Option>
                  <Option value="GOLD">Gold</Option>
                </Select>
              </Form.Item>
              {collateralType === 'PROPERTY' && (
                <Row gutter={12}>
                  <Col span={24}><Form.Item label="Property Address" name="propertyAddress" rules={[{ required: true }]}><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Property Type" name="propertyType"><Input placeholder="e.g. Flat, Plot" /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Area (sqft)" name="propertyAreaSqft"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Property Value (₹)" name="propertyValue" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                </Row>
              )}
              {collateralType === 'VEHICLE' && (
                <Row gutter={12}>
                  <Col span={12}><Form.Item label="Reg. Number" name="vehicleRegistrationNumber" rules={[{ required: true }]}><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Make" name="vehicleMake"><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Model" name="vehicleModel"><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Year" name="vehicleYear"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Vehicle Value (₹)" name="vehicleValue" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                </Row>
              )}
              {collateralType === 'GOLD' && (
                <Row gutter={12}>
                  <Col span={12}><Form.Item label="Weight (grams)" name="goldWeightGrams" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Purity" name="goldPurity"><Input placeholder="e.g. 22K" /></Form.Item></Col>
                  <Col span={24}><Form.Item label="Description" name="goldItemDescription"><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Gold Value (₹)" name="goldValue" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                </Row>
              )}
              <Divider />
              <Row gutter={12}>
                <Col span={12}><Form.Item label="Valuation Amount (₹)" name="valuationAmount"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                <Col span={12}><Form.Item label="Valuator Name" name="valuatorName"><Input /></Form.Item></Col>
              </Row>
              <Form.Item label="Remarks" name="remarks"><TextArea rows={2} /></Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} icon={<SafetyOutlined />}>
                Register Collateral
              </Button>
            </Form>
          </Card>
        </Col>
      )}

      {collateral && (
        <Col span={24}>
          <Card title="Collateral Details" size="small" style={{ borderRadius: 10 }}
            extra={
              <Tag color={collateral.collateralStatus === 'PLEDGED' ? 'warning' : 'success'}>
                {collateral.collateralStatus}
              </Tag>
            }
          >
            <Descriptions column={2} size="small" labelStyle={{ color: '#888' }}>
              <Descriptions.Item label="Collateral No.">{collateral.collateralNumber}</Descriptions.Item>
              <Descriptions.Item label="Type">{formatEnum(collateral.collateralType)}</Descriptions.Item>
              <Descriptions.Item label="Valuation">{formatCurrency(collateral.valuationAmount, 0)}</Descriptions.Item>
              <Descriptions.Item label="LTV">{formatPercent(collateral.ltvPercentage)}</Descriptions.Item>
              <Descriptions.Item label="Remarks" span={2}>{collateral.remarks || '—'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      )}
    </Row>
  )
}

// ── Penalties Tab ─────────────────────────────────────────────────────────────
const PenaltiesTab = ({ loanNumber }) => {
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    penaltyApi.getByLoan(loanNumber, { page: 0, size: 50 })
      .then((r) => setPenalties(r.data?.data?.content || r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [loanNumber])

  const columns = [
    { title: 'EMI #', dataIndex: 'emiScheduleId', key: 'emiScheduleId' },
    { title: 'Penalty Code', dataIndex: 'penaltyCode', key: 'penaltyCode' },
    { title: 'Penalty Amount', dataIndex: 'penaltyAmount', key: 'penaltyAmount', align: 'right', render: (v) => formatCurrency(v, 0) },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={v === 'WAIVED' ? 'success' : 'error'}>{v}</Tag>,
    },
    { title: 'Waived By', dataIndex: 'waivedBy', key: 'waivedBy', render: (v) => v || '—' },
    { title: 'Applied On', dataIndex: 'createdAt', key: 'createdAt', render: (v) => formatDate(v) },
  ]

  return (
    <Card size="small" style={{ borderRadius: 10 }}>
      <Table columns={columns} dataSource={penalties} rowKey="id" size="small"
        loading={loading} pagination={false}
        locale={{ emptyText: 'No penalties applied' }} />
    </Card>
  )
}

// ── Timeline Tab ──────────────────────────────────────────────────────────────
const TimelineTab = ({ loanNumber }) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loanApi.getTimeline(loanNumber)
      .then((r) => setEvents(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [loanNumber])

  if (loading) return <Spin />

  const colorMap = { SUCCESS: 'green', PENDING: 'blue', FAILED: 'red', INFO: 'gray' }

  return (
    <Card size="small" style={{ borderRadius: 10, maxWidth: 700 }}>
      <AntTimeline
        items={events.map((e) => ({
          color: colorMap[e.status] || 'blue',
          children: (
            <div>
              <Space>
                <Text strong>{e.title}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(e.timestamp)}</Text>
              </Space>
              <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{e.description}</div>
              {e.performedBy && (
                <Text type="secondary" style={{ fontSize: 11 }}>By: {e.performedBy}</Text>
              )}
            </div>
          ),
        }))}
      />
      {events.length === 0 && <Text type="secondary">No timeline events yet.</Text>}
    </Card>
  )
}

// ── Main LoanDetail ───────────────────────────────────────────────────────────
const LoanDetail = () => {
  const { loanNumber } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'overview'
  const [loan, setLoan] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchLoan = async () => {
    try {
      const r = await loanApi.getByLoanNumber(loanNumber)
      setLoan(r.data?.data)
    } catch (err) { showError(err, 'Failed to load loan') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLoan() }, [loanNumber]) // eslint-disable-line

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>
  if (!loan) return null

  const tabs = [
    { key: 'overview',    label: <Space><FileTextOutlined />Overview</Space>,   children: <OverviewTab loan={loan} /> },
    { key: 'documents',   label: <Space><UploadOutlined />Documents</Space>,    children: <DocumentsTab loanNumber={loanNumber} /> },
    { key: 'assessment',  label: <Space><AuditOutlined />Credit Assessment</Space>, children: <AssessmentTab loanNumber={loanNumber} loanStatus={loan.loanStatusCode} onStatusChange={fetchLoan} /> },
    { key: 'approval',    label: <Space><CheckCircleOutlined />Approval</Space>,children: <ApprovalTab loanNumber={loanNumber} loanStatus={loan.loanStatusCode} onStatusChange={fetchLoan} /> },
    { key: 'disbursement',label: <Space><DollarOutlined />Disbursement</Space>, children: <DisbursementTab loan={loan} onStatusChange={fetchLoan} /> },
    { key: 'emi-schedule',label: <Space><ClockCircleOutlined />EMI Schedule</Space>, children: <EmiScheduleTab loanNumber={loanNumber} /> },
    { key: 'payments',    label: <Space><CreditCardOutlined />Payments</Space>, children: <PaymentsTab loanNumber={loanNumber} loan={loan} /> },
    { key: 'collateral',  label: <Space><SafetyOutlined />Collateral</Space>,   children: <CollateralTab loanNumber={loanNumber} loanStatus={loan.loanStatusCode} /> },
    { key: 'penalties',   label: <Space><WarningOutlined />Penalties</Space>,   children: <PenaltiesTab loanNumber={loanNumber} /> },
    { key: 'timeline',    label: <Space><ClockCircleOutlined />Timeline</Space>,children: <TimelineTab loanNumber={loanNumber} /> },
  ]

  return (
    <>
      <PageHeader
        title={loanNumber}
        subtitle={loan.customerName + ' — ' + (loan.loanTypeName || 'Loan')}
        breadcrumbs={[
          { label: 'LOS' },
          { label: 'Applications', path: '/los/applications' },
          { label: loanNumber },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/los/applications')}>Back</Button>
            <LoanStatusTag status={loan.loanStatusCode} />
          </Space>
        }
      />
      <Tabs items={tabs} defaultActiveKey={initialTab} destroyInactiveTabPane={false} />
    </>
  )
}

export default LoanDetail
