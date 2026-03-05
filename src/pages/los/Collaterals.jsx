import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Tag, Space, Button, Row, Col, Select, Card } from 'antd'
import { SearchOutlined, SafetyOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { loanApi } from '../../api/loanApi'
import { collateralApi } from '../../api/collateralApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

const { Option } = Select

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

const LTV_COLOR = (ltv) => {
  if (!ltv) return '#888'
  if (ltv <= 60) return '#52c41a'
  if (ltv <= 75) return '#faad14'
  return '#f5222d'
}

// Statuses that typically have collateral
const COLLATERAL_STATUSES = ['APPROVED', 'DISBURSED', 'ACTIVE', 'OVERDUE', 'NPA', 'CLOSED']

const Collaterals = () => {
  const navigate = useNavigate()
  const [loans, setLoans] = useState([])
  const [collateralMap, setCollateralMap] = useState({}) // loanNumber -> collateral
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState(null)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async (page = 0, size = 10) => {
    setLoading(true)
    try {
      const results = await Promise.all(
        COLLATERAL_STATUSES.map((s) => loanApi.getAll({ page: 0, size: 200, status: s }))
      )
      const all = results.flatMap((r) => r.data?.data?.content || [])
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      const start = page * size
      const pageItems = all.slice(start, start + size)
      setLoans(pageItems)
      setPagination({ page, size, totalElements: all.length })

      // Fetch collateral for each loan
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

  useEffect(() => { fetchData(0, 10) }, []) // eslint-disable-line

  const allCollaterals = Object.values(collateralMap).filter(Boolean)
  const SUMMARY = [
    { label: 'Total Collaterals', value: allCollaterals.length,                                                          color: '#1890ff' },
    { label: 'Pledged',           value: allCollaterals.filter((c) => c.collateralStatus === 'PLEDGED').length,          color: '#096dd9' },
    { label: 'Total Value',       value: formatCurrency(allCollaterals.reduce((s, c) => s + (c.valuationAmount || 0), 0), 0), color: '#52c41a' },
  ]

  const filtered = loans.filter((loan) => {
    const c = collateralMap[loan.loanNumber]
    const matchSearch = !search || (
      loan.loanNumber?.toLowerCase().includes(search.toLowerCase()) ||
      loan.customerName?.toLowerCase().includes(search.toLowerCase())
    )
    const matchType = !typeFilter || c?.collateralType === typeFilter
    return matchSearch && matchType
  })

  const getCollateralDesc = (c) => {
    if (!c) return '—'
    if (c.collateralType === 'PROPERTY') return c.propertyType ? `${c.propertyType} — ${c.propertyAddress || ''}` : c.propertyAddress || '—'
    if (c.collateralType === 'VEHICLE')  return `${c.vehicleMake || ''} ${c.vehicleModel || ''} (${c.vehicleYear || ''})`.trim()
    if (c.collateralType === 'GOLD')     return `${c.goldWeightGrams || ''}g ${c.goldPurity || ''} — ${c.goldItemDescription || ''}`.trim()
    return '—'
  }

  const columns = [
    {
      title: 'Loan No.',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      width: 160,
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#1B3A6B', fontWeight: 600 }}>{v}</span>
      ),
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
        return <span style={{ fontSize: 12, color: '#555' }}>{getCollateralDesc(c)}</span>
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
        const ltv = c?.ltvPercentage
        return ltv
          ? <span style={{ fontWeight: 700, color: LTV_COLOR(ltv) }}>{ltv.toFixed(1)}%</span>
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
  ]

  return (
    <>
      <PageHeader
        title="Collaterals"
        subtitle="Pledged assets — property, vehicle, gold — LTV and valuation overview"
        breadcrumbs={[{ label: 'LOS' }, { label: 'Collaterals' }]}
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {SUMMARY.map((s) => (
          <Col key={s.label} xs={8} md={4}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }} bodyStyle={{ padding: '10px 4px' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Input
            placeholder="Search loan no. or customer..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            allowClear value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select placeholder="Collateral Type" allowClear style={{ width: '100%' }}
            value={typeFilter} onChange={setTypeFilter}>
            {['PROPERTY', 'VEHICLE', 'GOLD'].map((t) => (
              <Option key={t} value={t}>{t}</Option>
            ))}
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
          onClick: () => navigate('/los/applications/' + row.loanNumber),
          style: { cursor: 'pointer' },
        })}
        scroll={{ x: 1200 }}
      />
    </>
  )
}

export default Collaterals
