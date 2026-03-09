import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Tabs, Select, Space, Row, Col, Statistic } from 'antd'
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
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

// ─── Main Page ───────────────────────────────────────────────────────────────
const AdminMasters = () => {
  const tabs = [
    { key: 'loanTypes',    label: 'Loan Types',          children: <LoanTypes /> },
    { key: 'interestRates', label: 'Interest Rate Config', children: <InterestRates /> },
    { key: 'purposes',     label: 'Loan Purposes',        children: <LoanPurposes /> },
    { key: 'documents',    label: 'Document Types',       children: <DocumentTypes /> },
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
