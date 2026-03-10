import { useEffect, useState } from 'react'
import { Row, Col, Card, Table, Typography, Tag } from 'antd'
import {
  UserOutlined, FileTextOutlined, BankOutlined, WarningOutlined,
  RiseOutlined, FallOutlined, DollarOutlined, ExclamationCircleOutlined,
  CalendarOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import dayjs from 'dayjs'
import { loanApi } from '../../api/loanApi'
import { customerApi } from '../../api/customerApi'
import { emiScheduleApi } from '../../api/emiScheduleApi'
import { formatCurrencyShort, formatCurrency, formatDate } from '../../utils/formatters'
import { brand, loanStatusColors, dpdBucketColors } from '../../theme/colors'
import PageHeader from '../../components/PageHeader'

const { Text, Title } = Typography

const today = dayjs().format('YYYY-MM-DD')

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon, iconBg, trend, loading }) => (
  <Card
    size="small"
    loading={loading}
    style={{ borderRadius: 10, height: '100%' }}
    bodyStyle={{ padding: '16px 20px' }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: iconBg || '#e6f4ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{label}</Text>
        <Title level={4} style={{ margin: '2px 0 0', lineHeight: 1.2 }}>{value}</Title>
        {sub && (
          <Text style={{ fontSize: 11, color: trend === 'up' ? '#52c41a' : trend === 'down' ? '#ff4d4f' : '#999' }}>
            {trend === 'up' && <RiseOutlined style={{ marginRight: 3 }} />}
            {trend === 'down' && <FallOutlined style={{ marginRight: 3 }} />}
            {sub}
          </Text>
        )}
      </div>
    </div>
  </Card>
)

// ─── Status Tag ───────────────────────────────────────────────────────────────
const StatusTag = ({ status }) => {
  const s = loanStatusColors[status] || loanStatusColors.INITIATED
  return (
    <Tag style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}`, fontSize: 11 }}>
      {status?.replace('_', ' ')}
    </Tag>
  )
}

// ─── Pie Tooltip ──────────────────────────────────────────────────────────────
const PieTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const { name, value } = payload[0]
    return (
      <div style={{ background: '#fff', border: '1px solid #f0f0f0', padding: '8px 12px', borderRadius: 6, fontSize: 13 }}>
        <div><strong>{name}</strong></div>
        <div>{value} loans</div>
      </div>
    )
  }
  return null
}

// ─── DPD bucket helpers ───────────────────────────────────────────────────────
const getDpdBucket = (dpd) => {
  if (!dpd || dpd === 0) return 'Current'
  if (dpd <= 30) return 'SMA-0 (1-30)'
  if (dpd <= 60) return 'SMA-1 (31-60)'
  if (dpd <= 90) return 'SMA-2 (61-90)'
  return 'NPA (90+)'
}

const DPD_COLORS = {
  'Current':       dpdBucketColors.current,
  'SMA-0 (1-30)':  dpdBucketColors.dpd30,
  'SMA-1 (31-60)': dpdBucketColors.dpd60,
  'SMA-2 (61-90)': dpdBucketColors.dpd90,
  'NPA (90+)':     dpdBucketColors.npa,
}

const STATUS_COLORS = [
  '#1B3A6B', '#2E5FA3', '#52c41a', '#faad14', '#fa8c16', '#f5222d',
  '#820014', '#096dd9', '#531dab', '#237804', '#595959', '#434343',
]

// ─── Recent Loans Columns ─────────────────────────────────────────────────────
const recentColumns = [
  {
    title: 'Loan No.',
    dataIndex: 'loanNumber',
    key: 'loanNumber',
    render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
  },
  {
    title: 'Customer',
    dataIndex: 'customerName',
    key: 'customerName',
    render: (v) => v || '—',
  },
  {
    title: 'Amount',
    dataIndex: 'loanAmount',
    key: 'loanAmount',
    align: 'right',
    render: (v) => formatCurrency(v, 0),
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
    render: (v) => <StatusTag status={v} />,
  },
  {
    title: 'Applied On',
    dataIndex: 'appliedDate',
    key: 'appliedDate',
    render: (v) => formatDate(v),
  },
]

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [loans, setLoans]               = useState([])
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [todayEmis, setTodayEmis]       = useState({ due: 0, paid: 0, overdue: 0, dueAmt: 0, paidAmt: 0 })
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [loansRes, custRes, todayDueRes, todayPaidRes] = await Promise.all([
          loanApi.getAll({ page: 0, size: 500 }),
          customerApi.getAll({ page: 0, size: 1 }),
          emiScheduleApi.getAll({ dueDateFrom: today, dueDateTo: today, page: 0, size: 200 }),
          emiScheduleApi.getAll({ dueDateFrom: today, dueDateTo: today, status: 'PAID', page: 0, size: 200 }),
        ])

        const loanList = loansRes.data?.data?.content || []
        setLoans(loanList)
        setTotalCustomers(custRes.data?.data?.totalElements ?? 0)

        const dueEmis  = todayDueRes.data?.data?.content || []
        const paidEmis = todayPaidRes.data?.data?.content || []
        const overdueCount = dueEmis.filter(e => e.status === 'OVERDUE').length

        setTodayEmis({
          due:      todayDueRes.data?.data?.totalElements || 0,
          paid:     todayPaidRes.data?.data?.totalElements || 0,
          overdue:  overdueCount,
          dueAmt:   dueEmis.reduce((s, e) => s + (e.emiAmount || 0), 0),
          paidAmt:  paidEmis.reduce((s, e) => s + (e.amountPaid || 0), 0),
        })
      } catch {
        // cards show 0
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Derived KPIs ─────────────────────────────────────────────────────────────
  const byStatus = (code) => loans.filter(l => l.loanStatusCode === code).length

  const activeLoans      = byStatus('ACTIVE')
  const overdueLoans     = byStatus('OVERDUE')
  const npaLoans         = byStatus('NPA')
  const underAssessment  = byStatus('UNDER_ASSESSMENT')
  const approved         = byStatus('APPROVED')
  const disbursed        = byStatus('DISBURSED')
  const closed           = byStatus('CLOSED')

  const totalAUM = loans
    .filter(l => ['DISBURSED', 'CURRENT', 'ACTIVE', 'OVERDUE', 'NPA'].includes(l.loanStatusCode))
    .reduce((s, l) => s + (l.outstandingAmount || 0), 0)

  const totalOverdueAmt = loans
    .filter(l => ['OVERDUE', 'NPA'].includes(l.loanStatusCode))
    .reduce((s, l) => s + (l.totalOverdueAmount || 0), 0)

  const parRatio = totalAUM > 0 ? ((totalOverdueAmt / totalAUM) * 100).toFixed(1) : '0.0'

  const collectionEfficiency = todayEmis.dueAmt > 0
    ? ((todayEmis.paidAmt / todayEmis.dueAmt) * 100).toFixed(1)
    : '0.0'

  // ── Loan Status Donut Data ────────────────────────────────────────────────────
  const statusCounts = loans.reduce((acc, l) => {
    const code = l.loanStatusCode
    acc[code] = (acc[code] || 0) + 1
    return acc
  }, {})
  const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // ── DPD Bucket Bar Data ───────────────────────────────────────────────────────
  const dpdMap = { 'Current': 0, 'SMA-0 (1-30)': 0, 'SMA-1 (31-60)': 0, 'SMA-2 (61-90)': 0, 'NPA (90+)': 0 }
  loans
    .filter(l => ['DISBURSED', 'CURRENT', 'ACTIVE', 'OVERDUE', 'NPA'].includes(l.loanStatusCode))
    .forEach(l => { dpdMap[getDpdBucket(l.currentDpd || 0)]++ })
  const dpdChartData = Object.entries(dpdMap).map(([name, count]) => ({ name, count }))

  // ── Recent 5 Loans ────────────────────────────────────────────────────────────
  const recentLoans = [...loans]
    .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
    .slice(0, 5)

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Portfolio overview as of ${formatDate(today)}`}
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      {/* ── Row 1: Pipeline KPIs ─────────────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={4}>
          <KpiCard loading={loading} label="Total Customers" value={totalCustomers}
            icon={<UserOutlined style={{ fontSize: 20, color: brand.primary }} />} iconBg="#e6f0ff" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard loading={loading} label="Total Loans" value={loans.length}
            icon={<FileTextOutlined style={{ fontSize: 20, color: '#096dd9' }} />} iconBg="#e6f4ff" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard loading={loading} label="In Pipeline" value={underAssessment} sub="Under assessment"
            icon={<FileTextOutlined style={{ fontSize: 20, color: '#d46b08' }} />} iconBg="#fff7e6" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard loading={loading} label="Approved" value={approved} sub="Pending disbursal"
            icon={<CheckCircleOutlined style={{ fontSize: 20, color: '#096dd9' }} />} iconBg="#e6f4ff" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard loading={loading} label="Disbursed" value={disbursed} sub="Awaiting activation"
            icon={<DollarOutlined style={{ fontSize: 20, color: '#531dab' }} />} iconBg="#f9f0ff" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard loading={loading} label="Closed" value={closed}
            icon={<BankOutlined style={{ fontSize: 20, color: '#595959' }} />} iconBg="#f5f5f5" />
        </Col>
      </Row>

      {/* ── Row 2: Portfolio Health ───────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <KpiCard loading={loading} label="Active Loans" value={activeLoans} sub="Live portfolio"
            icon={<BankOutlined style={{ fontSize: 20, color: '#237804' }} />} iconBg="#f6ffed" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard loading={loading} label="Overdue Loans" value={overdueLoans} sub="Requires follow-up" trend="down"
            icon={<WarningOutlined style={{ fontSize: 20, color: '#cf1322' }} />} iconBg="#fff1f0" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard loading={loading} label="NPA Accounts" value={npaLoans} sub="DPD > 90" trend="down"
            icon={<ExclamationCircleOutlined style={{ fontSize: 20, color: '#fff' }} />} iconBg="#a8071a" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard loading={loading} label="Total AUM" value={formatCurrencyShort(totalAUM)} sub="Live portfolio outstanding"
            icon={<DollarOutlined style={{ fontSize: 20, color: brand.primary }} />} iconBg="#e6f0ff" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard loading={loading} label="Total Overdue" value={formatCurrencyShort(totalOverdueAmt)} sub="Overdue + NPA" trend="down"
            icon={<WarningOutlined style={{ fontSize: 20, color: '#d46b08' }} />} iconBg="#fff7e6" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard loading={loading} label="PAR Ratio" value={`${parRatio}%`} sub="Portfolio at risk"
            trend={parseFloat(parRatio) > 5 ? 'down' : undefined}
            icon={<RiseOutlined style={{ fontSize: 20, color: parseFloat(parRatio) > 5 ? '#cf1322' : '#52c41a' }} />}
            iconBg={parseFloat(parRatio) > 5 ? '#fff1f0' : '#f6ffed'} />
        </Col>
      </Row>

      {/* ── Row 3: Today's Collection ─────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title={<span><CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />Today's Collection — {dayjs().format('DD MMM YYYY')}</span>}
            size="small"
            style={{ borderRadius: 10 }}
          >
            <Row gutter={[16, 0]}>
              {[
                { label: 'EMIs Due Today',      value: todayEmis.due,      color: '#1890ff', isNum: true },
                { label: 'Collected Today',     value: todayEmis.paid,     color: '#52c41a', isNum: true },
                { label: 'Still Pending',       value: todayEmis.due - todayEmis.paid, color: '#fa8c16', isNum: true },
                { label: 'Amount Due',          value: formatCurrencyShort(todayEmis.dueAmt),  color: '#1890ff' },
                { label: 'Amount Collected',    value: formatCurrencyShort(todayEmis.paidAmt), color: '#52c41a' },
                { label: 'Collection Efficiency', value: `${collectionEfficiency}%`, color: parseFloat(collectionEfficiency) >= 80 ? '#52c41a' : '#fa8c16' },
              ].map(s => (
                <Col key={s.label} xs={12} sm={8} md={4} style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>
                    {s.isNum ? s.value : s.value}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* ── Row 4: Charts ────────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Loan Status Distribution" size="small" style={{ borderRadius: 10 }} loading={loading}>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={3} dataKey="value"
                  >
                    {statusChartData.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip content={<PieTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                No loan data available
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="DPD Bucket Analysis (Live Portfolio)" size="small" style={{ borderRadius: 10 }} loading={loading}>
            {dpdChartData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dpdChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <ReTooltip formatter={(v) => [`${v} loans`, 'Count']} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {dpdChartData.map((entry, i) => (
                      <Cell key={i} fill={DPD_COLORS[entry.name]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                No active portfolio data
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Row 5: Recent Loans ───────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title="Recent Loan Applications"
            size="small"
            style={{ borderRadius: 10 }}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>Latest 5</Text>}
          >
            <Table
              dataSource={recentLoans}
              columns={recentColumns}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
              scroll={{ x: 600 }}
              locale={{ emptyText: 'No loans found' }}
            />
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Dashboard
