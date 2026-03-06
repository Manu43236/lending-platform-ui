import { useState, useEffect, useCallback } from 'react'
import { Tag, Space, Card, Row, Col, Input, Modal, Form, Select, Button } from 'antd'
import { SearchOutlined, StopOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { penaltyApi } from '../../api/penaltyApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError, showSuccess } from '../../utils/errorHandler'
import useAuthStore from '../../store/authStore'

const STATUS_TAG = {
  true:  { label: 'Waived', color: '#52c41a', bg: '#f6ffed' },
  false: { label: 'Active', color: '#cf1322', bg: '#fff1f0' },
}

const WAIVE_REASONS = [
  'Customer Hardship',
  'First-time Default',
  'System Error',
  'Legal Dispute',
  'Management Discretion',
  'Other',
]

const Penalties = () => {
  const { user } = useAuthStore()
  const [all, setAll]               = useState([])
  const [data, setData]             = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [waiveModal, setWaiveModal] = useState({ open: false, penalty: null })
  const [waiving, setWaiving]       = useState(false)
  const [form] = Form.useForm()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await penaltyApi.getAll({ page: 0, size: 500 })
      const items = res.data?.data?.content || []
      setAll(items)
      setData(items.slice(0, 10))
      setPagination({ page: 0, size: 10, totalElements: items.length })
    } catch (err) {
      showError(err, 'Failed to load penalties')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    const q = search.toLowerCase()
    const filtered = !q
      ? all
      : all.filter((p) =>
          p.loan?.loanNumber?.toLowerCase().includes(q) ||
          p.customer?.customerName?.toLowerCase().includes(q) ||
          p.penaltyName?.toLowerCase().includes(q) ||
          p.penaltyCode?.toLowerCase().includes(q)
        )
    setData(filtered.slice(0, pagination.size))
    setPagination((prev) => ({ ...prev, page: 0, totalElements: filtered.length }))
  }, [search, all]) // eslint-disable-line

  const handlePageChange = (page, size) => {
    const q = search.toLowerCase()
    const filtered = !q
      ? all
      : all.filter((p) =>
          p.loan?.loanNumber?.toLowerCase().includes(q) ||
          p.customer?.customerName?.toLowerCase().includes(q) ||
          p.penaltyName?.toLowerCase().includes(q) ||
          p.penaltyCode?.toLowerCase().includes(q)
        )
    setData(filtered.slice(page * size, page * size + size))
    setPagination({ page, size, totalElements: filtered.length })
  }

  const handleWaive = async (values) => {
    setWaiving(true)
    try {
      await penaltyApi.waive(
        waiveModal.penalty.id,
        user?.id || 1,
        values.reason,
      )
      showSuccess('Penalty waived successfully.')
      setWaiveModal({ open: false, penalty: null })
      form.resetFields()
      fetchAll()
    } catch (err) {
      showError(err, 'Failed to waive penalty')
    } finally {
      setWaiving(false)
    }
  }

  const totalPenalty  = all.reduce((s, p) => s + (p.penaltyAmount || 0), 0)
  const totalWaived   = all.reduce((s, p) => s + (p.waivedAmount || 0), 0)
  const totalActive   = all.filter((p) => !p.isWaived && !p.isPaid).length
  const totalPaid     = all.filter((p) => p.isPaid).length

  const columns = [
    {
      title: 'Loan No.',
      key: 'loanNumber',
      width: 155,
      render: (_, row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#1B3A6B', fontWeight: 600 }}>
          {row.loan?.loanNumber || '—'}
        </span>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{row.customer?.customerName || '—'}</span>
          <span style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>{row.customer?.customerNumber || ''}</span>
        </Space>
      ),
    },
    {
      title: 'Penalty',
      key: 'penalty',
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{row.penaltyName}</span>
          <span style={{ fontSize: 11, color: '#999' }}>{row.penaltyCode}</span>
        </Space>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'penaltyAmount',
      key: 'penaltyAmount',
      align: 'right',
      render: (v) => <span style={{ fontWeight: 600, color: '#cf1322' }}>{formatCurrency(v, 2)}</span>,
    },
    {
      title: 'Applied On',
      dataIndex: 'appliedDate',
      key: 'appliedDate',
      render: (v) => formatDate(v),
    },
    {
      title: 'DPD at Apply',
      dataIndex: 'daysOverdue',
      key: 'daysOverdue',
      align: 'center',
      render: (v) => v ? <span style={{ color: '#cf1322', fontWeight: 600 }}>{v}d</span> : '—',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, row) => {
        if (row.isPaid) return <Tag color="blue">Paid</Tag>
        const s = STATUS_TAG[row.isWaived]
        return (
          <Tag style={{ color: s.color, background: s.bg, border: 'none', fontWeight: 600 }}>
            {s.label}
          </Tag>
        )
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, row) => {
        if (row.isWaived || row.isPaid) return '—'
        return (
          <Button
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              setWaiveModal({ open: true, penalty: row })
            }}
          >
            Waive
          </Button>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Penalties"
        subtitle="View and manage penal charges on overdue loans"
        breadcrumbs={[{ label: 'Collections' }, { label: 'Penalties' }]}
      />

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          { label: 'Total Penalties',   value: all.length,                       color: '#1B3A6B' },
          { label: 'Active (Unpaid)',    value: totalActive,                      color: '#cf1322' },
          { label: 'Paid',              value: totalPaid,                        color: '#52c41a' },
          { label: 'Total Penalty Amt', value: formatCurrency(totalPenalty, 0), color: '#fa8c16' },
          { label: 'Total Waived',      value: formatCurrency(totalWaived, 0),  color: '#888'    },
        ].map((s) => (
          <Col xs={12} sm={8} md={4} key={s.label}>
            <Card size="small" style={{ borderRadius: 10, borderLeft: `3px solid ${s.color}` }} bodyStyle={{ padding: '10px 12px' }}>
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
            placeholder="Search loan, customer, penalty..."
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
        scroll={{ x: 1050 }}
      />

      {/* Waive Modal */}
      <Modal
        title={<><StopOutlined style={{ color: '#cf1322', marginRight: 8 }} />Waive Penalty</>}
        open={waiveModal.open}
        onCancel={() => { setWaiveModal({ open: false, penalty: null }); form.resetFields() }}
        onOk={() => form.submit()}
        okText="Waive Penalty"
        okButtonProps={{ danger: true, loading: waiving }}
      >
        {waiveModal.penalty && (
          <div style={{ marginBottom: 16, padding: '10px 12px', background: '#fff1f0', borderRadius: 8 }}>
            <div style={{ fontWeight: 600 }}>{waiveModal.penalty.penaltyName} ({waiveModal.penalty.penaltyCode})</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
              Loan: <strong>{waiveModal.penalty.loan?.loanNumber}</strong> &nbsp;|&nbsp;
              Amount: <strong style={{ color: '#cf1322' }}>{formatCurrency(waiveModal.penalty.penaltyAmount, 2)}</strong>
            </div>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleWaive}>
          <Form.Item name="reason" label="Waiver Reason" rules={[{ required: true, message: 'Please select a reason' }]}>
            <Select placeholder="Select reason" options={WAIVE_REASONS.map((r) => ({ label: r, value: r }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default Penalties
