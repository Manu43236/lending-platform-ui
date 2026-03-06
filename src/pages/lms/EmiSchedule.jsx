import { useState, useEffect, useCallback } from 'react'
import { Input, Tag, Space, Card, Row, Col, Select, DatePicker, Button } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { emiScheduleApi } from '../../api/emiScheduleApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

const { RangePicker } = DatePicker

const STATUS_COLORS = {
  PAID:    { color: '#389e0d', bg: '#f6ffed' },
  PENDING: { color: '#d46b08', bg: '#fffbe6' },
  OVERDUE: { color: '#cf1322', bg: '#fff1f0' },
}

const EmiStatusTag = ({ status }) => {
  const c = STATUS_COLORS[status] || { color: '#666', bg: '#f5f5f5' }
  return (
    <Tag style={{ color: c.color, background: c.bg, border: 'none', fontWeight: 600, fontSize: 11 }}>
      {status}
    </Tag>
  )
}

// DPD bucket → dpdMin/dpdMax params
const DPD_BUCKETS = [
  { label: 'Current (0)',    value: 'current', dpdMin: null, dpdMax: 0  },
  { label: 'SMA-0 (1–30)',  value: 'sma0',    dpdMin: 1,    dpdMax: 30 },
  { label: 'SMA-1 (31–60)', value: 'sma1',    dpdMin: 31,   dpdMax: 60 },
  { label: 'SMA-2 (61–90)', value: 'sma2',    dpdMin: 61,   dpdMax: 90 },
  { label: 'NPA (90+)',     value: 'npa',     dpdMin: 91,   dpdMax: null },
]

const today = dayjs()

// Default: show today's EMIs across all loans
const DEFAULT_FILTERS = {
  status:     null,
  dateRange:  [today, today],
  dpdBucket:  null,
  loanNumber: '',
}

const EmiSchedule = () => {
  const [data, setData]           = useState([])
  const [loading, setLoading]     = useState(false)
  const [pagination, setPagination] = useState({ page: 0, size: 50, totalElements: 0 })
  const [filters, setFilters]     = useState(DEFAULT_FILTERS)

  // Build API params from filters
  const buildParams = useCallback((page, size, f) => {
    const bucket = f.dpdBucket ? DPD_BUCKETS.find((b) => b.value === f.dpdBucket) : null
    return {
      page,
      size,
      status:      f.status || undefined,
      dueDateFrom: f.dateRange?.[0]?.format('YYYY-MM-DD') || undefined,
      dueDateTo:   f.dateRange?.[1]?.format('YYYY-MM-DD') || undefined,
      dpdMin:      bucket?.dpdMin ?? undefined,
      dpdMax:      bucket?.dpdMax ?? undefined,
      loanNumber:  f.loanNumber?.trim() || undefined,
    }
  }, [])

  const fetchData = useCallback(async (page = 0, size = 50, f = filters) => {
    setLoading(true)
    try {
      const params = buildParams(page, size, f)
      const res = await emiScheduleApi.getAll(params)
      const paged = res.data?.data
      setData(paged?.content || [])
      setPagination({ page, size, totalElements: paged?.totalElements || 0 })
    } catch (err) {
      showError(err, 'Failed to load EMI schedules')
    } finally {
      setLoading(false)
    }
  }, [filters, buildParams])

  // On mount — load today's EMIs by default
  useEffect(() => { fetchData(0, 50, DEFAULT_FILTERS) }, []) // eslint-disable-line

  const handleFilter = (key, value) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    fetchData(0, 50, next)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    fetchData(0, 50, DEFAULT_FILTERS)
  }

  // Summary counts from current page data
  const overdue = data.filter((e) => e.status === 'OVERDUE').length
  const pending = data.filter((e) => e.status === 'PENDING').length
  const paid    = data.filter((e) => e.status === 'PAID').length
  const totalDue = data
    .filter((e) => e.status !== 'PAID')
    .reduce((s, e) => s + (e.emiAmount || 0), 0)

  const STAT_CARDS = [
    { label: 'Overdue',    value: overdue,                    color: '#cf1322', bg: '#fff1f0' },
    { label: 'Due Today',  value: pending,                    color: '#d46b08', bg: '#fffbe6' },
    { label: 'Paid',       value: paid,                       color: '#389e0d', bg: '#f6ffed' },
    { label: 'Total Due',  value: formatCurrency(totalDue, 0), color: '#722ed1', bg: '#f9f0ff' },
  ]

  const columns = [
    {
      title: 'Loan No.',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      width: 160,
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#1B3A6B', fontWeight: 600 }}>{v}</span>
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
      title: '#',
      dataIndex: 'emiNumber',
      key: 'emiNumber',
      width: 50,
      align: 'center',
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (v) => {
        const isOverdue = dayjs(v).isBefore(today, 'day')
        return (
          <span style={{ color: isOverdue ? '#cf1322' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
            {formatDate(v)}
          </span>
        )
      },
    },
    {
      title: 'EMI Amount',
      dataIndex: 'emiAmount',
      key: 'emiAmount',
      align: 'right',
      render: (v) => <span style={{ fontWeight: 700 }}>{formatCurrency(v, 0)}</span>,
    },
    {
      title: 'Outstanding',
      dataIndex: 'outstandingPrincipal',
      key: 'outstandingPrincipal',
      align: 'right',
      render: (v) => formatCurrency(v, 0),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <EmiStatusTag status={v} />,
    },
    {
      title: 'Paid Amount',
      dataIndex: 'amountPaid',
      key: 'amountPaid',
      align: 'right',
      render: (v) => v ? formatCurrency(v, 0) : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'DPD',
      dataIndex: 'daysPastDue',
      key: 'daysPastDue',
      align: 'center',
      width: 70,
      render: (v) => {
        if (!v) return <span style={{ color: '#bbb' }}>0</span>
        const color = v > 90 ? '#820014' : v > 60 ? '#f5222d' : v > 30 ? '#fa8c16' : '#faad14'
        return <span style={{ color, fontWeight: 600 }}>{v}d</span>
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="EMI Schedule"
        subtitle="Today's EMI dues across all loans — change the date range to view past or future schedules"
        breadcrumbs={[{ label: 'LMS' }, { label: 'EMI Schedule' }]}
      />

      {/* Summary cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {STAT_CARDS.map((c) => (
          <Col key={c.label} xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8, background: c.bg, border: 'none', textAlign: 'center' }}
              bodyStyle={{ padding: '10px 4px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{c.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Card size="small" style={{ borderRadius: 10, marginBottom: 16 }}>
        <Row gutter={[12, 8]} align="middle">
          <Col xs={24} sm={12} md={5}>
            <Input
              placeholder="Loan number..."
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              allowClear
              value={filters.loanNumber}
              onChange={(e) => handleFilter('loanNumber', e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(v) => handleFilter('status', v)}
            >
              <Select.Option value="PENDING">PENDING</Select.Option>
              <Select.Option value="OVERDUE">OVERDUE</Select.Option>
              <Select.Option value="PAID">PAID</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="DPD Bucket"
              allowClear
              style={{ width: '100%' }}
              value={filters.dpdBucket}
              onChange={(v) => handleFilter('dpdBucket', v)}
            >
              {DPD_BUCKETS.map((b) => (
                <Select.Option key={b.value} value={b.value}>{b.label}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={7}>
            <RangePicker
              style={{ width: '100%' }}
              format="DD MMM YYYY"
              value={filters.dateRange}
              onChange={(v) => handleFilter('dateRange', v)}
              placeholder={['Due from', 'Due to']}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button icon={<ReloadOutlined />} onClick={handleReset} style={{ width: '100%' }}>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      <DataTable
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onPageChange={(page, size) => fetchData(page, size)}
        rowClassName={(r) => r.status === 'OVERDUE' ? 'row-overdue' : ''}
        scroll={{ x: 1000 }}
        locale={{ emptyText: 'No EMIs match the selected filters' }}
      />
    </>
  )
}

export default EmiSchedule
