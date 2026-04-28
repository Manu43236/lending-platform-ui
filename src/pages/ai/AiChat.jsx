import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Input, Typography, Space, Tag, Spin, Card, Alert,
} from 'antd'
import {
  SendOutlined,
  UserAddOutlined,
  FileTextOutlined,
  RobotOutlined,
  UserOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { aiApi } from '../../api/aiApi'
import { showError } from '../../utils/errorHandler'

const { Text, Title, Paragraph } = Typography

const AiChat = () => {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [sessionStatus, setSessionStatus] = useState('ACTIVE')
  const [createdCustomer, setCreatedCustomer] = useState(null)
  const [createdLoan, setCreatedLoan] = useState(null)
  const [options, setOptions] = useState([])
  const [hideInput, setHideInput] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    sendMessage(null, true)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (role, content, extra = {}) => {
    setMessages((prev) => [...prev, { role, content, ...extra, id: Date.now() + Math.random() }])
  }

  const sendMessage = async (text, isInit = false) => {
    if (loading) return
    if (!isInit && !text?.trim()) return

    if (text?.trim()) addMessage('user', text)
    setInputText('')
    setLoading(true)

    try {
      const res = await aiApi.chat(sessionId, text)
      const data = res.data?.data

      if (data?.sessionId) setSessionId(data.sessionId)
      if (data?.sessionStatus) setSessionStatus(data.sessionStatus)
      if (data?.reply) addMessage('assistant', data.reply)

      setOptions(data?.options || [])
      setHideInput(data?.hideInput || false)

      if (data?.createdCustomerId) {
        setCreatedCustomer({
          id: data.createdCustomerId,
          number: data.createdCustomerNumber,
          name: data.createdCustomerName,
          action: data.customerAction,
        })
      }

      if (data?.createdLoanId) {
        setCreatedLoan({
          id: data.createdLoanId,
          number: data.createdLoanNumber,
        })
      }

    } catch (err) {
      showError(err, 'Chat Error')
      addMessage('assistant', 'Sorry, something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = () => sendMessage(inputText)

  const handleOption = (option) => {
    setOptions([])
    setHideInput(false)
    sendMessage(option)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <RobotOutlined style={{ fontSize: 24, color: '#1B3A6B' }} />
        <div>
          <Title level={5} style={{ margin: 0, color: '#1B3A6B' }}>AI Onboarding Assistant</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Create customers and loans through conversation
          </Text>
        </div>
        <Tag color={sessionStatus === 'COMPLETED' ? 'success' : 'processing'} style={{ marginLeft: 'auto' }}>
          {sessionStatus}
        </Tag>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        background: '#f5f7fa',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={avatarStyle('#1B3A6B')}>
              <RobotOutlined style={{ color: '#fff', fontSize: 14 }} />
            </div>
            <div style={{ ...bubbleStyle('assistant'), padding: '12px 16px' }}>
              <Spin size="small" />
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>Thinking...</Text>
            </div>
          </div>
        )}

        {!loading && options.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 36 }}>
            {options.map((opt, i) => (
              <Button
                key={i}
                onClick={() => handleOption(opt)}
                style={{
                  borderRadius: 20,
                  borderColor: '#1B3A6B',
                  color: '#1B3A6B',
                  fontWeight: 500,
                  fontSize: 13,
                  height: 'auto',
                  padding: '6px 16px',
                  whiteSpace: 'normal',
                  textAlign: 'left',
                }}
                icon={<RightOutlined style={{ fontSize: 10 }} />}
              >
                {opt}
              </Button>
            ))}
          </div>
        )}

        {createdCustomer && (
          <SuccessCard
            icon={<UserAddOutlined />}
            title={createdCustomer.action === 'FOUND' ? 'Customer Found' : 'Customer Created'}
            lines={[
              `Name: ${createdCustomer.name}`,
              `Customer No: ${createdCustomer.number}`,
            ]}
            actionLabel="View Customer"
            onAction={() => navigate(`/customers/${createdCustomer.id}`)}
          />
        )}
        {createdLoan && (
          <SuccessCard
            icon={<FileTextOutlined />}
            title="Loan Application Created"
            lines={[`Loan No: ${createdLoan.number}`]}
            actionLabel="View Loan"
            onAction={() => navigate(`/los/applications/${createdLoan.number}`)}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: '16px 24px',
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
      }}>
        {!hideInput && (
        <Space.Compact style={{ width: '100%' }}>
          <Input.TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={loading || sessionStatus === 'COMPLETED'}
            style={{ borderRadius: '8px 0 0 8px' }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={loading || !inputText.trim() || sessionStatus === 'COMPLETED'}
            style={{
              height: 'auto',
              background: '#1B3A6B',
              borderColor: '#1B3A6B',
              borderRadius: '0 8px 8px 0',
            }}
          >
            Send
          </Button>
        </Space.Compact>
        )}
        {hideInput && options.length > 0 && (
          <div style={{ textAlign: 'center', color: '#aaa', fontSize: 12 }}>
            Please select an option above
          </div>
        )}

        {sessionStatus === 'COMPLETED' && (
          <Alert
            message="Session completed. Start a new conversation to create another customer."
            type="success"
            showIcon
            style={{ marginTop: 12 }}
            action={
              <Button size="small" onClick={() => window.location.reload()}>
                New Session
              </Button>
            }
          />
        )}
      </div>
    </div>
  )
}

// ── MessageBubble ────────────────────────────────────────────────────────────

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user'

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
      {!isUser && (
        <div style={avatarStyle('#1B3A6B')}>
          <RobotOutlined style={{ color: '#fff', fontSize: 14 }} />
        </div>
      )}
      <div style={{ ...bubbleStyle(msg.role), maxWidth: '70%' }}>
        <Paragraph style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>
          {msg.content}
        </Paragraph>
      </div>
      {isUser && (
        <div style={avatarStyle('#e6eaf3')}>
          <UserOutlined style={{ color: '#1B3A6B', fontSize: 14 }} />
        </div>
      )}
    </div>
  )
}

// ── SuccessCard ──────────────────────────────────────────────────────────────

const SuccessCard = ({ icon, title, lines, actionLabel, onAction }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
    <Card
      size="small"
      style={{ maxWidth: 320, border: '1px solid #52c41a', borderRadius: 8 }}
    >
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Space>
          <span style={{ color: '#52c41a', fontSize: 18 }}>{icon}</span>
          <Text strong style={{ color: '#52c41a' }}>{title}</Text>
        </Space>
        {lines.map((line, i) => <Text key={i} style={{ fontSize: 13 }}>{line}</Text>)}
        <Button type="link" onClick={onAction} style={{ padding: 0, height: 'auto', color: '#1B3A6B' }}>
          {actionLabel} →
        </Button>
      </Space>
    </Card>
  </div>
)

// ── Styles ───────────────────────────────────────────────────────────────────

const bubbleStyle = (role) => ({
  padding: '10px 14px',
  borderRadius: role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
  background: role === 'user' ? '#1B3A6B' : '#fff',
  color: role === 'user' ? '#fff' : '#333',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  border: role === 'user' ? 'none' : '1px solid #f0f0f0',
})

const avatarStyle = (bg) => ({
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
})

export default AiChat
