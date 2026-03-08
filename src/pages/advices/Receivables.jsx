import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Tabs, Statistic } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import { emiScheduleApi } from '../../api/emiScheduleApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

const STATUS_COLOR = { PENDING: 'blue', OVERDUE: 'red', PAID: 'green', PARTIALLY_PAID: 'orange' }

const today     = dayjs().format('YYYY-MM-DD')
const weekEnd   = dayjs().endOf('week').format('YYYY-MM-DD')
const monthEnd  = dayjs().endOf('month').format('YYYY-MM-DD')

const emiColumns = [
  { title: 'Loan No.',    dataIndex: 'loanNumber',   key: 'loanNumber',   render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
  { title: 'Customer',   dataIndex: 'customerName',  key: 'customerName' },
  { title: 'EMI #',      dataIndex: 'emiNumber',     key: 'emiNumber',    align: 'center' },
  { title: 'Due Date',   dataIndex: 'dueDate',       key: 'dueDate',      render: (v) => formatDate(v) },
  { title: 'EMI Amount', dataIndex: 'emiAmount',     key: 'emiAmount',    align: 'right', render: (v) => formatCurrency(v) },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v) => <Tag color={STATUS_COLOR[v] || 'default'}>{v}</Tag>,
  },
  {
    title: 'DPD',
    dataIndex: 'daysPastDue',
    key: 'dpd',
    align: 'center',
    render: (v) => v > 0 ? <span style={{ color: '#f5222d', fontWeight: 700 }}>{v}d</span> : <span style={{ color: '#52c41a' }}>Current</span>,
  },
]

const EmiTable = ({ params, emptyText }) => {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage]       = useState(0)

  const load = async (p = 0) => {
    setLoading(true)
    try {
      const res = await emiScheduleApi.getAll({ ...params, page: p, size: 10 })
      const content = res.data?.data?.content || []
      setData(content)
      setTotal(res.data?.data?.totalElements || 0)
      setPage(p)
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(0) }, [])

  const totalAmount = data.reduce((s, r) => s + (r.emiAmount || 0), 0)

  return (
    <>
      <div style={{ marginBottom: 12, textAlign: 'right', fontSize: 13 }}>
        <span style={{ color: '#888' }}>Total on page: </span>
        <span style={{ fontWeight: 700, color: '#fa8c16' }}>{formatCurrency(totalAmount)}</span>
        <span style={{ marginLeft: 16, color: '#888' }}>Records: </span>
        <span style={{ fontWeight: 700 }}>{total}</span>
      </div>
      <Table
        dataSource={data}
        columns={emiColumns}
        rowKey="id"
        size="small"
        loading={loading}
        locale={{ emptyText }}
        pagination={{
          pageSize: 10,
          total,
          current: page + 1,
          size: 'small',
          onChange: (p) => load(p - 1),
        }}
        scroll={{ x: 700 }}
      />
    </>
  )
}

const Receivables = () => {
  const [summaryData, setSummaryData] = useState({ todayCount: 0, overdueCount: 0, todayAmt: 0, overdueAmt: 0 })
  const [loadingSummary, setLoadingSummary] = useState(false)

  const loadSummary = async () => {
    setLoadingSummary(true)
    try {
      const [todayRes, overdueRes] = await Promise.all([
        emiScheduleApi.getAll({ dueDateFrom: today, dueDateTo: today, status: 'PENDING', page: 0, size: 100 }),
        emiScheduleApi.getAll({ status: 'OVERDUE', page: 0, size: 100 }),
      ])
      const todayItems   = todayRes.data?.data?.content || []
      const overdueItems = overdueRes.data?.data?.content || []
      setSummaryData({
        todayCount:   todayRes.data?.data?.totalElements || 0,
        overdueCount: overdueRes.data?.data?.totalElements || 0,
        todayAmt:     todayItems.reduce((s, r) => s + (r.emiAmount || 0), 0),
        overdueAmt:   overdueItems.reduce((s, r) => s + (r.emiAmount || 0), 0),
      })
    } catch { /* silent */ }
    finally { setLoadingSummary(false) }
  }

  useEffect(() => { loadSummary() }, [])

  const tabs = [
    {
      key: 'today',
      label: 'Due Today',
      children: <EmiTable params={{ dueDateFrom: today, dueDateTo: today, status: 'PENDING' }} emptyText="No EMIs due today" />,
    },
    {
      key: 'week',
      label: 'Due This Week',
      children: <EmiTable params={{ dueDateFrom: today, dueDateTo: weekEnd, status: 'PENDING' }} emptyText="No EMIs due this week" />,
    },
    {
      key: 'month',
      label: 'Due This Month',
      children: <EmiTable params={{ dueDateFrom: today, dueDateTo: monthEnd, status: 'PENDING' }} emptyText="No EMIs due this month" />,
    },
    {
      key: 'overdue',
      label: <span style={{ color: '#f5222d' }}>Overdue</span>,
      children: <EmiTable params={{ status: 'OVERDUE' }} emptyText="No overdue EMIs" />,
    },
  ]

  return (
    <>
      <PageHeader
        title="Receivables"
        subtitle="EMI dues and overdue receivables across all loans"
        breadcrumbs={[{ label: 'Advices' }, { label: 'Receivables' }]}
        actions={[
          <Button key="refresh" icon={<ReloadOutlined />} loading={loadingSummary} onClick={loadSummary}>Refresh</Button>,
        ]}
      />

      {/* Summary cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { label: 'Due Today (EMIs)',     value: summaryData.todayCount,   color: '#1890ff', isNum: true },
          { label: 'Due Today (Amount)',   value: formatCurrency(summaryData.todayAmt),   color: '#1890ff' },
          { label: 'Overdue EMIs',         value: summaryData.overdueCount, color: '#f5222d', isNum: true },
          { label: 'Overdue Amount',       value: formatCurrency(summaryData.overdueAmt), color: '#f5222d' },
        ].map((s) => (
          <Col key={s.label} xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
              {s.isNum
                ? <Statistic value={s.value} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />
                : <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>}
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card size="small" style={{ borderRadius: 10 }}>
        <Tabs items={tabs} defaultActiveKey="today" />
      </Card>
    </>
  )
}

export default Receivables
