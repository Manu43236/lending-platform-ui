import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, Typography, Alert, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authApi } from '../../api/authApi'
import useAuthStore from '../../store/authStore'
import { getErrorMessage } from '../../utils/errorHandler'
import finpulseLogo from '../../assets/finpuls-logo.png'

const { Title, Text } = Typography

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const onFinish = async (values) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.login(values)
      const data = res.data.data
      login(data.token, data)
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      style={{
        width: 420,
        borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: 'none',
      }}
      bodyStyle={{ padding: '40px' }}
    >
      {/* Logo & Title */}
      <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 32 }}>
        <img src={finpulseLogo} alt="FinPulse" style={{ height: 56, objectFit: 'contain' }} />
        <Title level={3} style={{ margin: '8px 0 0', color: '#1B3A6B' }}>FinPulse</Title>
        <Text type="secondary" style={{ fontSize: 12, letterSpacing: 1 }}>- The Lending Echosystem -</Text>
      </Space>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
        />
      )}

      <Form layout="vertical" onFinish={onFinish} size="large">
        <Form.Item
          name="username"
          rules={[{ required: true, message: 'Please enter your username' }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#bbb' }} />}
            placeholder="Username"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bbb' }} />}
            placeholder="Password"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{
              height: 44,
              borderRadius: 8,
              background: '#1B3A6B',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Sign In
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default Login
