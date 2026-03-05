import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Select, Tag, Space, Row, Col, Card } from 'antd'
import { SearchOutlined, WarningFilled } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { loanApi } from '../../api/loanApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { loanStatusColors } from '../../theme/colors'
import { showError } from '../../utils/errorHandler'

const { Option } = Select

const PORTFOLIO_STATUSES = ['ACTIVE', 'OVERDUE', 'NPA']

const DPD_BUCKET = (dpd) => {
  if (!dpd || dpd === 0) return { label: 'Current', color: '#52c41a', bg: '#f6ffed' }
  if (dpd <= 30)          return { label: 'SMA-0',   color: '#faad14', bg: '#fffbe6' }
  if (dpd <= 60)          return { label: 'SMA-1',   color: '#fa8c16', bg: '#fff7e6' }
  if (dpd <= 90)          return { label: 'SMA-2',   color: '#f5222d', bg: '#fff1f0' }
  return                         { label: 'NPA',     color: '#820014', bg: '#fff1f0' }
}

const LoanStatusTag = ({ status }) => {
  const s = loanStatusColors[status] || loanStatusColors.INITIATED
  return (
    <Tag style={{ color: s.color, background: s.bg, border: '1px solid ' + s.border, fontSize: 11 }}>
      {status?.replace(/_/g, ' ')}
    </Tag>
  )
}

const DPDTag = ({ dpd }) => {
  const b = DPD_BUCKET(dpd)
  return (
    <Tag style={{ color: b.color, background: b.bg, border: 'none', fontWeight: 600, fontSize: 11 }}>
      {dpd ?? 0}d — {b.label}
    </Tag>
  )
}

const ActiveLoans = () => {
  const navigate = useNavigate()
  const [loans, setLoans] = useState([])
  const [allLoans, setAllLoans] = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [search, setSearch] = useState('')

  // Portfolio summary counts
  useEffect(() => {
    Promise.all(
      PORTFOLIO_STATUSES.map((s) => loanApi.getAll({ page: 0, size: 500, status: s }))
    )
      .then((results) => {
        const combined = results.flatMap((r) => r.data?.data?.content || [])
        setAllLoans(combined)
      })
      .catch(() => {})
  }, [])

  const fetchLoans = useCallback(async (page = 0, size = 10) => {
    setLoading(true)
    try {
      const status = statusFilter || undefined
      const params = { page, size, ...(status ? { status } : {}) }
      // If no status filter, fetch all portfolio statuses
      if (!status) {
        // Fetch ACTIVE + OVERDUE + NPA together via multiple calls and merge
        const [active, overdue, npa] = await Promise.all(
          PORTFOLIO_STATUSES.map((s) => loanApi.getAll({ page: 0, size: 500, status: s }))
        )
        const combined = [
          ...(active.data?.data?.content || []),
          ...(overdue.data?.data?.content || []),
          ...(npa.data?.data?.content || []),
        ]
        combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        const start = page * size
        setLoans(combined.slice(start, start + size))
        setPagination({ page, size, totalElements: combined.length })
      } else {
        const res = await loanApi.getAll(params)
        const data = res.data?.data
        setLoans(data?.content || [])
        setPagination({ page: data?.page ?? 0, size: data?.size ?? size, totalElements: data?.totalElements ?? 0 })
      }
    } catch (err) {
      showError(err, 'Failed to load portfolio loans')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchLoans(0, 10)
  }, [statusFilter]) // eslint-disable-line

  const portfolioStats = {
    active:        allLoans.filter((l) => l.loanStatusCode === 'ACTIVE').length,
    overdue:       allLoans.filter((l) => l.loanStatusCode === 'OVERDUE').length,
    npa:           allLoans.filter((l) => l.loanStatusCode === 'NPA').length,
    totalAum:      allLoans.reduce((s, l) => s + (l.outstandingAmount || 0), 0),
    totalOverdue:  allLoans.filter((l) => l.loanStatusCode !== 'ACTIVE').reduce((s, l) => s + (l.totalOverdueAmount || 0), 0),
  }
  const par = portfolioStats.totalAum > 0
    ? ((portfolioStats.totalOverdue / portfolioStats.totalAum) * 100).toFixed(2)
    : '0.00'

  const SUMMARY_CARDS = [
    { label: 'Active',       value: portfolioStats.active,  color: '#52c41a', filter: 'ACTIVE' },
    { label: 'Overdue',      value: portfolioStats.overdue, color: '#fa8c16', filter: 'OVERDUE' },
    { label: 'NPA',          value: portfolioStats.npa,     color: '#f5222d', filter: 'NPA' },
    { label: 'Total AUM',    value: formatCurrency(portfolioStats.totalAum, 0), color: '#1890ff', filter: null },
    { label: 'Overdue Amt',  value: formatCurrency(portfolioStats.totalOverdue, 0), color: '#fa8c16', filter: null },
    { label: 'PAR %',        value: par + '%', color: portfolioStats.totalOverdue > 0 ? '#f5222d' : '#52c41a', filter: null },
  ]

  const filtered = search
    ? loans.filter((l) =>
        l.loanNumber?.toLowerCase().includes(search.toLowerCase()) ||
        l.customerName?.toLowerCase().includes(search.toLowerCase())
      )
    : loans

  const columns = [
    {
      title: 'Loan No.',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      width: 155,
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
      title: 'Loan Type',
      dataIndex: 'loanTypeName',
      key: 'loanTypeName',
      render: (v) => v || '—',
    },
    {
      title: 'Outstanding',
      dataIndex: 'outstandingAmount',
      key: 'outstandingAmount',
      align: 'right',
      render: (v) => (
        <span style={{ fontWeight: 600 }}>{formatCurrency(v, 0)}</span>
      ),
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
      render: (v, row) => (
        <Space>
          <DPDTag dpd={v} />
          {row.loanStatusCode === 'NPA' && (
            <Tooltip title="NPA — Non Performing Asset">
              <WarningFilled style={{ color: '#820014' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Overdue Amt',
      dataIndex: 'totalOverdueAmount',
      key: 'totalOverdueAmount',
      align: 'right',
      render: (v) => v ? <span style={{ color: '#f5222d' }}>{formatCurrency(v, 0)}</span> : <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: 'Overdue EMIs',
      dataIndex: 'numberOfOverdueEmis',
      key: 'numberOfOverdueEmis',
      align: 'center',
      render: (v) => v ? <Tag color="red">{v}</Tag> : <span style={{ color: '#999' }}>0</span>,
    },
    {
      title: 'Next Due',
      dataIndex: 'nextDueDate',
      key: 'nextDueDate',
      render: (v) => formatDate(v) || '—',
    },
    {
      title: 'Status',
      dataIndex: 'loanStatusCode',
      key: 'loanStatusCode',
      render: (v) => <LoanStatusTag status={v} />,
    },
  ]

  return (
    <>
      <PageHeader
        title="Active Loan Portfolio"
        subtitle="ACTIVE · OVERDUE · NPA accounts with DPD and outstanding tracking"
        breadcrumbs={[{ label: 'LMS' }, { label: 'Active Loans' }]}
      />

      {/* Summary cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {SUMMARY_CARDS.map((c) => (
          <Col key={c.label} xs={12} sm={8} md={4}>
            <Card
              size="small"
              hoverable={!!c.filter}
              onClick={() => c.filter && setStatusFilter(statusFilter === c.filter ? null : c.filter)}
              style={{
                borderRadius: 8, textAlign: 'center',
                cursor: c.filter ? 'pointer' : 'default',
                border: c.filter && statusFilter === c.filter ? `2px solid ${c.color}` : '1px solid #f0f0f0',
              }}
              bodyStyle={{ padding: '10px 4px' }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{c.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Input
            placeholder="Search loan no. or customer..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            allowClear value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Select placeholder="Status" allowClear style={{ width: '100%' }}
            value={statusFilter} onChange={setStatusFilter}>
            {PORTFOLIO_STATUSES.map((s) => (
              <Option key={s} value={s}>{s}</Option>
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
        onPageChange={(page, size) => fetchLoans(page, size)}
        onRow={(row) => ({
          onClick: () => navigate('/los/applications/' + row.loanNumber),
          style: { cursor: 'pointer' },
        })}
        scroll={{ x: 1200 }}
      />
    </>
  )
}

export default ActiveLoans
