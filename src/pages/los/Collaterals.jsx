import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Tag, Space, Button, Row, Col, Select, Modal, Form, InputNumber, DatePicker } from 'antd'
import { SearchOutlined, PlusOutlined, UnlockOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { loanApi } from '../../api/loanApi'
import { collateralApi } from '../../api/collateralApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError, showSuccess } from '../../utils/errorHandler'

const TYPE_COLORS = {
  PROPERTY: { color: '#096dd9', bg: '#e6f4ff' },
  VEHICLE:  { color: '#389e0d', bg: '#f6ffed' },
  GOLD:     { color: '#d46b08', bg: '#fff7e6' },
}

const STATUS_COLORS = {
  PLEDGED:   { color: '#096dd9', bg: '#e6f4ff' },
  RELEASED:  { color: '#52c41a', bg: '#f6ffed' },
  DEFAULTED: { color: '#f5222d', bg: '#fff1f0' },
}

const CollateralTag = ({ type }) => {
  const c = TYPE_COLORS[type] || { color: '#666', bg: '#f5f5f5' }
  return (
    <Tag style={{ color: c.color, background: c.bg, border: 'none', fontWeight: 600, fontSize: 11 }}>
      {type || '—'}
    </Tag>
  )
}

const StatusTag = ({ status }) => {
  const c = STATUS_COLORS[status] || { color: '#666', bg: '#f5f5f5' }
  return (
    <Tag style={{ color: c.color, background: c.bg, border: 'none', fontWeight: 600, fontSize: 11 }}>
      {status || '—'}
    </Tag>
  )
}

const ltvColor = (ltv) => {
  if (!ltv) return '#888'
  if (ltv <= 60) return '#52c41a'
  if (ltv <= 75) return '#faad14'
  return '#f5222d'
}

const getDesc = (c) => {
  if (!c) return '—'
  if (c.collateralType === 'PROPERTY') return [c.propertyType, c.propertyAddress].filter(Boolean).join(' — ') || '—'
  if (c.collateralType === 'VEHICLE')  return `${c.vehicleMake || ''} ${c.vehicleModel || ''} ${c.vehicleYear ? '(' + c.vehicleYear + ')' : ''}`.trim() || '—'
  if (c.collateralType === 'GOLD')     return `${c.goldWeightGrams || ''}g ${c.goldPurity || ''} ${c.goldItemDescription || ''}`.trim() || '—'
  return '—'
}

const Collaterals = () => {
  const navigate = useNavigate()
  const [loans, setLoans]               = useState([])
  const [collateralMap, setCollateralMap] = useState({})
  const [pagination, setPagination]     = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading]           = useState(false)
  const [typeFilter, setTypeFilter]     = useState(null)
  const [search, setSearch]             = useState('')

  // Register modal
  const [registerOpen, setRegisterOpen] = useState(false)
  const [registering, setRegistering]   = useState(false)
  const [registerForm]                  = Form.useForm()
  const [collateralType, setCollateralType] = useState(null)
  const [allLoans, setAllLoans]         = useState([])

  // Release modal
  const [releaseLoan, setReleaseLoan]   = useState(null)
  const [releasing, setReleasing]       = useState(false)

  const fetchData = useCallback(async (page = 0, size = 10) => {
    setLoading(true)
    try {
      const res = await loanApi.getAll({ page: 0, size: 500 })
      const all = (res.data?.data?.content || [])
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      const start = page * size
      const pageItems = all.slice(start, start + size)
      setLoans(pageItems)
      setPagination({ page, size, totalElements: all.length })

      const map = {}
      await Promise.allSettled(
        pageItems.map(async (loan) => {
          try {
            const r = await collateralApi.getByLoan(loan.loanNumber)
            map[loan.loanNumber] = r.data?.data
          } catch {
            map[loan.loanNumber] = null
          }
        })
      )
      setCollateralMap(map)
    } catch (err) {
      showError(err, 'Failed to load collaterals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(0, 10) }, [fetchData])

  // Load all loans for register modal dropdown
  useEffect(() => {
    loanApi.getAll({ page: 0, size: 500 })
      .then((r) => setAllLoans(r.data?.data?.content || []))
      .catch(() => {})
  }, [])

  const handleRegister = async (values) => {
    setRegistering(true)
    try {
      const payload = {
        loanNumber:              values.loanNumber,
        collateralType:          values.collateralType,
        valuationAmount:         values.valuationAmount,
        valuationDate:           values.valuationDate?.format('YYYY-MM-DD'),
        valuatorName:            values.valuatorName,
        valuatorCertificateNumber: values.valuatorCertificateNumber,
        remarks:                 values.remarks,
        // Property
        propertyAddress:         values.propertyAddress,
        propertyType:            values.propertyType,
        propertyAreaSqft:        values.propertyAreaSqft,
        propertyValue:           values.propertyValue,
        // Vehicle
        vehicleRegistrationNumber: values.vehicleRegistrationNumber,
        vehicleMake:             values.vehicleMake,
        vehicleModel:            values.vehicleModel,
        vehicleYear:             values.vehicleYear,
        vehicleValue:            values.vehicleValue,
        // Gold
        goldWeightGrams:         values.goldWeightGrams,
        goldPurity:              values.goldPurity,
        goldItemDescription:     values.goldItemDescription,
        goldValue:               values.goldValue,
      }
      await collateralApi.register(payload)
      showSuccess('Collateral registered successfully.')
      setRegisterOpen(false)
      registerForm.resetFields()
      setCollateralType(null)
      fetchData(pagination.page, pagination.size)
    } catch (err) {
      showError(err, 'Failed to register collateral')
    } finally {
      setRegistering(false)
    }
  }

  const handleRelease = async () => {
    setReleasing(true)
    try {
      await collateralApi.release(releaseLoan.loanNumber)
      showSuccess('Collateral released successfully.')
      setReleaseLoan(null)
      fetchData(pagination.page, pagination.size)
    } catch (err) {
      showError(err, 'Failed to release collateral')
    } finally {
      setReleasing(false)
    }
  }

  const filtered = loans.filter((loan) => {
    const c = collateralMap[loan.loanNumber]
    const matchSearch = !search || (
      loan.loanNumber?.toLowerCase().includes(search.toLowerCase()) ||
      loan.customerName?.toLowerCase().includes(search.toLowerCase())
    )
    const matchType = !typeFilter || c?.collateralType === typeFilter
    return matchSearch && matchType
  })

  const columns = [
    {
      title: 'Loan No.',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      width: 160,
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#1B3A6B', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{row.customerName}</span>
          <span style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>{row.customerNumber}</span>
        </Space>
      ),
    },
    {
      title: 'Collateral No.',
      key: 'collateralNo',
      render: (_, row) => {
        const c = collateralMap[row.loanNumber]
        return c
          ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.collateralNumber}</span>
          : <span style={{ color: '#bbb' }}>—</span>
      },
    },
    {
      title: 'Type',
      key: 'type',
      render: (_, row) => {
        const c = collateralMap[row.loanNumber]
        return c ? <CollateralTag type={c.collateralType} /> : <span style={{ color: '#bbb' }}>None</span>
      },
    },
    {
      title: 'Description',
      key: 'desc',
      ellipsis: true,
      render: (_, row) => {
        const c = collateralMap[row.loanNumber]
        return <span style={{ fontSize: 12, color: '#555' }}>{getDesc(c)}</span>
      },
    },
    {
      title: 'Valuation',
      key: 'valuation',
      align: 'right',
      render: (_, row) => {
        const c = collateralMap[row.loanNumber]
        return c?.valuationAmount
          ? <span style={{ fontWeight: 600 }}>{formatCurrency(c.valuationAmount, 0)}</span>
          : <span style={{ color: '#bbb' }}>—</span>
      },
    },
    {
      title: 'LTV %',
      key: 'ltv',
      align: 'center',
      render: (_, row) => {
        const c = collateralMap[row.loanNumber]
        return c?.ltvPercentage
          ? <span style={{ fontWeight: 700, color: ltvColor(c.ltvPercentage) }}>{c.ltvPercentage.toFixed(1)}%</span>
          : <span style={{ color: '#bbb' }}>—</span>
      },
    },
    {
      title: 'Status',
      key: 'colStatus',
      render: (_, row) => {
        const c = collateralMap[row.loanNumber]
        return c ? <StatusTag status={c.collateralStatus} /> : <span style={{ color: '#bbb' }}>—</span>
      },
    },
    {
      title: 'Pledge Date',
      key: 'pledgeDate',
      render: (_, row) => {
        const c = collateralMap[row.loanNumber]
        return c?.pledgeDate ? formatDate(c.pledgeDate) : <span style={{ color: '#bbb' }}>—</span>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, row) => {
        const c = collateralMap[row.loanNumber]
        // Register only allowed after approval — pre-disbursement step
        if (!c && row.loanStatusCode === 'APPROVED') {
          return (
            <Button type="link" size="small" icon={<PlusOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                registerForm.setFieldValue('loanNumber', row.loanNumber)
                setRegisterOpen(true)
              }}>
              Register
            </Button>
          )
        }
        // Release only allowed after loan is closed
        if (c?.collateralStatus === 'PLEDGED' && row.loanStatusCode === 'CLOSED') {
          return (
            <Button type="link" size="small" icon={<UnlockOutlined />}
              onClick={(e) => { e.stopPropagation(); setReleaseLoan(row) }}>
              Release
            </Button>
          )
        }
        return null
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Collaterals"
        subtitle="Pledged assets — property, vehicle, gold — LTV and valuation overview"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setRegisterOpen(true)}>
            Register Collateral
          </Button>
        }
      />

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Input
            placeholder="Search loan no. or customer..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            allowClear value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={8} md={5}>
          <Select placeholder="Filter by type" allowClear style={{ width: '100%' }}
            value={typeFilter} onChange={(v) => setTypeFilter(v || null)}>
            <Select.Option value="PROPERTY">Property</Select.Option>
            <Select.Option value="VEHICLE">Vehicle</Select.Option>
            <Select.Option value="GOLD">Gold</Select.Option>
          </Select>
        </Col>
      </Row>

      <DataTable
        columns={columns}
        dataSource={filtered}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onPageChange={(page, size) => fetchData(page, size)}
        onRow={(row) => ({
          onClick: () => navigate('/los/applications/' + row.loanNumber + '?tab=collateral'),
          style: { cursor: 'pointer' },
        })}
        scroll={{ x: 1100 }}
      />

      {/* Register Collateral Modal */}
      <Modal
        title="Register Collateral"
        open={registerOpen}
        onCancel={() => { setRegisterOpen(false); registerForm.resetFields(); setCollateralType(null) }}
        onOk={() => registerForm.submit()}
        okText="Register"
        confirmLoading={registering}
        width={580}
      >
        <Form form={registerForm} layout="vertical" onFinish={handleRegister} style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Loan" name="loanNumber" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select loan"
                  filterOption={(input, option) => option?.label?.toLowerCase().includes(input.toLowerCase())}>
                  {allLoans
                    .filter((l) => l.loanStatusCode === 'APPROVED' && !collateralMap[l.loanNumber])
                    .map((l) => (
                    <Select.Option key={l.loanNumber} value={l.loanNumber} label={`${l.loanNumber} ${l.customerName}`}>
                      <Space direction="vertical" size={0}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.loanNumber}</span>
                        <span style={{ fontSize: 11, color: '#999' }}>{l.customerName}</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Collateral Type" name="collateralType" rules={[{ required: true }]}>
                <Select placeholder="Select type" onChange={(v) => { setCollateralType(v); registerForm.resetFields(['propertyAddress','propertyType','propertyAreaSqft','propertyValue','vehicleRegistrationNumber','vehicleMake','vehicleModel','vehicleYear','vehicleValue','goldWeightGrams','goldPurity','goldItemDescription','goldValue']) }}>
                  <Select.Option value="PROPERTY">Property</Select.Option>
                  <Select.Option value="VEHICLE">Vehicle</Select.Option>
                  <Select.Option value="GOLD">Gold</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Property Fields */}
          {collateralType === 'PROPERTY' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Property Type" name="propertyType">
                  <Select placeholder="Residential / Commercial">
                    <Select.Option value="RESIDENTIAL">Residential</Select.Option>
                    <Select.Option value="COMMERCIAL">Commercial</Select.Option>
                    <Select.Option value="PLOT">Plot</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Area (sqft)" name="propertyAreaSqft">
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Property Address" name="propertyAddress" rules={[{ required: true }]}>
                  <Input.TextArea rows={2} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Property Value" name="propertyValue">
                  <InputNumber style={{ width: '100%' }} min={0} formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Vehicle Fields */}
          {collateralType === 'VEHICLE' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Registration No." name="vehicleRegistrationNumber" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Year" name="vehicleYear">
                  <InputNumber style={{ width: '100%' }} min={1980} max={new Date().getFullYear()} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Make" name="vehicleMake">
                  <Input placeholder="e.g. Maruti, Honda" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Model" name="vehicleModel">
                  <Input placeholder="e.g. Swift, City" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Vehicle Value" name="vehicleValue">
                  <InputNumber style={{ width: '100%' }} min={0} formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Gold Fields */}
          {collateralType === 'GOLD' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Weight (grams)" name="goldWeightGrams" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Purity" name="goldPurity">
                  <Select placeholder="Select purity">
                    <Select.Option value="24K">24K</Select.Option>
                    <Select.Option value="22K">22K</Select.Option>
                    <Select.Option value="18K">18K</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Item Description" name="goldItemDescription">
                  <Input placeholder="e.g. Gold necklace, bangles" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Gold Value" name="goldValue">
                  <InputNumber style={{ width: '100%' }} min={0} formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Common Valuation Fields */}
          {collateralType && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Valuation Amount" name="valuationAmount" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={0} formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Valuation Date" name="valuationDate">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Valuator Name" name="valuatorName">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Certificate No." name="valuatorCertificateNumber">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Remarks" name="remarks">
                  <Input.TextArea rows={2} />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>

      {/* Release Collateral Confirmation */}
      <Modal
        title="Release Collateral"
        open={!!releaseLoan}
        onCancel={() => setReleaseLoan(null)}
        onOk={handleRelease}
        okText="Release"
        okButtonProps={{ danger: true }}
        confirmLoading={releasing}
      >
        <p>Are you sure you want to release the collateral for loan <strong>{releaseLoan?.loanNumber}</strong>?</p>
        <p style={{ color: '#888', fontSize: 13 }}>This action cannot be undone.</p>
      </Modal>
    </>
  )
}

export default Collaterals
