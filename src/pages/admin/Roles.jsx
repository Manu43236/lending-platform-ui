import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Statistic, Row, Col } from 'antd'
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import { masterApi } from '../../api/masterApi'
import { formatCurrency } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

const APPROVAL_LEVEL_LABEL = {
  1: 'L1 — Credit Manager',
  2: 'L2 — Branch Manager',
  3: 'L3 — Regional Manager',
  4: 'L4 — CCO',
}

const AdminRoles = () => {
  const [roles, setRoles]     = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await masterApi.getRoles()
      setRoles(res.data?.data || [])
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const boolIcon = (v) => v
    ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
    : <CloseCircleOutlined style={{ color: '#bbb' }} />

  const columns = [
    {
      title: 'Role Code',
      dataIndex: 'roleCode',
      key: 'roleCode',
      render: (v) => <Tag color="blue" style={{ fontFamily: 'monospace' }}>{v}</Tag>,
    },
    { title: 'Role Name',   dataIndex: 'roleName',    key: 'roleName' },
    { title: 'Description', dataIndex: 'description', key: 'description', render: (v) => <span style={{ fontSize: 12, color: '#666' }}>{v || '—'}</span> },
    {
      title: 'Approval Level',
      dataIndex: 'approvalLevel',
      key: 'approvalLevel',
      render: (v) => v ? <Tag color="purple">{APPROVAL_LEVEL_LABEL[v] || `L${v}`}</Tag> : '—',
    },
    {
      title: 'Max Approval',
      dataIndex: 'maxApprovalAmount',
      key: 'maxApprovalAmount',
      align: 'right',
      render: (v) => v ? formatCurrency(v) : '—',
    },
    {
      title: 'Can Approve',
      dataIndex: 'canApprove',
      key: 'canApprove',
      align: 'center',
      render: boolIcon,
    },
    {
      title: 'Can Recommend',
      dataIndex: 'canRecommend',
      key: 'canRecommend',
      align: 'center',
      render: boolIcon,
    },
    {
      title: 'Can Veto',
      dataIndex: 'canVeto',
      key: 'canVeto',
      align: 'center',
      render: boolIcon,
    },
  ]

  return (
    <>
      <PageHeader
        title="Role Management"
        subtitle="System roles and access control — approval levels and permissions"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Roles' }]}
        actions={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={load} loading={loading}>Refresh</Button>,
        ]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Statistic value={roles.length} valueStyle={{ color: '#1890ff', fontSize: 22, fontWeight: 700 }} />
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Total Roles</div>
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Statistic value={roles.filter(r => r.canApprove).length} valueStyle={{ color: '#52c41a', fontSize: 22, fontWeight: 700 }} />
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Approver Roles</div>
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Statistic value={roles.filter(r => r.approvalLevel).length} valueStyle={{ color: '#722ed1', fontSize: 22, fontWeight: 700 }} />
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Approval Levels</div>
          </Card>
        </Col>
      </Row>

      <Card size="small" style={{ borderRadius: 10 }}>
        <Table
          dataSource={roles}
          columns={columns}
          rowKey="id"
          size="small"
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'No roles found' }}
          scroll={{ x: 800 }}
        />
      </Card>
    </>
  )
}

export default AdminRoles
