import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Tabs, Select, Space, Row, Col, Statistic, Modal, Form, Input, InputNumber, Switch, Tooltip } from 'antd'
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import { masterApi } from '../../api/masterApi'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

const boolIcon = (v) => v
  ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
  : <CloseCircleOutlined style={{ color: '#bbb' }} />

// ─── Loan Types ─────────────────────────────────────────────────────────────
const LoanTypes = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await masterApi.getLoanTypes()
      setData(res.data?.data || [])
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const columns = [
    { title: 'Code',          dataIndex: 'code',         key: 'code',         render: (v) => <Tag color="blue">{v}</Tag> },
    { title: 'Name',          dataIndex: 'name',         key: 'name' },
    { title: 'Description',   dataIndex: 'description',  key: 'description',  render: (v) => <span style={{ fontSize: 12, color: '#666' }}>{v || '—'}</span> },
    { title: 'Secured',       dataIndex: 'isSecured',    key: 'isSecured',    align: 'center', render: boolIcon },
    { title: 'Collateral Req', dataIndex: 'collateralRequired', key: 'collReq', align: 'center', render: boolIcon },
    { title: 'Collateral Type', dataIndex: 'collateralType', key: 'collType', render: (v) => v ? <Tag>{v}</Tag> : '—' },
    { title: 'Max LTV %',     dataIndex: 'maxLtvPercentage', key: 'ltv',      render: (v) => v ? `${v}%` : '—', align: 'center' },
    { title: 'Status',        dataIndex: 'isActive',     key: 'isActive',     render: (v) => <Tag color={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag> },
  ]

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="id"
      size="small"
      loading={loading}
      pagination={false}
      locale={{ emptyText: 'No loan types found' }}
    />
  )
}

// ─── Interest Rate Config ────────────────────────────────────────────────────
const InterestRates = () => {
  const [data, setData]         = useState([])
  const [filtered, setFiltered] = useState([])
  const [loanTypes, setLoanTypes] = useState([])
  const [selectedType, setSelectedType] = useState(null)
  const [loading, setLoading]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [ratesRes, typesRes] = await Promise.all([
        masterApi.getInterestRates(),
        masterApi.getLoanTypes(),
      ])
      const rates = ratesRes.data?.data || []
      setData(rates)
      setFiltered(rates)
      setLoanTypes(typesRes.data?.data || [])
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleFilter = (val) => {
    setSelectedType(val)
    setFiltered(val ? data.filter(r => r.loanType?.code === val) : data)
  }

  const columns = [
    { title: 'Loan Type',     dataIndex: ['loanType', 'name'], key: 'loanType' },
    { title: 'Credit Score',  key: 'creditScore',  render: (_, r) => `${r.minCreditScore} – ${r.maxCreditScore}` },
    { title: 'Loan Amount',   key: 'loanAmount',   render: (_, r) => `${formatCurrency(r.minLoanAmount)} – ${formatCurrency(r.maxLoanAmount)}` },
    { title: 'Tenure (Mo)',   dataIndex: 'tenureMonths',  key: 'tenure',   align: 'center' },
    { title: 'Interest Rate', dataIndex: 'interestRate',  key: 'rate',     align: 'center', render: (v) => <span style={{ fontWeight: 700, color: '#722ed1' }}>{v}%</span> },
    { title: 'Effective From', dataIndex: 'effectiveFrom', key: 'effFrom', render: (v) => formatDateTime(v) },
    { title: 'Status',        dataIndex: 'isActive',      key: 'isActive', render: (v) => <Tag color={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag> },
  ]

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Select
          allowClear
          placeholder="Filter by loan type"
          style={{ width: 240 }}
          options={loanTypes.map(t => ({ value: t.code, label: t.name }))}
          onChange={handleFilter}
          value={selectedType}
        />
      </div>
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        size="small"
        loading={loading}
        pagination={{ pageSize: 15, size: 'small' }}
        locale={{ emptyText: 'No interest rate configs found' }}
        scroll={{ x: 800 }}
      />
    </>
  )
}

// ─── Loan Purposes ───────────────────────────────────────────────────────────
const LoanPurposes = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await masterApi.getLoanPurposes()
      setData(res.data?.data || [])
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const columns = [
    { title: 'Code',        dataIndex: 'code',        key: 'code',        render: (v) => <Tag color="geekblue">{v}</Tag> },
    { title: 'Name',        dataIndex: 'name',        key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description', render: (v) => <span style={{ fontSize: 12, color: '#666' }}>{v || '—'}</span> },
    { title: 'Status',      dataIndex: 'isActive',    key: 'isActive',    render: (v) => <Tag color={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag> },
  ]

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="id"
      size="small"
      loading={loading}
      pagination={false}
      locale={{ emptyText: 'No loan purposes found' }}
    />
  )
}

// ─── Document Types ──────────────────────────────────────────────────────────
const DocumentTypes = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await masterApi.getDocumentTypes()
      setData(res.data?.data || [])
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const columns = [
    { title: 'Code',          dataIndex: 'code',          key: 'code',          render: (v) => <Tag color="orange">{v}</Tag> },
    { title: 'Name',          dataIndex: 'name',          key: 'name' },
    { title: 'Applicable For', dataIndex: 'applicableFor', key: 'applicableFor', render: (v) => <Tag>{v}</Tag> },
    { title: 'Mandatory',     dataIndex: 'isMandatory',   key: 'isMandatory',   align: 'center', render: boolIcon },
    { title: 'Status',        dataIndex: 'isActive',      key: 'isActive',      render: (v) => <Tag color={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag> },
  ]

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="id"
      size="small"
      loading={loading}
      pagination={false}
      locale={{ emptyText: 'No document types found' }}
    />
  )
}

// ─── Pre-Closure Charges ─────────────────────────────────────────────────────
const PreClosureConfig = () => {
  const [data, setData]           = useState([])
  const [loanTypes, setLoanTypes] = useState([])
  const [loading, setLoading]     = useState(false)
  const [modal, setModal]         = useState({ open: false, record: null })
  const [saving, setSaving]       = useState(false)
  const [form]                    = Form.useForm()
  const load = async () => {
    setLoading(true)
    try {
      const [cfgRes, typesRes] = await Promise.all([
        masterApi.getPreClosureConfigs(),
        masterApi.getLoanTypes(),
      ])
      setData(cfgRes.data?.data || [])
      setLoanTypes(typesRes.data?.data || [])
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    form.resetFields()
    form.setFieldsValue({ isActive: true, chargeType: 'PERCENTAGE' })
    setModal({ open: true, record: null })
  }

  const openEdit = (record) => {
    form.setFieldsValue({
      loanTypeId: record.loanType?.id,
      chargeType: record.chargeType,
      chargeValue: record.chargeValue,
      minCharge: record.minCharge,
      maxCharge: record.maxCharge,
      isActive: record.isActive,
    })
    setModal({ open: true, record })
  }

  const handleSave = async (values) => {
    setSaving(true)
    try {
      const payload = {
        chargeType: values.chargeType,
        chargeValue: values.chargeValue,
        minCharge: values.minCharge || null,
        maxCharge: values.maxCharge || null,
        isActive: values.isActive,
        loanType: { id: values.loanTypeId },
      }
      if (modal.record) {
        await masterApi.updatePreClosureConfig(modal.record.id, payload)
      } else {
        await masterApi.createPreClosureConfig(payload)
      }
      setModal({ open: false, record: null })
      load()
    } catch (err) { showError(err, 'Save failed') }
    finally { setSaving(false) }
  }

  const columns = [
    { title: 'Loan Type',    dataIndex: ['loanType', 'name'], key: 'loanType', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: 'Charge Type',  dataIndex: 'chargeType',         key: 'chargeType', render: (v) => <Tag color={v === 'PERCENTAGE' ? 'purple' : 'orange'}>{v}</Tag> },
    {
      title: 'Charge Value', key: 'chargeValue',
      render: (_, r) => r.chargeType === 'PERCENTAGE'
        ? <span style={{ fontWeight: 700, color: '#722ed1' }}>{r.chargeValue}%</span>
        : <span style={{ fontWeight: 700, color: '#d46b08' }}>₹{r.chargeValue?.toLocaleString()}</span>,
    },
    { title: 'Min Charge',   dataIndex: 'minCharge',   key: 'minCharge',  render: (v) => v != null ? `₹${v.toLocaleString()}` : '—', align: 'center' },
    { title: 'Max Charge',   dataIndex: 'maxCharge',   key: 'maxCharge',  render: (v) => v != null ? `₹${v.toLocaleString()}` : '—', align: 'center' },
    { title: 'Status',       dataIndex: 'isActive',    key: 'isActive',   render: (v) => <Tag color={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag> },
    {
      title: '', key: 'actions',
      render: (_, r) => (
        <Tooltip title="Edit">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
        </Tooltip>
      ),
    },
  ]

  const chargeTypeValue = Form.useWatch('chargeType', form)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Config</Button>
      </div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        size="small"
        loading={loading}
        pagination={false}
        locale={{ emptyText: 'No pre-closure charge configs found' }}
      />

      <Modal
        title={modal.record ? 'Edit Pre-Closure Charge' : 'Add Pre-Closure Charge'}
        open={modal.open}
        onCancel={() => setModal({ open: false, record: null })}
        onOk={() => form.submit()}
        okText="Save"
        confirmLoading={saving}
        width={440}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} requiredMark="optional" style={{ marginTop: 16 }}>
          <Form.Item label="Loan Type" name="loanTypeId" rules={[{ required: true, message: 'Select loan type' }]}>
            <Select placeholder="Select loan type" options={loanTypes.map(t => ({ value: t.id, label: t.name }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Charge Type" name="chargeType" rules={[{ required: true }]}>
                <Select options={[{ value: 'PERCENTAGE', label: 'Percentage (%)' }, { value: 'FLAT', label: 'Flat Amount (₹)' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={chargeTypeValue === 'PERCENTAGE' ? 'Charge %' : 'Charge Amount (₹)'}
                name="chargeValue"
                rules={[{ required: true, message: 'Enter charge value' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={chargeTypeValue === 'PERCENTAGE' ? 100 : undefined}
                  addonAfter={chargeTypeValue === 'PERCENTAGE' ? '%' : '₹'}
                />
              </Form.Item>
            </Col>
            {chargeTypeValue === 'PERCENTAGE' && (
              <>
                <Col span={12}>
                  <Form.Item label="Min Charge (₹)" name="minCharge">
                    <InputNumber style={{ width: '100%' }} min={0} placeholder="Optional" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Max Charge (₹)" name="maxCharge">
                    <InputNumber style={{ width: '100%' }} min={0} placeholder="Optional" />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const AdminMasters = () => {
  const tabs = [
    { key: 'loanTypes',      label: 'Loan Types',              children: <LoanTypes /> },
    { key: 'interestRates',  label: 'Interest Rate Config',     children: <InterestRates /> },
    { key: 'purposes',       label: 'Loan Purposes',            children: <LoanPurposes /> },
    { key: 'documents',      label: 'Document Types',           children: <DocumentTypes /> },
    { key: 'preClosureConfig', label: 'Pre-Closure Charges',    children: <PreClosureConfig /> },
  ]

  return (
    <>
      <PageHeader
        title="Master Data"
        subtitle="Loan products, interest rate slabs, processing fees and document configuration"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Masters' }]}
      />
      <Card size="small" style={{ borderRadius: 10 }}>
        <Tabs items={tabs} defaultActiveKey="loanTypes" />
      </Card>
    </>
  )
}

export default AdminMasters
