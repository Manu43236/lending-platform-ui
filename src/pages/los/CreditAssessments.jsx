import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Tag, Space, Row, Col, Select } from 'antd'
import { SearchOutlined, CheckCircleFilled, CloseCircleFilled, ClockCircleOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { loanApi } from '../../api/loanApi'
import { creditAssessmentApi } from '../../api/creditAssessmentApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

const RISK_COLORS = {
  LOW:    { color: '#389e0d', bg: '#f6ffed' },
  MEDIUM: { color: '#d46b08', bg: '#fff7e6' },
  HIGH:   { color: '#cf1322', bg: '#fff1f0' },
}

const REC_COLORS = {
  APPROVE:        { color: '#389e0d', bg: '#f6ffed' },
  MANUAL_REVIEW:  { color: '#d46b08', bg: '#fff7e6' },
  REJECT:         { color: '#cf1322', bg: '#fff1f0' },
}

const RiskTag = ({ risk }) => {
  const c = RISK_COLORS[risk] || { color: '#666', bg: '#f5f5f5' }
  return <Tag style={{ color: c.color, background: c.bg, border: 'none', fontWeight: 600, fontSize: 11 }}>{risk || '—'}</Tag>
}

const RecommendationTag = ({ rec }) => {
  const c = REC_COLORS[rec] || { color: '#666', bg: '#f5f5f5' }
  return <Tag style={{ color: c.color, background: c.bg, border: 'none', fontWeight: 600, fontSize: 11 }}>{rec?.replace(/_/g, ' ') || '—'}</Tag>
}

const CreditAssessments = () => {
  const navigate = useNavigate()
  const [loans, setLoans] = useState([])
  const [assessments, setAssessments] = useState({})  // loanNumber -> assessment
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading] = useState(false)
  const [recFilter, setRecFilter] = useState(null)
  const [search, setSearch] = useState('')

  const fetchLoans = useCallback(async (page = 0, size = 10) => {
    setLoading(true)
    try {
      const res = await loanApi.getAll({ page: 0, size: 500 })
      const all = (res.data?.data?.content || [])
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      const start = page * size
      const pageItems = all.slice(start, start + size)
      setLoans(pageItems)
      setPagination({ page, size, totalElements: all.length })

      // Fetch assessment for each visible loan
      const map = {}
      await Promise.allSettled(
        pageItems.map(async (loan) => {
          try {
            const r = await creditAssessmentApi.getByLoanNumber(loan.loanNumber)
            map[loan.loanNumber] = r.data?.data
          } catch {
            map[loan.loanNumber] = null
          }
        })
      )
      setAssessments(map)
    } catch (err) {
      showError(err, 'Failed to load credit assessments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLoans(0, 10) }, [fetchLoans])

  const filtered = loans.filter((l) => {
    const a = assessments[l.loanNumber]
    const matchSearch = !search || (
      l.loanNumber?.toLowerCase().includes(search.toLowerCase()) ||
      l.customerName?.toLowerCase().includes(search.toLowerCase())
    )
    const matchRec = !recFilter || a?.recommendation === recFilter
    return matchSearch && matchRec
  })

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
      title: 'Loan Amount',
      dataIndex: 'loanAmount',
      key: 'loanAmount',
      align: 'right',
      render: (v) => formatCurrency(v, 0),
    },
    {
      title: 'Credit Score',
      key: 'creditScore',
      align: 'center',
      render: (_, row) => {
        const a = assessments[row.loanNumber]
        if (!a) return <span style={{ color: '#bbb' }}>—</span>
        const score = a.creditScore
        const color = score >= 750 ? '#52c41a' : score >= 650 ? '#faad14' : '#f5222d'
        return <span style={{ fontWeight: 700, color }}>{score}</span>
      },
    },
    {
      title: 'FOIR',
      key: 'foir',
      align: 'center',
      render: (_, row) => {
        const a = assessments[row.loanNumber]
        if (!a) return <span style={{ color: '#bbb' }}>—</span>
        const color = a.foir <= 50 ? '#52c41a' : a.foir <= 60 ? '#faad14' : '#f5222d'
        return <span style={{ fontWeight: 600, color }}>{a.foir?.toFixed(1)}%</span>
      },
    },
    {
      title: 'Risk',
      key: 'risk',
      render: (_, row) => {
        const a = assessments[row.loanNumber]
        return a ? <RiskTag risk={a.riskCategory} /> : <span style={{ color: '#bbb' }}>—</span>
      },
    },
    {
      title: 'Eligible',
      key: 'eligible',
      align: 'center',
      render: (_, row) => {
        const a = assessments[row.loanNumber]
        if (!a) return <ClockCircleOutlined style={{ color: '#faad14' }} />
        return a.isEligible
          ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
          : <CloseCircleFilled style={{ color: '#f5222d', fontSize: 16 }} />
      },
    },
    {
      title: 'Recommendation',
      key: 'recommendation',
      render: (_, row) => {
        const a = assessments[row.loanNumber]
        return a ? <RecommendationTag rec={a.recommendation} /> : <Tag style={{ fontSize: 11 }}>PENDING</Tag>
      },
    },
    {
      title: 'Assessed On',
      key: 'assessedAt',
      render: (_, row) => {
        const a = assessments[row.loanNumber]
        return a
          ? <span style={{ fontSize: 12 }}>{formatDate(a.assessedAt)}</span>
          : <span style={{ color: '#faad14', fontSize: 12 }}>Awaiting</span>
      },
    },
    {
      title: 'Stage',
      dataIndex: 'loanStatusCode',
      key: 'loanStatusCode',
      render: (v) => {
        const colors = {
          INITIATED:        { color: '#d46b08', bg: '#fff7e6' },
          UNDER_ASSESSMENT: { color: '#096dd9', bg: '#e6f4ff' },
          MANUAL_REVIEW:    { color: '#531dab', bg: '#f9f0ff' },
          UNDER_REVIEW:     { color: '#389e0d', bg: '#f6ffed' },
          REJECTED:         { color: '#cf1322', bg: '#fff1f0' },
        }
        const s = colors[v] || { color: '#666', bg: '#f5f5f5' }
        return (
          <Tag style={{ fontSize: 11, color: s.color, background: s.bg, border: 'none', fontWeight: 600 }}>
            {v?.replace(/_/g, ' ')}
          </Tag>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Credit Assessments"
        subtitle="Work queue — loans pending credit evaluation and manual review"
      />

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
          <Select placeholder="Filter by recommendation" allowClear style={{ width: '100%' }}
            value={recFilter} onChange={setRecFilter}>
            <Select.Option value="APPROVE">Approve</Select.Option>
            <Select.Option value="MANUAL_REVIEW">Manual Review</Select.Option>
            <Select.Option value="REJECT">Reject</Select.Option>
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
          onClick: () => navigate('/los/applications/' + row.loanNumber + '?tab=assessment'),
          style: { cursor: 'pointer' },
        })}
      />
    </>
  )
}

export default CreditAssessments
