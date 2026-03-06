import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, Row, Col, Card, Table, Progress, Space } from 'antd'
import { WarningFilled } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import { loanApi } from '../../api/loanApi'
import { formatCurrency } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

const BUCKETS = [
  { key: 'sma0', label: 'SMA-0',   range: '1–30 DPD',  min: 1,  max: 30,       color: '#faad14', bg: '#fffbe6' },
  { key: 'sma1', label: 'SMA-1',   range: '31–60 DPD', min: 31, max: 60,       color: '#fa8c16', bg: '#fff7e6' },
  { key: 'sma2', label: 'SMA-2',   range: '61–90 DPD', min: 61, max: 90,       color: '#f5222d', bg: '#fff1f0' },
  { key: 'npa',  label: 'NPA 90+', range: '90+ DPD',   min: 91, max: Infinity, color: '#820014', bg: '#fff1f0' },
]

const getBucket = (dpd) => {
  const d = dpd ?? 0
  return BUCKETS.find((b) => d >= b.min && d <= b.max)
}

const tableColumns = (navigate) => [
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
    align: 'center',
    render: (v) => {
      const b = getBucket(v)
      return b
        ? <Tag style={{ color: b.color, background: b.bg, border: 'none', fontWeight: 700, fontSize: 11 }}>{v ?? 0}d</Tag>
        : <Tag>{v ?? 0}d</Tag>
    },
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
    title: 'Status',
    dataIndex: 'loanStatusCode',
    key: 'loanStatusCode',
    render: (v) => <Tag color={v === 'NPA' ? 'error' : 'warning'}>{v}</Tag>,
  },
]

const DPDBuckets = () => {
  const navigate = useNavigate()
  const [all, setAll]           = useState([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await loanApi.getAll({ page: 0, size: 500 })
      const loans = (res.data?.data?.content || []).filter(
        (l) => l.loanStatusCode === 'OVERDUE' || l.loanStatusCode === 'NPA'
      )
      loans.sort((a, b) => (b.currentDpd ?? 0) - (a.currentDpd ?? 0))
      setAll(loans)
    } catch (err) {
      showError(err, 'Failed to load loan portfolio')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const bucketStats = BUCKETS.map((b) => {
    const loans = all.filter((l) => (l.currentDpd ?? 0) >= b.min && (l.currentDpd ?? 0) <= b.max)
    return {
      ...b,
      loans,
      count:            loans.length,
      totalOutstanding: loans.reduce((s, l) => s + (l.outstandingAmount || 0), 0),
      totalOverdue:     loans.reduce((s, l) => s + (l.totalOverdueAmount || 0), 0),
    }
  })

  const totalLoans    = all.length || 1
  const activeBucket  = selected ? bucketStats.find((b) => b.key === selected) : null
  const filteredLoans = activeBucket ? activeBucket.loans : all

  return (
    <>
      <PageHeader
        title="DPD Buckets"
        subtitle="Days Past Due bucket-wise loan classification (OVERDUE + NPA loans)"
        breadcrumbs={[{ label: 'Collections' }, { label: 'DPD Buckets' }]}
      />

      {/* Bucket Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {bucketStats.map((b) => (
          <Col xs={12} sm={6} key={b.key}>
            <Card
              size="small"
              style={{
                borderRadius: 10,
                borderLeft: `4px solid ${b.color}`,
                cursor: 'pointer',
                boxShadow: selected === b.key ? `0 0 0 2px ${b.color}` : undefined,
                transition: 'box-shadow 0.2s',
              }}
              bodyStyle={{ padding: '12px 14px' }}
              onClick={() => setSelected(selected === b.key ? null : b.key)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: b.color }}>{b.label}</span>
                <Tag style={{ color: b.color, background: b.bg, border: 'none', fontSize: 10, margin: 0 }}>
                  {b.range}
                </Tag>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: b.color }}>{b.count}</div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>accounts</div>
              <Progress
                percent={Math.round((b.count / totalLoans) * 100)}
                showInfo={false}
                strokeColor={b.color}
                trailColor="#f0f0f0"
                size="small"
              />
              <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
                Outstanding: <strong style={{ color: '#333' }}>{formatCurrency(b.totalOutstanding, 0)}</strong>
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                Overdue: <strong style={{ color: b.color }}>{formatCurrency(b.totalOverdue, 0)}</strong>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {activeBucket && (
        <div style={{ marginBottom: 8, fontSize: 13, color: '#555' }}>
          <WarningFilled style={{ color: activeBucket.color, marginRight: 6 }} />
          Showing <strong style={{ color: activeBucket.color }}>{activeBucket.label}</strong> ({activeBucket.count} loans)
          <span
            style={{ marginLeft: 10, color: '#1B3A6B', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setSelected(null)}
          >
            Show all
          </span>
        </div>
      )}

      <Card size="small" style={{ borderRadius: 10 }} bodyStyle={{ padding: 0 }}>
        <Table
          columns={tableColumns(navigate)}
          dataSource={filteredLoans}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 15, showSizeChanger: false, showTotal: (t) => `${t} loans` }}
          onRow={(row) => ({
            onClick: () => navigate('/los/applications/' + row.loanNumber),
            style: { cursor: 'pointer' },
          })}
          scroll={{ x: 900 }}
        />
      </Card>
    </>
  )
}

export default DPDBuckets
