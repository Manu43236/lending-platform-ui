import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Tag, Space, Row, Col, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { loanApi } from '../../api/loanApi'
import { disbursementApi } from '../../api/disbursementApi'
import { formatCurrency, formatDate, formatEnum } from '../../utils/formatters'
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

const DISB_STATUSES = new Set(['APPROVED', 'DISBURSED'])

const Disbursements = () => {
  const navigate = useNavigate()
  const [loans, setLoans] = useState([])
  const [disbMap, setDisbMap] = useState({}) // loanNumber -> disbursement
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [search, setSearch] = useState('')

  const fetchLoans = useCallback(async (page = 0, size = 10) => {
    setLoading(true)
    try {
      const res = await loanApi.getAll({ page: 0, size: 500 })
      const all = (res.data?.data?.content || [])
        .filter((l) => statusFilter ? l.loanStatusCode === statusFilter : DISB_STATUSES.has(l.loanStatusCode))
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      const start = page * size
      const pageItems = all.slice(start, start + size)
      setLoans(pageItems)
      setPagination({ page, size, totalElements: all.length })

      // Fetch disbursement details for visible loans
      const map = {}
      await Promise.allSettled(
        pageItems.map(async (loan) => {
          try {
            const r = await disbursementApi.getByLoan(loan.loanNumber)
            map[loan.loanNumber] = r.data?.data
          } catch {
            map[loan.loanNumber] = null
          }
        })
      )
      setDisbMap(map)
    } catch (err) {
      showError(err, 'Failed to load disbursements')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchLoans(0, 10) }, [fetchLoans])

  const filtered = search
    ? loans.filter((l) =>
        l.loanNumber?.toLowerCase().includes(search.toLowerCase()) ||
        l.customerName?.toLowerCase().includes(search.toLowerCase())
      )
    : loans

  const pendingCount   = loans.filter((l) => l.loanStatusCode === 'APPROVED').length
  const disbursedCount = loans.filter((l) => l.loanStatusCode === 'DISBURSED').length
  const totalDisbursed = Object.values(disbMap).reduce((s, d) => s + (d?.disbursementAmount || 0), 0)

  const SUMMARY = [
    { label: 'Pending Disbursal', value: pendingCount,                      color: '#d46b08', filter: 'APPROVED'  },
    { label: 'Disbursed',         value: disbursedCount,                     color: '#52c41a', filter: 'DISBURSED' },
    { label: 'Total Disbursed',   value: formatCurrency(totalDisbursed, 0), color: '#1890ff', filter: null        },
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
      render: (v) => formatCurrency(v, 0),
    },
    {
      title: 'Disb. Amount',
      key: 'disbAmount',
      align: 'right',
      render: (_, row) => {
        const d = disbMap[row.loanNumber]
        return d
          ? <span style={{ fontWeight: 600, color: '#52c41a' }}>{formatCurrency(d.disbursementAmount, 0)}</span>
          : <span style={{ color: '#bbb' }}>Pending</span>
      },
    },
    {
      title: 'Mode',
      key: 'mode',
      render: (_, row) => {
        const d = disbMap[row.loanNumber]
        return d ? <Tag>{formatEnum(d.disbursementMode)}</Tag> : <span style={{ color: '#bbb' }}>—</span>
      },
    },
    {
      title: 'Disb. No.',
      key: 'disbNo',
      render: (_, row) => {
        const d = disbMap[row.loanNumber]
        return d
          ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{d.disbursementNumber}</span>
          : <span style={{ color: '#bbb' }}>—</span>
      },
    },
    {
      title: 'Disbursed On',
      key: 'disbDate',
      render: (_, row) => {
        const d = disbMap[row.loanNumber]
        return d ? formatDate(d.disbursedAt || d.createdAt) : <span style={{ color: '#bbb' }}>—</span>
      },
    },
    {
      title: 'Status',
      dataIndex: 'loanStatusCode',
      key: 'loanStatusCode',
      render: (v) => <LoanStatusTag status={v} />,
    },
  ]

  return (
    <>
      <PageHeader
        title="Disbursements"
        subtitle="Approved loans pending disbursement and completed disbursements"
        breadcrumbs={[{ label: 'LOS' }, { label: 'Disbursements' }]}
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
            value={statusFilter} onChange={setStatusFilter}>
            <Select.Option value="APPROVED">Pending Disbursal</Select.Option>
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

export default Disbursements
