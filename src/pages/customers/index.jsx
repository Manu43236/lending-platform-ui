import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Select, Tag, Space, Row, Col, Tooltip } from 'antd'
import { PlusOutlined, SearchOutlined, WarningFilled } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import ConfirmModal from '../../components/ConfirmModal'
import { customerApi } from '../../api/customerApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { showError, showSuccess } from '../../utils/errorHandler'

const { Option } = Select

const employmentTag = (type) => {
  if (!type) return '—'
  return (
    <Tag color={type === 'SALARIED' ? 'blue' : 'purple'}>
      {type === 'SALARIED' ? 'Salaried' : 'Self Employed'}
    </Tag>
  )
}

// Credit score pill — color-coded by risk
const creditScoreBadge = (score) => {
  if (!score) return '—'
  const color = score >= 750 ? '#52c41a' : score >= 650 ? '#faad14' : '#f5222d'
  return (
    <span style={{
      background: color + '18', color, border: '1px solid ' + color + '44',
      borderRadius: 10, padding: '1px 8px', fontWeight: 600, fontSize: 12,
    }}>
      {score}
    </span>
  )
}

const Customers = () => {
  const navigate = useNavigate()

  const [customers, setCustomers] = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading] = useState(false)

  const [nameSearch, setNameSearch] = useState('')
  const [emailSearch, setEmailSearch] = useState('')
  const [empTypeFilter, setEmpTypeFilter] = useState(null)

  const [deactivating, setDeactivating] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState(null)

  const fetchCustomers = useCallback(async (page = 0, size = 10) => {
    setLoading(true)
    try {
      const res = await customerApi.getAll({
        page, size,
        ...(nameSearch && { name: nameSearch }),
        ...(emailSearch && { email: emailSearch }),
        ...(empTypeFilter && { employmentType: empTypeFilter }),
      })
      const data = res.data?.data
      setCustomers(data?.content || [])
      setPagination({ page: data?.page ?? 0, size: data?.size ?? size, totalElements: data?.totalElements ?? 0 })
    } catch (err) {
      showError(err, 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [nameSearch, emailSearch, empTypeFilter])

  useEffect(() => {
    fetchCustomers(0, 10)
  }, [nameSearch, emailSearch, empTypeFilter]) // eslint-disable-line

  const handleDeactivate = async () => {
    if (!deactivateTarget) return
    setDeactivating(true)
    try {
      await customerApi.deactivate(deactivateTarget.id)
      showSuccess(deactivateTarget.name + ' has been deactivated.')
      setDeactivateTarget(null)
      fetchCustomers(pagination.page, pagination.size)
    } catch (err) {
      showError(err, 'Deactivation Failed')
    } finally {
      setDeactivating(false)
    }
  }

  const columns = [
    {
      title: 'Customer No.',
      dataIndex: 'customerNumber',
      key: 'customerNumber',
      width: 150,
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#1B3A6B', fontWeight: 600 }}>{v}</span>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v, row) => (
        <Space direction="vertical" size={0}>
          <span
            style={{ color: '#1B3A6B', fontWeight: 500, cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); navigate('/customers/' + row.id) }}
          >
            {v}
          </span>
          <span style={{ fontSize: 11, color: '#999' }}>{row.phone}</span>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Employment',
      dataIndex: 'employmentType',
      key: 'employmentType',
      width: 140,
      render: employmentTag,
    },
    {
      title: 'Monthly Income',
      dataIndex: 'monthlySalary',
      key: 'monthlySalary',
      width: 140,
      align: 'right',
      render: (v) => formatCurrency(v, 0),
    },
    {
      title: 'Credit Score',
      dataIndex: 'creditScore',
      key: 'creditScore',
      width: 110,
      align: 'center',
      render: creditScoreBadge,
    },
    {
      title: 'Active Loans',
      key: 'loans',
      width: 110,
      align: 'center',
      render: (_, row) => (
        <Space size={4}>
          <Tag color={row.activeLoanCount > 0 ? 'blue' : 'default'}>
            {row.activeLoanCount ?? 0}
          </Tag>
          {row.hasOverdue && (
            <Tooltip title="Has overdue loans">
              <WarningFilled style={{ color: '#f5222d', fontSize: 13 }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Branch',
      dataIndex: 'homeBranchCode',
      key: 'homeBranchCode',
      width: 90,
      render: (v) => v ? <Tag>{v}</Tag> : '—',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (v) => v ? <Tag color="success">Active</Tag> : <Tag color="default">Inactive</Tag>,
    },
    {
      title: 'Onboarded',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 115,
      render: (v) => formatDate(v),
    },
  ]

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Manage customer profiles and KYC"
        breadcrumbs={[{ label: 'Customers' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/customers/new')}>
            New Customer
          </Button>
        }
      />

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Input
            placeholder="Search by name..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            allowClear value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Input
            placeholder="Search by email..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            allowClear value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Select placeholder="Employment type" allowClear style={{ width: '100%' }}
            value={empTypeFilter} onChange={setEmpTypeFilter}>
            <Option value="SALARIED">Salaried</Option>
            <Option value="SELF_EMPLOYED">Self Employed</Option>
          </Select>
        </Col>
      </Row>

      <DataTable
        columns={columns}
        dataSource={customers}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onPageChange={(page, size) => fetchCustomers(page, size)}
        onRow={(row) => ({ onClick: () => navigate('/customers/' + row.id), style: { cursor: 'pointer' } })}
        scroll={{ x: 1200 }}
      />

      <ConfirmModal
        open={!!deactivateTarget}
        title="Deactivate Customer"
        type="danger"
        message={'Are you sure you want to deactivate ' + deactivateTarget?.name + '?'}
        subMessage="This is a soft delete. The customer record will be retained but marked as inactive."
        confirmText="Deactivate"
        confirmDanger
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </>
  )
}

export default Customers
