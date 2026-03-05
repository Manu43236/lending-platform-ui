import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Tag, Space, Row, Col, Select } from 'antd'
import { SearchOutlined, CheckCircleFilled, CloseCircleFilled, ClockCircleFilled } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { loanApi } from '../../api/loanApi'
import { approvalApi } from '../../api/approvalApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { loanStatusColors } from '../../theme/colors'
import { showError } from '../../utils/errorHandler'

const LoanStatusTag = ({ status }) => {
  const s = loanStatusColors[status] || loanStatusColors.INITIATED
  return (
    <Tag style={{ color: s.color, background: s.bg, border: '1px solid ' + s.border, fontSize: 11 }}>
      {status?.replace(/_/g, ' ')}
    </Tag>
  )
}

const APPROVAL_STATUSES = new Set(['UNDER_REVIEW', 'MANUAL_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'ACTIVE', 'OVERDUE', 'NPA', 'CLOSED'])

const Approvals = () => {
  const navigate = useNavigate()
  const [loans, setLoans] = useState([])
  const [histories, setHistories] = useState({}) // loanNumber -> latest approval
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [search, setSearch] = useState('')

  const fetchLoans = useCallback(async (page = 0, size = 10) => {
    setLoading(true)
    try {
      const res = await loanApi.getAll({ page: 0, size: 500 })
      const all = (res.data?.data?.content || [])
        .filter((l) => statusFilter ? l.loanStatusCode === statusFilter : APPROVAL_STATUSES.has(l.loanStatusCode))
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      const start = page * size
      const pageItems = all.slice(start, start + size)
      setLoans(pageItems)
      setPagination({ page, size, totalElements: all.length })

      // Fetch approval history for visible loans
      const histMap = {}
      await Promise.allSettled(
        pageItems.map(async (loan) => {
          try {
            const r = await approvalApi.getHistory(loan.loanNumber)
            const list = r.data?.data || []
            histMap[loan.loanNumber] = list[list.length - 1] || null
          } catch {
            histMap[loan.loanNumber] = null
          }
        })
      )
      setHistories(histMap)
    } catch (err) {
      showError(err, 'Failed to load approval queue')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchLoans(0, 10) }, [fetchLoans])

  const allStatuses = ACTION_STATUSES
  const filtered = search
    ? loans.filter((l) =>
        l.loanNumber?.toLowerCase().includes(search.toLowerCase()) ||
        l.customerName?.toLowerCase().includes(search.toLowerCase())
      )
    : loans

  const STAGE_CARDS = [
    { label: 'Pending Review', statuses: ['UNDER_REVIEW', 'MANUAL_REVIEW'],                          color: '#d46b08' },
    { label: 'Approved',       statuses: ['APPROVED', 'DISBURSED', 'ACTIVE', 'OVERDUE', 'NPA', 'CLOSED'], color: '#52c41a' },
    { label: 'Rejected',       statuses: ['REJECTED'],                                                color: '#f5222d' },
  ]

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
      render: (v) => <span style={{ fontWeight: 600 }}>{formatCurrency(v, 0)}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'loanStatusCode',
      key: 'loanStatusCode',
      render: (v) => <LoanStatusTag status={v} />,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, row) => {
        const h = histories[row.loanNumber]
        if (!h) return <ClockCircleFilled style={{ color: '#faad14', fontSize: 15 }} />
        if (h.action === 'APPROVE') return <CheckCircleFilled style={{ color: '#52c41a', fontSize: 15 }} />
        if (h.action === 'REJECT')  return <CloseCircleFilled  style={{ color: '#f5222d', fontSize: 15 }} />
        return <span style={{ color: '#bbb' }}>—</span>
      },
    },
    {
      title: 'Actioned By',
      key: 'approvedBy',
      render: (_, row) => {
        const h = histories[row.loanNumber]
        return h
          ? <Space direction="vertical" size={0}>
              <span style={{ fontWeight: 500 }}>{h.approvedByName}</span>
              <span style={{ fontSize: 11, color: '#999' }}>{h.roleCode?.replace(/_/g, ' ')}</span>
            </Space>
          : <span style={{ color: '#bbb' }}>Pending</span>
      },
    },
    {
      title: 'Action Date',
      key: 'actionDate',
      render: (_, row) => {
        const h = histories[row.loanNumber]
        return h ? formatDate(h.actionTakenAt) : <span style={{ color: '#bbb' }}>—</span>
      },
    },
    {
      title: 'Applied On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => formatDate(v),
    },
  ]

  return (
    <>
      <PageHeader
        title="Approvals / Rejections"
        subtitle="Loan approval queue — pending review, approved and rejected decisions"
        breadcrumbs={[{ label: 'LOS' }, { label: 'Approvals' }]}
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
          <Select placeholder="Status" allowClear style={{ width: '100%' }}
            value={statusFilter?.[0]} onChange={(v) => setStatusFilter(v ? [v] : null)}>
            <Select.Option value="UNDER_REVIEW">Under Review</Select.Option>
            <Select.Option value="MANUAL_REVIEW">Manual Review</Select.Option>
            <Select.Option value="APPROVED">Approved</Select.Option>
            <Select.Option value="REJECTED">Rejected</Select.Option>
            <Select.Option value="DISBURSED">Disbursed</Select.Option>
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

export default Approvals
