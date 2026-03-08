import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Tabs, Modal, Input, Space, Statistic } from 'antd'
import { ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import { penaltyApi } from '../../api/penaltyApi'
import { masterApi } from '../../api/masterApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

// ─── Tab 1: Applied Penalty Charges ────────────────────────────────────────

const PenaltyCharges = () => {
  const [data, setData]           = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [page, setPage]           = useState(0)
  const [waiveModal, setWaiveModal] = useState({ open: false, penalty: null })
  const [waiveReason, setWaiveReason] = useState('')
  const [waiving, setWaiving]     = useState(false)

  const load = async (p = 0) => {
    setLoading(true)
    try {
      const res = await penaltyApi.getAll({ page: p, size: 10 })
      setData(res.data?.data?.content || [])
      setTotal(res.data?.data?.totalElements || 0)
      setPage(p)
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(0) }, [])

  const handleWaive = async () => {
    if (!waiveReason.trim()) return
    setWaiving(true)
    try {
      // userId = 1 (system/admin — demo project)
      await penaltyApi.waive(waiveModal.penalty.id, 1, waiveReason)
      setWaiveModal({ open: false, penalty: null })
      setWaiveReason('')
      load(page)
    } catch (err) { showError(err) }
    finally { setWaiving(false) }
  }

  const totalApplied = data.reduce((s, r) => s + (!r.isWaived ? (r.penaltyAmount || 0) : 0), 0)
  const totalWaived  = data.reduce((s, r) => s + (r.isWaived ? (r.waivedAmount || 0) : 0), 0)

  const columns = [
    {
      title: 'Loan No.',
      dataIndex: ['loan', 'loanNumber'],
      key: 'loanNumber',
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customerName',
    },
    { title: 'Penalty Code', dataIndex: 'penaltyCode',  key: 'penaltyCode', render: (v) => <Tag color="orange">{v}</Tag> },
    { title: 'Penalty Name', dataIndex: 'penaltyName',  key: 'penaltyName' },
    {
      title: 'Amount',
      dataIndex: 'penaltyAmount',
      key: 'penaltyAmount',
      align: 'right',
      render: (v) => <span style={{ fontWeight: 600, color: '#f5222d' }}>{formatCurrency(v)}</span>,
    },
    { title: 'Applied Date', dataIndex: 'appliedDate', key: 'appliedDate', render: (v) => formatDate(v) },
    { title: 'Applied By',   dataIndex: 'appliedBy',   key: 'appliedBy',   render: (v) => <Tag>{v || 'SYSTEM'}</Tag> },
    {
      title: 'Status',
      key: 'status',
      render: (_, r) => {
        if (r.isWaived) return <Tag color="green">Waived</Tag>
        if (r.isPaid)   return <Tag color="blue">Paid</Tag>
        return <Tag color="red">Outstanding</Tag>
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, r) => {
        if (r.isWaived || r.isPaid) return <span style={{ color: '#bbb', fontSize: 12 }}>—</span>
        return (
          <Button
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => setWaiveModal({ open: true, penalty: r })}
          >
            Waive
          </Button>
        )
      },
    },
  ]

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 12 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Statistic value={total} valueStyle={{ color: '#f5222d', fontSize: 22, fontWeight: 700 }} />
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Total Penalties</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f5222d' }}>{formatCurrency(totalApplied)}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Outstanding (this page)</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{formatCurrency(totalWaived)}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Waived (this page)</div>
          </Card>
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        size="small"
        loading={loading}
        pagination={{
          pageSize: 10,
          total,
          current: page + 1,
          size: 'small',
          onChange: (p) => load(p - 1),
        }}
        locale={{ emptyText: 'No penalties applied yet' }}
        scroll={{ x: 900 }}
      />

      <Modal
        title="Waive Penalty"
        open={waiveModal.open}
        onOk={handleWaive}
        onCancel={() => { setWaiveModal({ open: false, penalty: null }); setWaiveReason('') }}
        okText="Confirm Waiver"
        confirmLoading={waiving}
        okButtonProps={{ disabled: !waiveReason.trim() }}
      >
        {waiveModal.penalty && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <span style={{ color: '#888' }}>Penalty: </span>
              <strong>{waiveModal.penalty.penaltyName}</strong>
            </div>
            <div>
              <span style={{ color: '#888' }}>Amount: </span>
              <strong style={{ color: '#f5222d' }}>{formatCurrency(waiveModal.penalty.penaltyAmount)}</strong>
            </div>
            <Input.TextArea
              placeholder="Enter reason for waiver..."
              value={waiveReason}
              onChange={(e) => setWaiveReason(e.target.value)}
              rows={3}
              style={{ marginTop: 8 }}
            />
          </Space>
        )}
      </Modal>
    </>
  )
}

// ─── Tab 2: Processing Fee Config ───────────────────────────────────────────

const ProcessingFeeConfig = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await masterApi.getAllProcessingFees()
      setData(res.data?.data || [])
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const columns = [
    { title: 'Loan Type',   dataIndex: ['loanType', 'name'], key: 'loanType' },
    { title: 'Loan Code',   dataIndex: ['loanType', 'code'], key: 'loanCode', render: (v) => <Tag>{v}</Tag> },
    { title: 'Fee Type',    dataIndex: 'feeType',  key: 'feeType',  render: (v) => <Tag color="blue">{v}</Tag> },
    {
      title: 'Fee Value',
      dataIndex: 'feeValue',
      key: 'feeValue',
      align: 'right',
      render: (v, r) => r.feeType === 'PERCENTAGE' ? `${v}%` : formatCurrency(v),
    },
    { title: 'Min Fee', dataIndex: 'minFee', key: 'minFee', align: 'right', render: (v) => v ? formatCurrency(v) : '—' },
    { title: 'Max Fee', dataIndex: 'maxFee', key: 'maxFee', align: 'right', render: (v) => v ? formatCurrency(v) : '—' },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v) => <Tag color={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag>,
    },
  ]

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="id"
      size="small"
      loading={loading}
      pagination={false}
      locale={{ emptyText: 'No fee configs found' }}
    />
  )
}

// ─── Tab 3: Penalty Type Config ─────────────────────────────────────────────

const PenaltyTypeConfig = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await penaltyApi.getConfigs()
      setData(res.data?.data || [])
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const columns = [
    { title: 'Code',        dataIndex: 'penaltyCode',  key: 'code',   render: (v) => <Tag color="orange">{v}</Tag> },
    { title: 'Name',        dataIndex: 'penaltyName',  key: 'name' },
    { title: 'Description', dataIndex: 'description',  key: 'desc',   render: (v) => <span style={{ fontSize: 12, color: '#666' }}>{v || '—'}</span> },
    { title: 'Type',        dataIndex: 'penaltyType',  key: 'type',   render: (v) => <Tag>{v}</Tag> },
    { title: 'Charge Type', dataIndex: 'chargeType',   key: 'chargeType', render: (v) => <Tag color="blue">{v}</Tag> },
    {
      title: 'Charge Value',
      dataIndex: 'chargeValue',
      key: 'chargeValue',
      align: 'right',
      render: (v, r) => r.chargeType === 'PERCENTAGE' ? `${v}%` : formatCurrency(v),
    },
    { title: 'Max Penalty', dataIndex: 'maxPenaltyAmount', key: 'max', align: 'right', render: (v) => v ? formatCurrency(v) : '—' },
    { title: 'After (Days)', dataIndex: 'applicableAfterDays', key: 'days', align: 'center', render: (v) => v ?? '—' },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v) => <Tag color={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag>,
    },
  ]

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="id"
      size="small"
      loading={loading}
      pagination={false}
      locale={{ emptyText: 'No penalty configs found' }}
      scroll={{ x: 800 }}
    />
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const Fees = () => {
  const [activeTab, setActiveTab] = useState('charges')

  const tabs = [
    {
      key: 'charges',
      label: 'Penalty Charges',
      children: <PenaltyCharges />,
    },
    {
      key: 'processing',
      label: 'Processing Fee Config',
      children: <ProcessingFeeConfig />,
    },
    {
      key: 'penaltyTypes',
      label: 'Penalty Types Config',
      children: <PenaltyTypeConfig />,
    },
  ]

  return (
    <>
      <PageHeader
        title="Fees & Charges"
        subtitle="Applied penalty charges, processing fee configuration and penalty type setup"
        breadcrumbs={[{ label: 'Fees & Charges' }]}
      />
      <Card size="small" style={{ borderRadius: 10 }}>
        <Tabs
          items={tabs}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </Card>
    </>
  )
}

export default Fees
