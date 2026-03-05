import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Form, Input, Select, DatePicker, InputNumber,
  Button, Card, Row, Col, Divider, Space,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import { customerApi } from '../../api/customerApi'
import { showError, showSuccess } from '../../utils/errorHandler'
import useAuthStore from '../../store/authStore'

const { Option } = Select
const { TextArea } = Input

const NewCustomer = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        dob: values.dob ? values.dob.toISOString() : null,
        createdBy: user?.username || user?.employeeId || 'SYSTEM',
      }
      const res = await customerApi.create(payload)
      const id = res.data?.data?.id
      showSuccess('Customer onboarded successfully.')
      navigate('/customers/' + id)
    } catch (err) {
      showError(err, 'Failed to create customer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="New Customer"
        subtitle="Onboard a new customer with KYC and employment details"
        breadcrumbs={[
          { label: 'Customers', path: '/customers' },
          { label: 'New Customer' },
        ]}
        actions={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/customers')}>
            Back
          </Button>
        }
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark="optional"
        scrollToFirstError
      >
        {/* Personal Information */}
        <Card
          title="Personal Information"
          size="small"
          style={{ marginBottom: 16, borderRadius: 10 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Full name is required' }]}
              >
                <Input placeholder="e.g. Ramesh Kumar" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[
                  { required: true, message: 'Phone number is required' },
                  { pattern: /^\d{10}$/, message: 'Enter a valid 10-digit phone number' },
                ]}
              >
                <Input placeholder="10-digit mobile number" maxLength={10} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Enter a valid email address' },
                ]}
              >
                <Input placeholder="email@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Date of Birth" name="dob">
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD MMM YYYY"
                  disabledDate={(d) => d && d.isAfter(new Date())}
                  placeholder="Select date of birth"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item label="Address" name="address">
                <TextArea rows={2} placeholder="Full residential address" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* KYC Details */}
        <Card
          title="KYC Details"
          size="small"
          style={{ marginBottom: 16, borderRadius: 10 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="PAN Number"
                name="pan"
                rules={[
                  { required: true, message: 'PAN is required' },
                  { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN format (e.g. ABCDE1234F)' },
                ]}
              >
                <Input
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                  onChange={(e) => form.setFieldValue('pan', e.target.value.toUpperCase())}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Aadhaar Number"
                name="aadhar"
                rules={[
                  { required: true, message: 'Aadhaar is required' },
                  { pattern: /^\d{12}$/, message: 'Aadhaar must be exactly 12 digits' },
                ]}
              >
                <Input
                  placeholder="12-digit Aadhaar number"
                  maxLength={12}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Employment & Financial Details */}
        <Card
          title="Employment & Financial Details"
          size="small"
          style={{ marginBottom: 16, borderRadius: 10 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Employment Type" name="employmentType">
                <Select placeholder="Select employment type" allowClear>
                  <Option value="SALARIED">Salaried</Option>
                  <Option value="SELF_EMPLOYED">Self Employed</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Occupation" name="occupation">
                <Input placeholder="e.g. Software Engineer, Business Owner" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Monthly Income (₹)" name="monthlySalary">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="e.g. 75000"
                  min={0}
                  formatter={(v) => v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                  parser={(v) => v ? v.replace(/,/g, '') : ''}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Branch & RM */}
        <Card
          title="Branch & Relationship Manager"
          size="small"
          style={{ marginBottom: 24, borderRadius: 10 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Home Branch Code" name="homeBranchCode">
                <Input placeholder="e.g. BLR001" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Relationship Manager (Employee ID)"
                name="relationshipManagerEmployeeId"
                extra="Leave blank if not assigned"
              >
                <Input placeholder="e.g. EMP001" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider style={{ margin: '0 0 20px' }} />

        <Space>
          <Button onClick={() => navigate('/customers')}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={submitting} icon={<SaveOutlined />}>
            Onboard Customer
          </Button>
        </Space>
      </Form>
    </>
  )
}

export default NewCustomer
