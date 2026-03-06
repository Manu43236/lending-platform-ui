import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Tag, Space, Row, Col, Card } from 'antd'
import { SearchOutlined, WarningFilled } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { loanApi } from '../../api/loanApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

const DPD_BUCKET = (dpd) => {
  if (!dpd || dpd === 0) return { label: 'Current',  color: '#52c41a', bg: '#f6ffed' }
  if (dpd <= 30)          return { label: 'SMA-0',    color: '#faad14', bg: '#fffbe6' }
  if (dpd <= 60)          return { label: 'SMA-1',    color: '#fa8c16', bg: '#fff7e6' }
  if (dpd <= 90)          return { label: 'SMA-2',    color: '#f5222d', bg: '#fff1f0' }
  return                         { label: 'NPA 90+',  color: '#820014', bg: '#fff1f0' }
}

const DPDTag = ({ dpd }) => {
  const b = DPD_BUCKET(dpd)
  return (
    <Tag style={{ color: b.color, background: b.bg, border: 'none', fontWeight: 600, fontSize: 11 }}>
      {dpd ?? 0}d — {b.label}
    </Tag>
  )
}

const OverdueLoans = () => {
  const navigate = useNavigate()
  const [all, setAll]           = useState([])
  const [data, setData]         = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading]   = useState(false)
  const [search, setSearch]     = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await loanApi.getAll({ page: 0, size: 500, status: 'OVERDUE' })
      const items = (res.data?.data?.content || [])
      items.sort((a, b) => (b.currentDpd ?? 0) - (a.currentDpd ?? 0))
      setAll(items)
      setData(items.slice(0, 10))
      setPagination({ page: 0, size: 10, totalElements: items.length })
    } catch (err) {
      showError(err, 'Failed to load overdue loans')
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

  const totalOverdue  = all.reduce((s, l) => s + (l.totalOverdueAmount || 0), 0)
  const totalOutstanding = all.reduce((s, l) => s + (l.outstandingAmount || 0), 0)
  const avgDpd = all.length ? Math.round(all.reduce((s, l) => s + (l.currentDpd || 0), 0) / all.length) : 0

  const columns = [
    {
      title: 'Loan No.',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      width: 155,
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
      title: 'Loan Type',
      dataIndex: 'loanTypeName',
      key: 'loanTypeName',
      render: (v) => v || '—',
    },
    {
      title: 'DPD',
      dataIndex: 'currentDpd',
      key: 'currentDpd',
      render: (v) => <DPDTag dpd={v} />,
    },
    {
      title: 'Overdue EMIs',
      dataIndex: 'numberOfOverdueEmis',
      key: 'numberOfOverdueEmis',
      align: 'center',
      render: (v) => <Tag color="red">{v ?? 0}</Tag>,
    },
    {
      title: 'Overdue Amount',
      dataIndex: 'totalOverdueAmount',
      key: 'totalOverdueAmount',
      align: 'right',
      render: (v) => <span style={{ fontWeight: 600, color: '#cf1322' }}>{formatCurrency(v, 0)}</span>,
    },
    {
      title: 'Outstanding',
      dataIndex: 'outstandingAmount',
      key: 'outstandingAmount',
      align: 'right',
      render: (v) => formatCurrency(v, 0),
    },
    {
      title: 'EMI / Month',
      dataIndex: 'emiAmount',
      key: 'emiAmount',
      align: 'right',
      render: (v) => formatCurrency(v, 0),
    },
    {
      title: 'Highest DPD',
      dataIndex: 'highestDpd',
      key: 'highestDpd',
      align: 'center',
      render: (v) => v
        ? <span style={{ color: v > 30 ? '#cf1322' : '#faad14', fontWeight: 600 }}>{v}d</span>
        : '0d',
    },
  ]

  return (
    <>
      <PageHeader
        title="Overdue Loans"
        subtitle="Loans with missed EMI payments — sorted by DPD (highest first)"
        breadcrumbs={[{ label: 'Collections' }, { label: 'Overdue Loans' }]}
      />

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          { label: 'Overdue Accounts', value: all.length,                         color: '#fa8c16' },
          { label: 'Total Overdue Amt', value: formatCurrency(totalOverdue, 0),   color: '#cf1322' },
          { label: 'Total Outstanding', value: formatCurrency(totalOutstanding, 0), color: '#1B3A6B' },
          { label: 'Avg DPD',           value: avgDpd + ' days',                  color: '#f5222d' },
        ].map((s) => (
          <Col xs={12} sm={6} key={s.label}>
            <Card size="small" style={{ borderRadius: 10, borderLeft: `3px solid ${s.color}` }} bodyStyle={{ padding: '10px 12px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
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
            allowClear value={search}
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
        scroll={{ x: 1100 }}
      />
    </>
  )
}

export default OverdueLoans
