import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Row, Col, Descriptions, Tag, Space, Button, Spin, Tabs,
  Table, Drawer, Form, Input, Select, DatePicker, InputNumber,
  Typography, Divider, Statistic, Tooltip, Progress,
} from 'antd'
import {
  EditOutlined, StopOutlined, ArrowLeftOutlined, SaveOutlined,
  FileTextOutlined, MailOutlined, PhoneOutlined, IdcardOutlined,
  WarningFilled, CheckCircleFilled, FileDoneOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import ConfirmModal from '../../components/ConfirmModal'
import { customerApi } from '../../api/customerApi'
import { loanApi } from '../../api/loanApi'
import { documentApi } from '../../api/documentApi'
import {
  formatCurrency, formatDate, formatDateTime, formatPercent,
  maskPan, maskAadhaar,
} from '../../utils/formatters'
import { loanStatusColors, documentStatusColors } from '../../theme/colors'
import { showError, showSuccess } from '../../utils/errorHandler'

const { Option } = Select
const { Text } = Typography

// ── Status tags ───────────────────────────────────────────────────────────────
const LoanStatusTag = ({ status }) => {
  const s = loanStatusColors[status] || loanStatusColors.INITIATED
  return (
    <Tag style={{ color: s.color, background: s.bg, border: '1px solid ' + s.border, fontSize: 11 }}>
      {status?.replace(/_/g, ' ')}
    </Tag>
  )
}

const DocStatusTag = ({ status }) => {
  const s = documentStatusColors[status] || { color: '#595959', bg: '#f5f5f5' }
  return (
    <Tag style={{ color: s.color, background: s.bg, fontSize: 11 }}>
      {status?.replace(/_/g, ' ')}
    </Tag>
  )
}

// ── Credit score pill ─────────────────────────────────────────────────────────
const CreditScorePill = ({ score }) => {
  if (!score) return <Text type="secondary">—</Text>
  const color = score >= 750 ? '#52c41a' : score >= 650 ? '#faad14' : '#f5222d'
  const label = score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : 'Poor'
  return (
    <Space size={8}>
      <span style={{
        fontSize: 22, fontWeight: 700, color,
      }}>{score}</span>
      <Tag color={score >= 750 ? 'success' : score >= 650 ? 'warning' : 'error'}>{label}</Tag>
    </Space>
  )
}

// ── FOIR bar ──────────────────────────────────────────────────────────────────
const FoirBar = ({ foir }) => {
  if (foir === null || foir === undefined) return <Text type="secondary">—</Text>
  const pct = Math.min(foir, 100)
  const color = pct > 60 ? '#f5222d' : pct > 50 ? '#faad14' : '#52c41a'
  return (
    <Space direction="vertical" size={2} style={{ width: '100%' }}>
      <Space>
        <Text strong style={{ color }}>{formatPercent(foir, 1)}</Text>
        {pct > 60 && <Tooltip title="FOIR exceeds 60% — high risk for new loans"><WarningFilled style={{ color: '#f5222d' }} /></Tooltip>}
        {pct <= 50 && <Tooltip title="FOIR within limit"><CheckCircleFilled style={{ color: '#52c41a' }} /></Tooltip>}
      </Space>
      <Progress
        percent={pct}
        showInfo={false}
        size="small"
        strokeColor={color}
        style={{ margin: 0 }}
      />
      <Text type="secondary" style={{ fontSize: 11 }}>Threshold: 50–60%</Text>
    </Space>
  )
}

const CustomerDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState(null)
  const [loans, setLoans] = useState([])
  const [allLoans, setAllLoans] = useState([])   // for KPI computation (first page)
  const [loanMeta, setLoanMeta] = useState({ page: 0, size: 10, totalElements: 0 })
  const [docs, setDocs] = useState([])
  const [docMeta, setDocMeta] = useState({ page: 0, size: 10, totalElements: 0 })

  const [loading, setLoading] = useState(true)
  const [loansLoading, setLoansLoading] = useState(false)
  const [docsLoading, setDocsLoading] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm] = Form.useForm()
  const [saving, setSaving] = useState(false)

  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  const fetchCustomer = async () => {
    setLoading(true)
    try {
      const res = await customerApi.getById(id)
      setCustomer(res.data?.data)
    } catch (err) {
      showError(err, 'Failed to load customer')
    } finally {
      setLoading(false)
    }
  }

  const fetchLoans = async (page = 0, size = 10) => {
    setLoansLoading(true)
    try {
      const res = await loanApi.getByCustomerId(id, { page, size })
      const data = res.data?.data
      const content = data?.content || []
      setLoans(content)
      setLoanMeta({ page: data?.page ?? 0, size: data?.size ?? size, totalElements: data?.totalElements ?? 0 })
      if (page === 0) setAllLoans(content)
    } catch {
      // silent
    } finally {
      setLoansLoading(false)
    }
  }

  const fetchDocs = async (page = 0, size = 10) => {
    if (!customer) return
    setDocsLoading(true)
    try {
      const res = await documentApi.getByCustomer(customer.customerNumber, { page, size })
      const data = res.data?.data
      setDocs(data?.content || [])
      setDocMeta({ page: data?.page ?? 0, size: data?.size ?? size, totalElements: data?.totalElements ?? 0 })
    } catch {
      // silent
    } finally {
      setDocsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomer()
    fetchLoans()
  }, [id]) // eslint-disable-line

  // fetch docs after customer is loaded
  useEffect(() => {
    if (customer) fetchDocs()
  }, [customer?.customerNumber]) // eslint-disable-line

  // ── Derived KPIs from loans ────────────────────────────────────────────────
  const activeLoans = allLoans.filter((l) =>
    ['ACTIVE', 'OVERDUE', 'NPA'].includes(l.loanStatusCode)
  )
  const totalOutstanding = activeLoans.reduce((s, l) => s + (l.outstandingAmount || 0), 0)
  const totalOverdue = activeLoans
    .filter((l) => ['OVERDUE', 'NPA'].includes(l.loanStatusCode))
    .reduce((s, l) => s + (l.totalOverdueAmount || 0), 0)
  const totalMonthlyEmi = activeLoans.reduce((s, l) => s + (l.emiAmount || 0), 0)
  const foir = customer?.monthlySalary > 0
    ? (totalMonthlyEmi / customer.monthlySalary) * 100
    : null

  // ── Edit drawer ────────────────────────────────────────────────────────────
  const openEdit = () => {
    editForm.setFieldsValue({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      dob: customer.dob ? dayjs(customer.dob) : null,
      address: customer.address,
      occupation: customer.occupation,
      employmentType: customer.employmentType,
      monthlySalary: customer.monthlySalary,
    })
    setEditOpen(true)
  }

  const handleSave = async (values) => {
    setSaving(true)
    try {
      await customerApi.update(id, { ...values, dob: values.dob ? values.dob.toISOString() : null })
      showSuccess('Customer updated successfully.')
      setEditOpen(false)
      fetchCustomer()
    } catch (err) {
      showError(err, 'Update Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    setDeactivating(true)
    try {
      await customerApi.deactivate(id)
      showSuccess('Customer deactivated.')
      setDeactivateOpen(false)
      fetchCustomer()
    } catch (err) {
      showError(err, 'Deactivation Failed')
    } finally {
      setDeactivating(false)
    }
  }

  // ── Loan table columns ─────────────────────────────────────────────────────
  const loanColumns = [
    {
      title: 'Loan No.',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#1B3A6B', fontWeight: 600 }}>{v}</span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'loanTypeName',
      key: 'loanTypeName',
      render: (v) => v || '—',
    },
    {
      title: 'Loan Amount',
      dataIndex: 'loanAmount',
      key: 'loanAmount',
      align: 'right',
      render: (v) => formatCurrency(v, 0),
    },
    {
      title: 'Outstanding',
      dataIndex: 'outstandingAmount',
      key: 'outstandingAmount',
      align: 'right',
      render: (v) => formatCurrency(v, 0),
    },
    {
      title: 'EMI / Month',
      dataIndex: 'emiAmount',
      key: 'emiAmount',
      align: 'right',
      render: (v) => formatCurrency(v, 0),
    },
    {
      title: 'DPD',
      dataIndex: 'currentDpd',
      key: 'currentDpd',
      width: 80,
      align: 'center',
      render: (v) => {
        if (v === null || v === undefined) return '—'
        const color = v === 0 ? '#52c41a' : v <= 30 ? '#faad14' : '#f5222d'
        return <span style={{ color, fontWeight: 600 }}>{v === 0 ? 'Current' : v + 'd'}</span>
      },
    },
    {
      title: 'Status',
      dataIndex: 'loanStatusCode',
      key: 'loanStatusCode',
      render: (v) => <LoanStatusTag status={v} />,
    },
    {
      title: 'Applied On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => formatDate(v),
    },
    {
      title: '',
      key: 'action',
      render: (_, row) => (
        <Button type="link" size="small" icon={<FileTextOutlined />}
          onClick={() => navigate('/los/applications/' + row.loanNumber)}>
          View
        </Button>
      ),
    },
  ]

  // ── Document table columns ─────────────────────────────────────────────────
  const docColumns = [
    {
      title: 'Document Type',
      dataIndex: 'documentTypeName',
      key: 'documentTypeName',
      render: (v) => v || '—',
    },
    {
      title: 'File Name',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
      render: (v, row) =>
        row.fileUrl
          ? <a href={row.fileUrl} target="_blank" rel="noreferrer">{v || 'View File'}</a>
          : v || '—',
    },
    {
      title: 'Loan',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      render: (v) => v
        ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>
        : <Tag>KYC</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'uploadStatus',
      key: 'uploadStatus',
      render: (v) => <DocStatusTag status={v} />,
    },
    {
      title: 'Verified By',
      dataIndex: 'verifiedBy',
      key: 'verifiedBy',
      render: (v) => v || '—',
    },
    {
      title: 'Uploaded On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => formatDate(v),
    },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }
  if (!customer) return null

  const headerActions = (
    <Space>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/customers')}>Back</Button>
      <Button icon={<EditOutlined />} onClick={openEdit}>Edit</Button>
      {customer.isActive && (
        <Button danger icon={<StopOutlined />} onClick={() => setDeactivateOpen(true)}>Deactivate</Button>
      )}
    </Space>
  )

  const tabItems = [
    {
      key: 'profile',
      label: 'Profile',
      children: (
        <Row gutter={[16, 16]}>

          {/* Loan Portfolio KPIs */}
          <Col span={24}>
            <Card size="small" style={{ borderRadius: 10, background: '#f8faff', border: '1px solid #dce8ff' }}>
              <Row gutter={16}>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={<Text style={{ fontSize: 12 }}>Total Outstanding</Text>}
                    value={totalOutstanding}
                    formatter={(v) => formatCurrency(v, 0)}
                    valueStyle={{ fontSize: 18, color: '#1B3A6B' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={<Text style={{ fontSize: 12 }}>Monthly EMI Obligation</Text>}
                    value={totalMonthlyEmi}
                    formatter={(v) => formatCurrency(v, 0)}
                    valueStyle={{ fontSize: 18, color: '#096dd9' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={<Text style={{ fontSize: 12 }}>Total Overdue</Text>}
                    value={totalOverdue}
                    formatter={(v) => formatCurrency(v, 0)}
                    valueStyle={{ fontSize: 18, color: totalOverdue > 0 ? '#cf1322' : '#52c41a' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <div>
                    <Text style={{ fontSize: 12, color: '#888' }}>FOIR</Text>
                    <div style={{ marginTop: 4 }}>
                      <FoirBar foir={foir} />
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Personal Info */}
          <Col xs={24} md={12}>
            <Card title={<Space><IdcardOutlined />Personal Info</Space>} size="small" style={{ borderRadius: 10 }}>
              <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 140 }}>
                <Descriptions.Item label="Customer No.">
                  <Text strong style={{ fontFamily: 'monospace' }}>{customer.customerNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Full Name">{customer.name}</Descriptions.Item>
                <Descriptions.Item label={<Space size={4}><PhoneOutlined />Phone</Space>}>{customer.phone || '—'}</Descriptions.Item>
                <Descriptions.Item label={<Space size={4}><MailOutlined />Email</Space>}>{customer.email || '—'}</Descriptions.Item>
                <Descriptions.Item label="Date of Birth">{customer.dob ? formatDate(customer.dob) : '—'}</Descriptions.Item>
                <Descriptions.Item label="Address">{customer.address || '—'}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* KYC & Credit */}
          <Col xs={24} md={12}>
            <Card title={<Space><IdcardOutlined />KYC & Credit</Space>} size="small" style={{ borderRadius: 10 }}>
              <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 140 }}>
                <Descriptions.Item label="PAN">
                  <Text style={{ fontFamily: 'monospace' }}>{maskPan(customer.pan)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Aadhaar">
                  <Text style={{ fontFamily: 'monospace' }}>{maskAadhaar(customer.aadhar)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Credit Score">
                  <CreditScorePill score={customer.creditScore} />
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {customer.isActive
                    ? <Tag color="success">Active</Tag>
                    : <Tag color="default">Inactive</Tag>}
                </Descriptions.Item>
                {!customer.isActive && customer.deactivatedAt && (
                  <Descriptions.Item label="Deactivated On">{formatDate(customer.deactivatedAt)}</Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>

          {/* Employment */}
          <Col xs={24} md={12}>
            <Card title="Employment & Income" size="small" style={{ borderRadius: 10 }}>
              <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 140 }}>
                <Descriptions.Item label="Employment">
                  {customer.employmentType
                    ? <Tag color={customer.employmentType === 'SALARIED' ? 'blue' : 'purple'}>
                        {customer.employmentType === 'SALARIED' ? 'Salaried' : 'Self Employed'}
                      </Tag>
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Occupation">{customer.occupation || '—'}</Descriptions.Item>
                <Descriptions.Item label="Monthly Income">{formatCurrency(customer.monthlySalary, 0)}</Descriptions.Item>
                <Descriptions.Item label="Branch Code">
                  {customer.homeBranchCode ? <Tag>{customer.homeBranchCode}</Tag> : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Rel. Manager">
                  {customer.relationshipManagerName
                    ? <span>{customer.relationshipManagerName}{' '}
                        <Text type="secondary" style={{ fontSize: 11 }}>({customer.relationshipManagerEmployeeId})</Text>
                      </span>
                    : '—'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Record Info */}
          <Col xs={24} md={12}>
            <Card title="Record Info" size="small" style={{ borderRadius: 10 }}>
              <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 140 }}>
                <Descriptions.Item label="Onboarded By">{customer.createdBy || '—'}</Descriptions.Item>
                <Descriptions.Item label="Onboarded On">{formatDateTime(customer.createdAt)}</Descriptions.Item>
                <Descriptions.Item label="Last Updated">{customer.updatedAt ? formatDateTime(customer.updatedAt) : '—'}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'loans',
      label: (
        <Space size={6}>
          <FileTextOutlined />
          Loans
          {loanMeta.totalElements > 0 && <Tag style={{ marginLeft: 0 }}>{loanMeta.totalElements}</Tag>}
        </Space>
      ),
      children: (
        <Card size="small" style={{ borderRadius: 10 }}
          extra={
            <Button type="primary" size="small" icon={<FileTextOutlined />}
              onClick={() => navigate('/los/applications/new')}>
              New Loan
            </Button>
          }
        >
          <Table
            columns={loanColumns}
            dataSource={loans}
            rowKey="id"
            loading={loansLoading}
            size="small"
            pagination={{
              current: (loanMeta.page ?? 0) + 1,
              pageSize: loanMeta.size ?? 10,
              total: loanMeta.totalElements ?? 0,
              showTotal: (t) => t + ' loans',
              onChange: (p, s) => fetchLoans(p - 1, s),
            }}
            locale={{ emptyText: 'No loans found for this customer' }}
            scroll={{ x: 1000 }}
          />
        </Card>
      ),
    },
    {
      key: 'documents',
      label: (
        <Space size={6}>
          <FileDoneOutlined />
          Documents
          {docMeta.totalElements > 0 && <Tag style={{ marginLeft: 0 }}>{docMeta.totalElements}</Tag>}
        </Space>
      ),
      children: (
        <Card size="small" style={{ borderRadius: 10 }}>
          <Table
            columns={docColumns}
            dataSource={docs}
            rowKey="id"
            loading={docsLoading}
            size="small"
            pagination={{
              current: (docMeta.page ?? 0) + 1,
              pageSize: docMeta.size ?? 10,
              total: docMeta.totalElements ?? 0,
              showTotal: (t) => t + ' documents',
              onChange: (p, s) => fetchDocs(p - 1, s),
            }}
            locale={{ emptyText: 'No documents uploaded for this customer' }}
            scroll={{ x: 800 }}
          />
        </Card>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={customer.name}
        subtitle={'Customer No: ' + customer.customerNumber}
        breadcrumbs={[
          { label: 'Customers', path: '/customers' },
          { label: customer.name },
        ]}
        actions={headerActions}
      />

      <Tabs items={tabItems} defaultActiveKey="profile" />

      {/* Edit Drawer */}
      <Drawer
        title="Edit Customer"
        open={editOpen}
        onClose={() => setEditOpen(false)}
        width={560}
        extra={
          <Button type="primary" loading={saving} icon={<SaveOutlined />} onClick={() => editForm.submit()}>
            Save Changes
          </Button>
        }
      >
        <Form form={editForm} layout="vertical" onFinish={handleSave} requiredMark="optional">
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#888' }}>Personal</Divider>
          <Row gutter={12}>
            <Col span={24}>
              <Form.Item label="Full Name" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone"
                rules={[{ required: true }, { pattern: /^\d{10}$/, message: 'Invalid phone' }]}>
                <Input maxLength={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email" rules={[{ required: true }, { type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Date of Birth" name="dob">
                <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Address" name="address">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#888' }}>Employment</Divider>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Employment Type" name="employmentType">
                <Select allowClear placeholder="Select type">
                  <Option value="SALARIED">Salaried</Option>
                  <Option value="SELF_EMPLOYED">Self Employed</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Occupation" name="occupation">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Monthly Income (₹)" name="monthlySalary">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      <ConfirmModal
        open={deactivateOpen}
        title="Deactivate Customer"
        type="danger"
        message={'Deactivate ' + customer.name + '? This action will mark the customer as inactive.'}
        subMessage="All associated loans and records are preserved. The customer will not be able to apply for new loans."
        confirmText="Deactivate"
        confirmDanger
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateOpen(false)}
      />
    </>
  )
}

export default CustomerDetail
