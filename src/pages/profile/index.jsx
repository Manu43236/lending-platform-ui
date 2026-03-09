import { useEffect, useState } from 'react'
import {
  Card, Form, Input, Button, Divider, Row, Col,
  Typography, Tag, Avatar, message, Spin,
} from 'antd'
import { UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons'
import { userApi } from '../../api/userApi'
import useAuthStore from '../../store/authStore'

const { Title, Text } = Typography

const Profile = () => {
  const { user, login, token } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await userApi.getMyProfile()
      setProfile(res.data.data)
      profileForm.setFieldsValue({
        fullName: res.data.data.fullName,
        email: res.data.data.email,
        phone: res.data.data.phone,
      })
    } catch {
      message.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (values) => {
    setSaving(true)
    try {
      const res = await userApi.updateMyProfile(values)
      const updated = res.data.data
      setProfile(updated)
      // Update localStorage user object so header reflects changes
      login(token, { ...user, fullName: updated.fullName, email: updated.email, phone: updated.phone })
      message.success('Profile updated successfully')
    } catch {
      message.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (values) => {
    setChangingPwd(true)
    try {
      await userApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      message.success('Password changed successfully')
      passwordForm.resetFields()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPwd(false)
    }
  }

  if (loading) return <Spin style={{ display: 'block', marginTop: 80 }} />

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 24 }}>My Profile</Title>

      {/* Profile Header Card */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" gutter={24}>
          <Col>
            <Avatar size={72} style={{ backgroundColor: '#1B3A6B', fontSize: 28 }} icon={<UserOutlined />} />
          </Col>
          <Col flex={1}>
            <Title level={5} style={{ margin: 0 }}>{profile?.fullName}</Title>
            <Text type="secondary">@{profile?.username}</Text>
            <br />
            <Text type="secondary">{profile?.employeeId} · {profile?.designation}</Text>
            <br />
            <div style={{ marginTop: 8 }}>
              {profile?.roles?.map((r) => (
                <Tag color="geekblue" key={r.roleCode}>{r.roleName}</Tag>
              ))}
              {profile?.branchCode && <Tag color="blue">{profile.branchCode}</Tag>}
            </div>
          </Col>
          <Col>
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Department</Text>
              <br />
              <Text strong>{profile?.department || '—'}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>Joined</Text>
              <Text strong>{profile?.joiningDate || '—'}</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Edit Profile */}
      <Card title="Edit Profile" style={{ marginBottom: 24 }}>
        <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Required' }]}>
                <Input />
              </Form.Item>
            </Col>
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
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Change Password */}
      <Card title="Change Password">
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Current Password" name="currentPassword" rules={[{ required: true, message: 'Required' }]}>
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="New Password" name="newPassword" rules={[{ required: true, min: 6, message: 'Min 6 characters' }]}>
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Confirm New Password"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Required' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value)
                        return Promise.resolve()
                      return Promise.reject(new Error('Passwords do not match'))
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" danger htmlType="submit" icon={<LockOutlined />} loading={changingPwd}>
              Change Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Profile
