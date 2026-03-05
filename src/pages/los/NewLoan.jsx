import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Form, Input, Select, InputNumber, Button, Card, Row, Col,
  Divider, Space, Typography, Alert, Spin,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined, CalculatorOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import { loanApi } from '../../api/loanApi'
import { customerApi } from '../../api/customerApi'
import { masterApi } from '../../api/masterApi'
import { formatCurrency, formatPercent } from '../../utils/formatters'
import { showError, showSuccess } from '../../utils/errorHandler'
import useAuthStore from '../../store/authStore'

const { Option } = Select
const { Text } = Typography

// reducing balance EMI formula
const calcEmi = (principal, annualRate, months) => {
  if (!principal || !annualRate || !months) return null
  const r = annualRate / 12 / 100
  if (r === 0) return principal / months
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

const NewLoan = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  // master data
  const [loanTypes, setLoanTypes] = useState([])
  const [loanPurposes, setLoanPurposes] = useState([])
  const [tenures, setTenures] = useState([])

  // customer search
  const [customers, setCustomers] = useState([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerLoading, setCustomerLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // EMI preview
  const [emiPreview, setEmiPreview] = useState(null)
  const [applicableRate, setApplicableRate] = useState(null)
  const [rateLoading, setRateLoading] = useState(false)

  // load loan types + purposes on mount
  useEffect(() => {
    Promise.all([masterApi.getLoanTypes(), masterApi.getLoanPurposes()])
      .then(([typesRes, purposesRes]) => {
        setLoanTypes(typesRes.data?.data || [])
        setLoanPurposes(purposesRes.data?.data || [])
      })
      .catch(() => {})
  }, [])

  // search customers
  useEffect(() => {
    if (!customerSearch || customerSearch.length < 2) { setCustomers([]); return }
    setCustomerLoading(true)
    customerApi.getAll({ page: 0, size: 10, name: customerSearch })
      .then((r) => setCustomers(r.data?.data?.content || []))
      .catch(() => {})
      .finally(() => setCustomerLoading(false))
  }, [customerSearch])

  const handleLoanTypeChange = async (code) => {
    form.setFieldValue('tenureMonths', undefined)
    setTenures([])
    setApplicableRate(null)
    setEmiPreview(null)
    if (!code) return
    try {
      const r = await masterApi.getTenures(code)
      setTenures(r.data?.data || [])
    } catch { /* silent */ }
  }

  const fetchRate = async () => {
    const loanTypeCode = form.getFieldValue('loanTypeCode')
    const loanAmount = form.getFieldValue('loanAmount')
    const tenureMonths = form.getFieldValue('tenureMonths')
    if (!loanTypeCode || !loanAmount || !tenureMonths) return
    setRateLoading(true)
    try {
      const r = await masterApi.getApplicableRate({ loanTypeCode, loanAmount, tenureMonths })
      const rate = r.data?.data?.interestRate
      setApplicableRate(rate)
      const emi = calcEmi(loanAmount, rate, tenureMonths)
      setEmiPreview(emi)
    } catch { setApplicableRate(null); setEmiPreview(null) }
    finally { setRateLoading(false) }
  }

  const handleCustomerSelect = (id) => {
    const c = customers.find((c) => c.id === id)
    setSelectedCustomer(c || null)
  }

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      const payload = {
        customerId: values.customerId,
        loanTypeCode: values.loanTypeCode,
        loanPurposeCode: values.loanPurposeCode,
        purpose: values.purpose,
        loanAmount: values.loanAmount,
        tenureMonths: values.tenureMonths,
        disbursementAccountNumber: values.disbursementAccountNumber,
        disbursementIfsc: values.disbursementIfsc,
        createdBy: user?.username || user?.employeeId || 'SYSTEM',
      }
      const res = await loanApi.create(payload)
      const loanNumber = res.data?.data?.loanNumber
      showSuccess('Loan application created successfully.')
      navigate('/los/applications/' + loanNumber)
    } catch (err) {
      showError(err, 'Failed to create loan application')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="New Loan Application"
        subtitle="Initiate a new loan for an existing customer"
        breadcrumbs={[
          { label: 'LOS' },
          { label: 'Applications', path: '/los/applications' },
          { label: 'New Application' },
        ]}
        actions={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/los/applications')}>
            Back
          </Button>
        }
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional" scrollToFirstError>

        {/* Customer Selection */}
        <Card title="Customer" size="small" style={{ marginBottom: 16, borderRadius: 10 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Search & Select Customer" name="customerId"
                rules={[{ required: true, message: 'Please select a customer' }]}>
                <Select
                  showSearch
                  placeholder="Type customer name to search..."
                  filterOption={false}
                  onSearch={setCustomerSearch}
                  onSelect={handleCustomerSelect}
                  loading={customerLoading}
                  notFoundContent={customerSearch.length < 2
                    ? 'Type at least 2 characters'
                    : customerLoading ? <Spin size="small" /> : 'No customers found'}
                >
                  {customers.map((c) => (
                    <Option key={c.id} value={c.id}>
                      <Space>
                        <Text strong>{c.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{c.customerNumber}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{c.phone}</Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Selected customer summary */}
            {selectedCustomer && (
              <Col xs={24} md={12}>
                <div style={{
                  background: '#f8faff', border: '1px solid #dce8ff',
                  borderRadius: 8, padding: '10px 14px',
                }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Customer No.</Text>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1B3A6B' }}>
                        {selectedCustomer.customerNumber}
                      </div>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Monthly Income</Text>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(selectedCustomer.monthlySalary, 0)}</div>
                    </Col>
                    <Col span={12} style={{ marginTop: 6 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Employment</Text>
                      <div style={{ fontSize: 13 }}>{selectedCustomer.employmentType?.replace('_', ' ') || '—'}</div>
                    </Col>
                    <Col span={12} style={{ marginTop: 6 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Credit Score</Text>
                      <div style={{
                        fontWeight: 700,
                        color: selectedCustomer.creditScore >= 750 ? '#52c41a'
                          : selectedCustomer.creditScore >= 650 ? '#faad14' : '#f5222d',
                      }}>
                        {selectedCustomer.creditScore || '—'}
                      </div>
                    </Col>
                  </Row>
                </div>
              </Col>
            )}
          </Row>
        </Card>

        {/* Loan Configuration */}
        <Card title="Loan Configuration" size="small" style={{ marginBottom: 16, borderRadius: 10 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Loan Type" name="loanTypeCode"
                rules={[{ required: true, message: 'Select loan type' }]}>
                <Select placeholder="Select loan type" onChange={handleLoanTypeChange}>
                  {loanTypes.map((t) => (
                    <Option key={t.code} value={t.code}>{t.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Loan Purpose" name="loanPurposeCode"
                rules={[{ required: true, message: 'Select loan purpose' }]}>
                <Select placeholder="Select purpose">
                  {loanPurposes.map((p) => (
                    <Option key={p.code} value={p.code}>{p.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item label="Purpose Description" name="purpose"
                rules={[{ required: true, message: 'Describe the purpose' }]}>
                <Input placeholder="e.g. Purchase of two-wheeler for commute" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Loan Amount (₹)" name="loanAmount"
                rules={[{ required: true, message: 'Enter loan amount' }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={1000}
                  placeholder="e.g. 500000"
                  formatter={(v) => v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                  parser={(v) => v ? v.replace(/,/g, '') : ''}
                  onChange={() => { setEmiPreview(null); setApplicableRate(null) }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Tenure" name="tenureMonths"
                rules={[{ required: true, message: 'Select tenure' }]}>
                <Select placeholder={tenures.length ? 'Select tenure' : 'Select loan type first'}
                  disabled={!tenures.length}
                  onChange={() => { setEmiPreview(null); setApplicableRate(null) }}>
                  {tenures.map((t) => (
                    <Option key={t.tenureMonths} value={t.tenureMonths}>
                      {t.tenureMonths} months {t.tenureMonths >= 12 ? '(' + (t.tenureMonths / 12).toFixed(1).replace('.0', '') + ' yr)' : ''}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Form.Item style={{ width: '100%', marginBottom: 24 }}>
                <Button
                  icon={<CalculatorOutlined />}
                  onClick={fetchRate}
                  loading={rateLoading}
                  style={{ width: '100%' }}
                >
                  Calculate EMI
                </Button>
              </Form.Item>
            </Col>
          </Row>

          {/* EMI Preview */}
          {emiPreview && (
            <Alert
              type="success"
              style={{ marginTop: 4, marginBottom: 8 }}
              message={
                <Row gutter={24}>
                  <Col>
                    <Text type="secondary" style={{ fontSize: 12 }}>Interest Rate</Text>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{formatPercent(applicableRate)}</div>
                  </Col>
                  <Col>
                    <Text type="secondary" style={{ fontSize: 12 }}>Monthly EMI</Text>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#1B3A6B' }}>{formatCurrency(emiPreview, 0)}</div>
                  </Col>
                  <Col>
                    <Text type="secondary" style={{ fontSize: 12 }}>Total Interest</Text>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                      {formatCurrency(emiPreview * form.getFieldValue('tenureMonths') - form.getFieldValue('loanAmount'), 0)}
                    </div>
                  </Col>
                  <Col>
                    <Text type="secondary" style={{ fontSize: 12 }}>Total Payable</Text>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                      {formatCurrency(emiPreview * form.getFieldValue('tenureMonths'), 0)}
                    </div>
                  </Col>
                </Row>
              }
            />
          )}
        </Card>

        {/* Disbursement Details */}
        <Card title="Disbursement Details" size="small" style={{ marginBottom: 24, borderRadius: 10 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Bank Account Number" name="disbursementAccountNumber"
                rules={[{ required: true, message: 'Enter account number' }]}>
                <Input placeholder="Account number for disbursement" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="IFSC Code" name="disbursementIfsc"
                rules={[
                  { required: true, message: 'Enter IFSC code' },
                  { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Invalid IFSC format (e.g. SBIN0001234)' },
                ]}>
                <Input
                  placeholder="e.g. SBIN0001234"
                  maxLength={11}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                  onChange={(e) => form.setFieldValue('disbursementIfsc', e.target.value.toUpperCase())}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider style={{ margin: '0 0 20px' }} />
        <Space>
          <Button onClick={() => navigate('/los/applications')}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={submitting} icon={<SaveOutlined />}>
            Submit Application
          </Button>
        </Space>
      </Form>
    </>
  )
}

export default NewLoan
