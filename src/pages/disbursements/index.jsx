import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Tag, Space, Row, Col, Select, Card, Statistic } from 'antd'
import {
  SearchOutlined, CheckCircleFilled, CloseCircleFilled, ClockCircleOutlined,
  DollarOutlined, RiseOutlined,
} from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { disbursementApi } from '../../api/disbursementApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

const STATUS_COLORS = {
  SUCCESS:   { color: '#389e0d', bg: '#f6ffed' },
  FAILED:    { color: '#cf1322', bg: '#fff1f0' },
  INITIATED: { color: '#d46b08', bg: '#fff7e6' },
}

const MODE_COLORS = {
  NEFT: '#096dd9',
  RTGS: '#531dab',
  IMPS: '#389e0d',
}

const StatusTag = ({ status }) => {
  const c = STATUS_COLORS[status] || { color: '#666', bg: '#f5f5f5' }
  const icon = status === 'SUCCESS'
    ? <CheckCircleFilled style={{ marginRight: 4 }} />
    : status === 'FAILED'
    ? <CloseCircleFilled style={{ marginRight: 4 }} />
    : <ClockCircleOutlined style={{ marginRight: 4 }} />
  return (
    <Tag style={{ color: c.color, background: c.bg, border: 'none', fontWeight: 600, fontSize: 11 }}>
      {icon}{status}
    </Tag>
  )
}

const Disbursements = () => {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [all, setAll] = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [modeFilter, setModeFilter] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await disbursementApi.getAll({ page: 0, size: 500 })
      const items = res.data?.data?.content || []
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setAll(items)
    } catch (err) {
      showError(err, 'Failed to load disbursements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Client-side filter + paginate
  useEffect(() => {
    const filtered = all.filter((d) => {
      const matchSearch = !search || (
        d.disbursementNumber?.toLowerCase().includes(search.toLowerCase()) ||
        d.loanNumber?.toLowerCase().includes(search.toLowerCase()) ||
        d.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        d.utrNumber?.toLowerCase().includes(search.toLowerCase())
      )
      const matchStatus = !statusFilter || d.status === statusFilter
      const matchMode   = !modeFilter   || d.disbursementMode === modeFilter
      return matchSearch && matchStatus && matchMode
    })

    const page = 0
    const size = pagination.size
    setData(filtered.slice(0, size))
    setPagination((p) => ({ ...p, page: 0, totalElements: filtered.length }))
  }, [all, search, statusFilter, modeFilter]) // eslint-disable-line

  const handlePageChange = (page, size) => {
    const filtered = all.filter((d) => {
      const matchSearch = !search || (
        d.disbursementNumber?.toLowerCase().includes(search.toLowerCase()) ||
        d.loanNumber?.toLowerCase().includes(search.toLowerCase()) ||
        d.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        d.utrNumber?.toLowerCase().includes(search.toLowerCase())
      )
      const matchStatus = !statusFilter || d.status === statusFilter
      const matchMode   = !modeFilter   || d.disbursementMode === modeFilter
      return matchSearch && matchStatus && matchMode
    })
    setData(filtered.slice(page * size, page * size + size))
    setPagination({ page, size, totalElements: filtered.length })
  }

  // Stats
  const total     = all.length
  const success   = all.filter((d) => d.status === 'SUCCESS').length
  const failed    = all.filter((d) => d.status === 'FAILED').length
  const totalAmt  = all.filter((d) => d.status === 'SUCCESS').reduce((s, d) => s + (d.netDisbursement || 0), 0)

  const columns = [
    {
      title: 'Disbursement No.',
      dataIndex: 'disbursementNumber',
      key: 'disbursementNumber',
      width: 180,
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#1B3A6B', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Loan No.',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      width: 150,
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
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
      title: 'Amount',
      key: 'amount',
      align: 'right',
      render: (_, row) => (
        <Space direction="vertical" size={0} style={{ alignItems: 'flex-end' }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>{formatCurrency(row.netDisbursement, 0)}</span>
          <span style={{ fontSize: 11, color: '#999' }}>Fee: {formatCurrency(row.processingFee, 0)}</span>
        </Space>
      ),
    },
    {
      title: 'Mode',
      dataIndex: 'disbursementMode',
      key: 'disbursementMode',
      render: (v) => v
        ? <Tag style={{ color: MODE_COLORS[v] || '#666', border: 'none', background: '#f5f5f5', fontWeight: 600, fontSize: 11 }}>{v}</Tag>
        : '—',
    },
    {
      title: 'UTR / Txn ID',
      key: 'utr',
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.utrNumber || '—'}</span>
          <span style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>{row.transactionId || ''}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <StatusTag status={v} />,
    },
    {
      title: 'Failure Reason',
      dataIndex: 'failureReason',
      key: 'failureReason',
      ellipsis: true,
      render: (v) => v ? <span style={{ color: '#cf1322', fontSize: 12 }}>{v}</span> : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Disbursed By',
      key: 'disbursedBy',
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 12 }}>{row.disbursedByName || '—'}</span>
          <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>{row.disbursedByEmployeeId}</span>
        </Space>
      ),
    },
    {
      title: 'Date',
      key: 'date',
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 12 }}>{formatDate(row.completedAt || row.initiatedAt)}</span>
          <span style={{ fontSize: 11, color: '#aaa' }}>{row.completedAt ? 'Completed' : 'Initiated'}</span>
        </Space>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Disbursements"
        subtitle="Track all loan disbursements — NEFT, RTGS, IMPS — with UTR and transaction details"
        breadcrumbs={[{ label: 'Disbursements' }]}
      />

      {/* Stats */}
      <Row gutter={12} style={{ marginBottom: 20 }}>
        {[
          { title: 'Total',            value: total,   icon: <DollarOutlined />,    color: '#1B3A6B' },
          { title: 'Successful',       value: success, icon: <CheckCircleFilled />, color: '#52c41a' },
          { title: 'Failed',           value: failed,  icon: <CloseCircleFilled />, color: '#f5222d' },
          { title: 'Total Disbursed',  value: formatCurrency(totalAmt, 0), icon: <RiseOutlined />, color: '#096dd9', isAmt: true },
        ].map((s) => (
          <Col xs={12} sm={6} key={s.title}>
            <Card size="small" style={{ borderRadius: 10, borderLeft: `3px solid ${s.color}` }}>
              <Statistic
                title={<span style={{ fontSize: 12 }}>{s.title}</span>}
                value={s.isAmt ? s.value : s.value}
                prefix={<span style={{ color: s.color, fontSize: 14 }}>{s.icon}</span>}
                valueStyle={{ fontSize: 20, fontWeight: 700, color: s.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Input
            placeholder="Search disbursement no., loan, customer, UTR..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            allowClear value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select placeholder="Status" allowClear style={{ width: '100%' }}
            value={statusFilter} onChange={(v) => setStatusFilter(v || null)}>
            <Select.Option value="SUCCESS">Success</Select.Option>
            <Select.Option value="FAILED">Failed</Select.Option>
            <Select.Option value="INITIATED">Initiated</Select.Option>
          </Select>
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select placeholder="Mode" allowClear style={{ width: '100%' }}
            value={modeFilter} onChange={(v) => setModeFilter(v || null)}>
            <Select.Option value="NEFT">NEFT</Select.Option>
            <Select.Option value="RTGS">RTGS</Select.Option>
            <Select.Option value="IMPS">IMPS</Select.Option>
          </Select>
        </Col>
      </Row>

      <DataTable
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onPageChange={handlePageChange}
        onRow={(row) => ({
          onClick: () => navigate('/los/applications/' + row.loanNumber + '?tab=disbursement'),
          style: { cursor: 'pointer' },
        })}
        scroll={{ x: 1300 }}
      />
    </>
  )
}

export default Disbursements
