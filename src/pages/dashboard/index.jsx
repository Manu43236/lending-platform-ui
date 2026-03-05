import { useEffect, useState } from 'react'
import { Row, Col, Card, Table, Typography, Spin, Tag } from 'antd'
import {
  UserOutlined,
  FileTextOutlined,
  BankOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { loanApi } from '../../api/loanApi'
import { customerApi } from '../../api/customerApi'
import { formatCurrencyShort, formatCurrency, formatDate } from '../../utils/formatters'
import { brand, loanStatusColors, dpdBucketColors } from '../../theme/colors'
import PageHeader from '../../components/PageHeader'

const { Text, Title } = Typography

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

// ─── Donut Chart Custom Tooltip ───────────────────────────────────────────────
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
  if (dpd === 0) return 'Current'
  if (dpd <= 30) return 'SMA-0 (1-30)'
  if (dpd <= 60) return 'SMA-1 (31-60)'
  if (dpd <= 90) return 'SMA-2 (61-90)'
  return 'NPA (90+)'
}

const DPD_COLORS = {
  'Current': dpdBucketColors.current,
  'SMA-0 (1-30)': dpdBucketColors.dpd30,
  'SMA-1 (31-60)': dpdBucketColors.dpd60,
  'SMA-2 (61-90)': dpdBucketColors.dpd90,
  'NPA (90+)': dpdBucketColors.npa,
}

// Status groups for donut
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
    dataIndex: ['customer', 'fullName'],
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
    dataIndex: 'loanStatus',
    key: 'loanStatus',
    render: (v) => <StatusTag status={v} />,
  },
  {
    title: 'Applied On',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (v) => formatDate(v),
  },
]

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [loans, setLoans] = useState([])
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [loansRes, custRes] = await Promise.all([
          loanApi.getAll({ page: 0, size: 500 }),
          customerApi.getAll({ page: 0, size: 1 }),
        ])
        setLoans(loansRes.data?.data?.content || loansRes.data?.data || [])
        setTotalCustomers(
          custRes.data?.data?.totalElements ?? custRes.data?.data?.length ?? 0
        )
      } catch {
        // data stays empty — cards show 0
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Derived KPIs ────────────────────────────────────────────────────────────
  const totalLoans = loans.length
  const activeLoans = loans.filter((l) => l.loanStatus === 'ACTIVE').length
  const overdueLoans = loans.filter((l) => l.loanStatus === 'OVERDUE').length
  const npaLoans = loans.filter((l) => l.loanStatus === 'NPA').length
  const underAssessment = loans.filter((l) =>
    ['UNDER_ASSESSMENT', 'UNDER_REVIEW', 'MANUAL_REVIEW', 'DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED'].includes(l.loanStatus)
  ).length
  const approved = loans.filter((l) => l.loanStatus === 'APPROVED').length
  const disbursed = loans.filter((l) => l.loanStatus === 'DISBURSED').length

  const totalAUM = loans
    .filter((l) => ['ACTIVE', 'OVERDUE', 'NPA'].includes(l.loanStatus))
    .reduce((s, l) => s + (l.outstandingAmount || 0), 0)

  const totalOverdue = loans
    .filter((l) => ['OVERDUE', 'NPA'].includes(l.loanStatus))
    .reduce((s, l) => s + (l.totalOverdue || 0), 0)

  const parRatio = totalAUM > 0 ? ((totalOverdue / totalAUM) * 100).toFixed(1) : '0.0'

  // ── Loan Status Donut Data ──────────────────────────────────────────────────
  const statusCounts = loans.reduce((acc, l) => {
    acc[l.loanStatus] = (acc[l.loanStatus] || 0) + 1
    return acc
  }, {})
  const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // ── DPD Bucket Bar Data ─────────────────────────────────────────────────────
  const dpdMap = { 'Current': 0, 'SMA-0 (1-30)': 0, 'SMA-1 (31-60)': 0, 'SMA-2 (61-90)': 0, 'NPA (90+)': 0 }
  loans
    .filter((l) => ['ACTIVE', 'OVERDUE', 'NPA'].includes(l.loanStatus))
    .forEach((l) => { dpdMap[getDpdBucket(l.currentDPD || 0)]++ })
  const dpdChartData = Object.entries(dpdMap).map(([name, count]) => ({ name, count }))

  // ── Recent 5 Loans ──────────────────────────────────────────────────────────
  const recentLoans = [...loans]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Portfolio overview as of ${formatDate(new Date())}`}
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      {/* ── Row 1: Pipeline KPIs ─────────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={4}>
          <KpiCard
            loading={loading}
            label="Total Customers"
            value={totalCustomers}
            icon={<UserOutlined style={{ fontSize: 20, color: brand.primary }} />}
            iconBg="#e6f0ff"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard
            loading={loading}
            label="Total Loans"
            value={totalLoans}
            icon={<FileTextOutlined style={{ fontSize: 20, color: '#096dd9' }} />}
            iconBg="#e6f4ff"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard
            loading={loading}
            label="In Pipeline"
            value={underAssessment}
            sub="Under assessment"
            icon={<FileTextOutlined style={{ fontSize: 20, color: '#d46b08' }} />}
            iconBg="#fff7e6"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard
            loading={loading}
            label="Approved"
            value={approved}
            sub="Pending disbursal"
            icon={<FileTextOutlined style={{ fontSize: 20, color: '#096dd9' }} />}
            iconBg="#e6f4ff"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard
            loading={loading}
            label="Disbursed"
            value={disbursed}
            sub="Awaiting activation"
            icon={<DollarOutlined style={{ fontSize: 20, color: '#531dab' }} />}
            iconBg="#f9f0ff"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard
            loading={loading}
            label="Closed"
            value={loans.filter((l) => l.loanStatus === 'CLOSED').length}
            icon={<BankOutlined style={{ fontSize: 20, color: '#595959' }} />}
            iconBg="#f5f5f5"
          />
        </Col>
      </Row>

      {/* ── Row 2: Portfolio Health ──────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <KpiCard
            loading={loading}
            label="Active Loans"
            value={activeLoans}
            sub="Live portfolio"
            icon={<BankOutlined style={{ fontSize: 20, color: '#237804' }} />}
            iconBg="#f6ffed"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard
            loading={loading}
            label="Overdue Loans"
            value={overdueLoans}
            sub="Requires follow-up"
            trend="down"
            icon={<WarningOutlined style={{ fontSize: 20, color: '#cf1322' }} />}
            iconBg="#fff1f0"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard
            loading={loading}
            label="NPA Accounts"
            value={npaLoans}
            sub="DPD > 90"
            trend="down"
            icon={<ExclamationCircleOutlined style={{ fontSize: 20, color: '#fff' }} />}
            iconBg="#a8071a"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard
            loading={loading}
            label="Total AUM"
            value={formatCurrencyShort(totalAUM)}
            sub="Active + Overdue + NPA"
            icon={<DollarOutlined style={{ fontSize: 20, color: brand.primary }} />}
            iconBg="#e6f0ff"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard
            loading={loading}
            label="Total Overdue"
            value={formatCurrencyShort(totalOverdue)}
            sub="Overdue + NPA buckets"
            trend="down"
            icon={<WarningOutlined style={{ fontSize: 20, color: '#d46b08' }} />}
            iconBg="#fff7e6"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <KpiCard
            loading={loading}
            label="PAR Ratio"
            value={`${parRatio}%`}
            sub="Portfolio at risk"
            trend={parseFloat(parRatio) > 5 ? 'down' : undefined}
            icon={<RiseOutlined style={{ fontSize: 20, color: parseFloat(parRatio) > 5 ? '#cf1322' : '#52c41a' }} />}
            iconBg={parseFloat(parRatio) > 5 ? '#fff1f0' : '#f6ffed'}
          />
        </Col>
      </Row>

      {/* ── Row 3: Charts ────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Loan Status Distribution */}
        <Col xs={24} md={12}>
          <Card
            title="Loan Status Distribution"
            size="small"
            style={{ borderRadius: 10 }}
            loading={loading}
          >
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
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

        {/* DPD Bucket Analysis */}
        <Col xs={24} md={12}>
          <Card
            title="DPD Bucket Analysis (Active Portfolio)"
            size="small"
            style={{ borderRadius: 10 }}
            loading={loading}
          >
            {dpdChartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dpdChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <ReTooltip
                    formatter={(v) => [`${v} loans`, 'Count']}
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  />
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

      {/* ── Row 4: Recent Loans ──────────────────────────────────────────── */}
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
              locale={{ emptyText: 'No loans found' }}
            />
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Dashboard
