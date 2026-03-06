import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Tag, Space, Row, Col, Card, Alert } from 'antd'
import { SearchOutlined, AlertFilled } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { loanApi } from '../../api/loanApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

const NPA = () => {
  const navigate = useNavigate()
  const [all, setAll]               = useState([])
  const [data, setData]             = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await loanApi.getAll({ page: 0, size: 500, status: 'NPA' })
      const items = (res.data?.data?.content || [])
      items.sort((a, b) => (b.currentDpd ?? 0) - (a.currentDpd ?? 0))
      setAll(items)
      setData(items.slice(0, 10))
      setPagination({ page: 0, size: 10, totalElements: items.length })
    } catch (err) {
      showError(err, 'Failed to load NPA accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    const filtered = !search
      ? all
      : all.filter((l) =>
          l.loanNumber?.toLowerCase().includes(search.toLowerCase()) ||
          l.customerName?.toLowerCase().includes(search.toLowerCase())
        )
    setData(filtered.slice(0, pagination.size))
    setPagination((p) => ({ ...p, page: 0, totalElements: filtered.length }))
  }, [search, all]) // eslint-disable-line

  const handlePageChange = (page, size) => {
    const filtered = !search
      ? all
      : all.filter((l) =>
          l.loanNumber?.toLowerCase().includes(search.toLowerCase()) ||
          l.customerName?.toLowerCase().includes(search.toLowerCase())
        )
    setData(filtered.slice(page * size, page * size + size))
    setPagination({ page, size, totalElements: filtered.length })
  }

  const totalOutstanding = all.reduce((s, l) => s + (l.outstandingAmount || 0), 0)
  const totalOverdue     = all.reduce((s, l) => s + (l.totalOverdueAmount || 0), 0)
  const totalPenalty     = all.reduce((s, l) => s + (l.totalPenaltyAmount || 0), 0)
  const avgDpd           = all.length ? Math.round(all.reduce((s, l) => s + (l.currentDpd || 0), 0) / all.length) : 0

  const columns = [
    {
      title: 'Loan No.',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      width: 155,
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#820014', fontWeight: 700 }}>{v}</span>,
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
      title: 'DPD',
      dataIndex: 'currentDpd',
      key: 'currentDpd',
      align: 'center',
      render: (v) => (
        <Tag style={{ color: '#820014', background: '#fff1f0', border: 'none', fontWeight: 700, fontSize: 11 }}>
          {v ?? 0}d
        </Tag>
      ),
    },
    {
      title: 'Highest DPD',
      dataIndex: 'highestDpd',
      key: 'highestDpd',
      align: 'center',
      render: (v) => v
        ? <span style={{ color: '#820014', fontWeight: 700 }}>{v}d</span>
        : '—',
    },
    {
      title: 'Overdue EMIs',
      dataIndex: 'numberOfOverdueEmis',
      key: 'numberOfOverdueEmis',
      align: 'center',
      render: (v) => <Tag color="error">{v ?? 0}</Tag>,
    },
    {
      title: 'Overdue Amount',
      dataIndex: 'totalOverdueAmount',
      key: 'totalOverdueAmount',
      align: 'right',
      render: (v) => <span style={{ fontWeight: 600, color: '#820014' }}>{formatCurrency(v, 0)}</span>,
    },
    {
      title: 'Outstanding',
      dataIndex: 'outstandingAmount',
      key: 'outstandingAmount',
      align: 'right',
      render: (v) => <span style={{ fontWeight: 600 }}>{formatCurrency(v, 0)}</span>,
    },
    {
      title: 'Penalty',
      dataIndex: 'totalPenaltyAmount',
      key: 'totalPenaltyAmount',
      align: 'right',
      render: (v) => v > 0
        ? <span style={{ color: '#cf1322' }}>{formatCurrency(v, 0)}</span>
        : <span style={{ color: '#888' }}>—</span>,
    },
    {
      title: 'EMI / Month',
      dataIndex: 'emiAmount',
      key: 'emiAmount',
      align: 'right',
      render: (v) => formatCurrency(v, 0),
    },
  ]

  return (
    <>
      <PageHeader
        title="NPA Accounts"
        subtitle="Non-Performing Assets — loans overdue 90+ days (RBI classification)"
        breadcrumbs={[{ label: 'Collections' }, { label: 'NPA Accounts' }]}
      />

      {all.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<AlertFilled />}
          message={`${all.length} NPA account(s) detected — immediate recovery action required`}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          { label: 'NPA Accounts',      value: all.length,                        color: '#820014' },
          { label: 'Total Overdue',     value: formatCurrency(totalOverdue, 0),   color: '#cf1322' },
          { label: 'Total Outstanding', value: formatCurrency(totalOutstanding, 0), color: '#1B3A6B' },
          { label: 'Total Penalty',     value: formatCurrency(totalPenalty, 0),   color: '#fa8c16' },
          { label: 'Avg DPD',           value: avgDpd + ' days',                  color: '#f5222d' },
        ].map((s) => (
          <Col xs={12} sm={8} md={4} key={s.label}>
            <Card
              size="small"
              style={{ borderRadius: 10, borderLeft: `3px solid ${s.color}` }}
              bodyStyle={{ padding: '10px 12px' }}
            >
              <div style={{ fontSize: 17, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Search */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Input
            placeholder="Search loan no. or customer..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
          onClick: () => navigate('/los/applications/' + row.loanNumber),
          style: { cursor: 'pointer' },
        })}
        scroll={{ x: 1200 }}
      />
    </>
  )
}

export default NPA
