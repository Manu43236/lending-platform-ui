import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Modal, Form, Input, Select,
  DatePicker, Space, Row, Col, Statistic, Tooltip,
} from 'antd'
import { PlusOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import { userApi } from '../../api/userApi'
import { masterApi } from '../../api/masterApi'
import { showError } from '../../utils/errorHandler'

const AdminUsers = () => {
  const [users, setUsers]           = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(false)
  const [page, setPage]             = useState(0)
  const [roles, setRoles]           = useState([])
  const [modalOpen, setModalOpen]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [rolesModal, setRolesModal] = useState({ open: false, user: null })
  const [selectedRoles, setSelectedRoles] = useState([])
  const [assigningSaving, setAssigningSaving] = useState(false)
  const [form] = Form.useForm()

  const load = async (p = 0) => {
    setLoading(true)
    try {
      const res = await userApi.getAll({ page: p, size: 10 })
      setUsers(res.data?.data?.content || [])
      setTotal(res.data?.data?.totalElements || 0)
      setPage(p)
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  const loadRoles = async () => {
    try {
      const res = await masterApi.getRoles()
      setRoles(res.data?.data || [])
    } catch { /* silent */ }
  }

  useEffect(() => { load(0); loadRoles() }, [])

  const handleCreate = async (values) => {
    setSaving(true)
    try {
      const payload = {
        ...values,
        joiningDate: values.joiningDate ? values.joiningDate.format('YYYY-MM-DD') : null,
        roleCodes: values.roleCodes || [],
      }
      await userApi.create(payload)
      setModalOpen(false)
      form.resetFields()
      load(0)
    } catch (err) { showError(err) }
    finally { setSaving(false) }
  }

  const handleAssignRoles = async () => {
    setAssigningSaving(true)
    try {
      await userApi.assignRoles(rolesModal.user.employeeId, { roleCodes: selectedRoles })
      setRolesModal({ open: false, user: null })
      load(page)
    } catch (err) { showError(err) }
    finally { setAssigningSaving(false) }
  }

  const handleRemoveRole = async (employeeId, roleCode) => {
    try {
      await userApi.removeRole(employeeId, roleCode)
      load(page)
    } catch (err) { showError(err) }
  }

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    { title: 'Full Name',   dataIndex: 'fullName',    key: 'fullName' },
    { title: 'Username',    dataIndex: 'username',    key: 'username',    render: (v) => <span style={{ color: '#888', fontSize: 12 }}>{v}</span> },
    { title: 'Email',       dataIndex: 'email',       key: 'email',       render: (v) => <span style={{ fontSize: 12 }}>{v}</span> },
    { title: 'Branch',      dataIndex: 'branchCode',  key: 'branchCode',  render: (v) => v ? <Tag>{v}</Tag> : '—' },
    { title: 'Designation', dataIndex: 'designation', key: 'designation', render: (v) => <span style={{ fontSize: 12 }}>{v || '—'}</span> },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roleList, record) => (
        <Space wrap size={2}>
          {(roleList || []).map(r => (
            <Tag
              key={r.roleCode}
              color="blue"
              closable
              onClose={(e) => { e.preventDefault(); handleRemoveRole(record.employeeId, r.roleCode) }}
              style={{ fontSize: 11 }}
            >
              {r.roleCode}
            </Tag>
          ))}
          <Tooltip title="Manage roles">
            <Button
              size="small"
              type="dashed"
              icon={<EditOutlined />}
              onClick={() => {
                setRolesModal({ open: true, user: record })
                setSelectedRoles((roleList || []).map(r => r.roleCode))
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v) => <Tag color={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag>,
    },
    { title: 'Joined', dataIndex: 'joiningDate', key: 'joiningDate', render: (v) => v || '—' },
  ]

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="System users, roles and branch assignments"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
        actions={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => load(0)} loading={loading}>Refresh</Button>,
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Create User</Button>,
        ]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { label: 'Total Users', value: total,                                  color: '#1890ff' },
          { label: 'Active',      value: users.filter(u => u.isActive).length,   color: '#52c41a' },
          { label: 'Inactive',    value: users.filter(u => !u.isActive).length,  color: '#bbb' },
        ].map(s => (
          <Col key={s.label} xs={8}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
              <Statistic value={s.value} valueStyle={{ color: s.color, fontSize: 22, fontWeight: 700 }} />
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card size="small" style={{ borderRadius: 10 }}>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          size="small"
          loading={loading}
          pagination={{ pageSize: 10, total, current: page + 1, size: 'small', onChange: (p) => load(p - 1) }}
          locale={{ emptyText: 'No users found' }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        title="Create User"
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        okText="Create"
        confirmLoading={saving}
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Employee ID" name="employeeId" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. EMP001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Required' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Required' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Required' }]}>
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Department" name="department">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Designation" name="designation">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Branch Code" name="branchCode">
                <Input placeholder="e.g. MUM001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Joining Date" name="joiningDate">
                <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Roles" name="roleCodes">
            <Select
              mode="multiple"
              placeholder="Select roles"
              options={roles.map(r => ({ value: r.roleCode, label: `${r.roleCode} — ${r.roleName || ''}` }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Roles Modal */}
      <Modal
        title={`Manage Roles — ${rolesModal.user?.fullName}`}
        open={rolesModal.open}
        onOk={handleAssignRoles}
        onCancel={() => setRolesModal({ open: false, user: null })}
        okText="Save Roles"
        confirmLoading={assigningSaving}
      >
        <Select
          mode="multiple"
          style={{ width: '100%', marginTop: 16 }}
          placeholder="Select roles to assign"
          value={selectedRoles}
          onChange={setSelectedRoles}
          options={roles.map(r => ({ value: r.roleCode, label: `${r.roleCode} — ${r.roleName || ''}` }))}
        />
      </Modal>
    </>
  )
}

export default AdminUsers
