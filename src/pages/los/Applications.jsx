import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Select, Tag, Space, Row, Col, Card } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { loanApi } from '../../api/loanApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { loanStatusColors } from '../../theme/colors'
import { showError } from '../../utils/errorHandler'

const { Option } = Select

// Status pipeline groups
const PIPELINE_STAGES = [
  { label: 'Initiated',    statuses: ['INITIATED'],                              color: '#595959', bg: '#f5f5f5' },
  { label: 'Assessment',  statuses: ['UNDER_ASSESSMENT','UNDER_REVIEW','MANUAL_REVIEW'], color: '#d46b08', bg: '#fff7e6' },
  { label: 'Docs Pending',statuses: ['DOCUMENTS_PENDING'],                       color: '#d46b08', bg: '#fff7e6' },
  { label: 'Docs Verified',statuses: ['DOCUMENTS_VERIFIED'],                     color: '#389e0d', bg: '#f6ffed' },
  { label: 'Approved',    statuses: ['APPROVED'],                                color: '#096dd9', bg: '#e6f4ff' },
  { label: 'Disbursed',   statuses: ['DISBURSED'],                               color: '#531dab', bg: '#f9f0ff' },
  { label: 'Rejected',    statuses: ['REJECTED'],                                color: '#434343', bg: '#f0f0f0' },
]

const STATUS_OPTIONS = [
  'INITIATED','UNDER_ASSESSMENT','UNDER_REVIEW','MANUAL_REVIEW',
  'DOCUMENTS_PENDING','DOCUMENTS_VERIFIED','APPROVED','DISBURSED','REJECTED',
]

const LoanStatusTag = ({ status }) => {
  const s = loanStatusColors[status] || loanStatusColors.INITIATED
  return (
    <Tag style={{ color: s.color, background: s.bg, border: '1px solid ' + s.border, fontSize: 11 }}>
      {status?.replace(/_/g, ' ')}
    </Tag>
  )
}

const Applications = () => {
  const navigate = useNavigate()
  const [loans, setLoans] = useState([])
  const [allLoans, setAllLoans] = useState([])   // for pipeline counts
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [loanTypeFilter, setLoanTypeFilter] = useState(null)
  const [search, setSearch] = useState('')

  // fetch pipeline counts once on mount
  useEffect(() => {
    loanApi.getAll({ page: 0, size: 500 })
      .then((r) => setAllLoans(r.data?.data?.content || []))
      .catch(() => {})
  }, [])

  const fetchLoans = useCallback(async (page = 0, size = 10) => {
    setLoading(true)
    try {
      const res = await loanApi.getAll({
        page, size,
        ...(statusFilter && { status: statusFilter }),
        ...(loanTypeFilter && { loanTypeCode: loanTypeFilter }),
      })
      const data = res.data?.data
      setLoans(data?.content || [])
      setPagination({ page: data?.page ?? 0, size: data?.size ?? size, totalElements: data?.totalElements ?? 0 })
    } catch (err) {
      showError(err, 'Failed to load loan applications')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, loanTypeFilter])

  useEffect(() => {
    fetchLoans(0, 10)
  }, [statusFilter, loanTypeFilter]) // eslint-disable-line

  // counts per pipeline stage (from allLoans)
  const stageCounts = PIPELINE_STAGES.map((s) => ({
    ...s,
    count: allLoans.filter((l) => s.statuses.includes(l.loanStatusCode)).length,
  }))

  // client-side search filter (loan number / customer name)
  const filtered = search
    ? loans.filter((l) =>
        l.loanNumber?.toLowerCase().includes(search.toLowerCase()) ||
        l.customerName?.toLowerCase().includes(search.toLowerCase())
      )
    : loans

  const columns = [
    {
      title: 'Loan No.',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      width: 160,
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#1B3A6B', fontWeight: 600 }}>{v}</span>
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
      title: 'Loan Type',
      dataIndex: 'loanTypeName',
      key: 'loanTypeName',
      render: (v) => v || '—',
    },
    {
      title: 'Purpose',
      dataIndex: 'loanPurposeName',
      key: 'loanPurposeName',
      ellipsis: true,
      render: (v) => v || '—',
    },
    {
      title: 'Loan Amount',
      dataIndex: 'loanAmount',
      key: 'loanAmount',
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
      title: 'Tenure',
      dataIndex: 'tenureMonths',
      key: 'tenureMonths',
      width: 80,
      align: 'center',
      render: (v) => v ? v + ' mo' : '—',
    },
    {
      title: 'Status',
      dataIndex: 'loanStatusCode',
      key: 'loanStatusCode',
      render: (v) => <LoanStatusTag status={v} />,
    },
    {
      title: 'Applied On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 115,
      render: (v) => formatDate(v),
    },
  ]

  return (
    <>
      <PageHeader
        title="Loan Applications"
        subtitle="Full lifecycle view — from initiation to disbursement"
        breadcrumbs={[{ label: 'LOS' }, { label: 'Applications' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/los/applications/new')}>
            New Application
          </Button>
        }
      />

      {/* Pipeline stage count cards */}
      <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
        {stageCounts.map((s) => (
          <Col key={s.label} xs={12} sm={8} md={3}>
            <Card
              size="small"
              hoverable
              onClick={() => setStatusFilter(s.statuses[0] === statusFilter ? null : s.statuses[0])}
              style={{
                borderRadius: 8, textAlign: 'center', cursor: 'pointer',
                border: statusFilter && s.statuses.includes(statusFilter)
                  ? '2px solid ' + s.color
                  : '1px solid #f0f0f0',
              }}
              bodyStyle={{ padding: '8px 4px' }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Input
            placeholder="Search loan no. or customer..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            allowClear value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={8} md={5}>
          <Select placeholder="Filter by status" allowClear style={{ width: '100%' }}
            value={statusFilter} onChange={setStatusFilter}>
            {STATUS_OPTIONS.map((s) => (
              <Option key={s} value={s}>{s.replace(/_/g, ' ')}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      <DataTable
        columns={columns}
        dataSource={filtered}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onPageChange={(page, size) => fetchLoans(page, size)}
        onRow={(row) => ({
          onClick: () => navigate('/los/applications/' + row.loanNumber),
          style: { cursor: 'pointer' },
        })}
        scroll={{ x: 1100 }}
      />
    </>
  )
}

export default Applications
