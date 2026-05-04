import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Typography, Spin, Space, Tooltip } from 'antd'
import {
  RobotOutlined, SendOutlined, CloseOutlined, UserOutlined, RightOutlined,
} from '@ant-design/icons'
import { aiApi } from '../api/aiApi'
import useAuthStore from '../store/authStore'
import { ROLES } from '../utils/constants'

const { Text, Paragraph } = Typography

// ── Main widget (role-gated) ─────────────────────────────────────────────────

const AiChatWidget = ({ context = 'customer' }) => {
  const { user } = useAuthStore()
  const userRoles = user?.roles?.map((r) => r.roleCode) || []
  const canUse = userRoles.includes(ROLES.LOAN_OFFICER) || userRoles.includes(ROLES.ADMIN)
  if (!canUse) return null
  return <WidgetInner context={context} />
}

const WidgetInner = ({ context }) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
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
  const initialized = useRef(false)

  // Init session when first opened
  useEffect(() => {
    if (open && !initialized.current) {
      initialized.current = true
      const initMsg = context === 'loan' ? 'Hi, I want to create a loan application' : null
      sendMessage(initMsg, true)
    }
  }, [open])

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const addMessage = (role, content) =>
    setMessages((prev) => [...prev, { role, content, id: Date.now() + Math.random() }])

  const sendMessage = async (text, isInit = false) => {
    if (loading) return
    if (!isInit && !text?.trim()) return

    setOptions([])
    setHideInput(false)
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
        setCreatedLoan({ id: data.createdLoanId, number: data.createdLoanNumber })
      }
    } catch {
      addMessage('assistant', 'Sorry, something went wrong. Please try again.')
      setOptions([])
      setHideInput(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = () => { if (inputText.trim()) sendMessage(inputText) }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleOption = (opt) => {
    setOptions([])
    setHideInput(false)
    sendMessage(opt)
  }

  const handleNewSession = () => {
    setMessages([])
    setSessionId(null)
    setSessionStatus('ACTIVE')
    setCreatedCustomer(null)
    setCreatedLoan(null)
    setOptions([])
    setHideInput(false)
    initialized.current = false
    setTimeout(() => {
      initialized.current = true
      const initMsg = context === 'loan' ? 'Hi, I want to create a loan application' : null
      sendMessage(initMsg, true)
    }, 0)
  }

  const isDone = sessionStatus === 'COMPLETED'

  return (
    <>
      {/* Floating button */}
      <Tooltip title="AI Assistant" placement="left">
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 1001,
            width: 52, height: 52, borderRadius: '50%',
            background: open ? '#0d2347' : '#1B3A6B',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          {open
            ? <CloseOutlined style={{ color: '#fff', fontSize: 18 }} />
            : <RobotOutlined style={{ color: '#fff', fontSize: 22 }} />}
        </button>
      </Tooltip>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24,
          width: 380, height: 560,
          background: '#fff', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          zIndex: 1000,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', border: '1px solid #dde2ee',
        }}>
          {/* Header */}
          <div style={{
            background: '#1B3A6B', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <RobotOutlined style={{ color: '#fff', fontSize: 18 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text strong style={{ color: '#fff', fontSize: 14, display: 'block' }}>AI Assistant</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                Loan onboarding assistant
              </Text>
            </div>
            <div style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 10,
              background: isDone ? '#52c41a22' : '#1890ff22',
              color: isDone ? '#52c41a' : '#91caff',
              border: `1px solid ${isDone ? '#52c41a55' : '#1890ff55'}`,
            }}>
              {isDone ? 'DONE' : 'ACTIVE'}
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px',
            background: '#f5f7fa', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {messages.map((msg) => <WidgetBubble key={msg.id} msg={msg} />)}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={avatarStyle('#1B3A6B')}>
                  <RobotOutlined style={{ color: '#fff', fontSize: 11 }} />
                </div>
                <div style={{ ...bubbleStyle('assistant'), padding: '8px 12px' }}>
                  <Spin size="small" />
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>Thinking…</Text>
                </div>
              </div>
            )}

            {createdCustomer && (
              <SuccessCard
                title={createdCustomer.action === 'FOUND' ? 'Customer Found' : 'Customer Created'}
                lines={[createdCustomer.name, createdCustomer.number]}
                actionLabel="View Customer"
                onAction={() => { navigate(`/customers/${createdCustomer.id}`); setOpen(false) }}
              />
            )}
            {createdLoan && (
              <SuccessCard
                title="Loan Application Created"
                lines={[createdLoan.number]}
                actionLabel="View Loan"
                onAction={() => { navigate(`/los/applications/${createdLoan.number}`); setOpen(false) }}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Options */}
          {!loading && options.length > 0 && (
            <div style={{
              padding: '8px 12px 4px',
              background: '#fff',
              borderTop: '1px solid #f0f0f0',
              display: 'flex', flexWrap: 'wrap', gap: 6,
            }}>
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleOption(opt)}
                  disabled={loading}
                  style={{
                    padding: '5px 12px', borderRadius: 16,
                    border: '1px solid #1B3A6B', background: '#fff',
                    color: '#1B3A6B', fontSize: 12, cursor: 'pointer',
                    fontWeight: 500, transition: 'all 0.15s',
                    opacity: loading ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1B3A6B'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1B3A6B' }}
                >
                  <RightOutlined style={{ fontSize: 9 }} />
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '8px 12px 10px',
            borderTop: options.length > 0 ? 'none' : '1px solid #f0f0f0',
            background: '#fff', flexShrink: 0,
          }}>
            {isDone ? (
              <div style={{ textAlign: 'center' }}>
                <Button size="small" type="primary" ghost onClick={handleNewSession}>
                  Start New Session
                </Button>
              </div>
            ) : hideInput && options.length > 0 ? (
              <div style={{ textAlign: 'center', color: '#aaa', fontSize: 11 }}>
                Please select an option above
              </div>
            ) : (
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  disabled={loading}
                  style={{ borderRadius: '6px 0 0 6px', fontSize: 13 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined style={{ color: '#fff' }} />}
                  onClick={handleSend}
                  disabled={loading || !inputText.trim()}
                  style={{ background: '#1B3A6B', borderColor: '#1B3A6B', borderRadius: '0 6px 6px 0' }}
                />
              </Space.Compact>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ── Message bubble ───────────────────────────────────────────────────────────

const WidgetBubble = ({ msg }) => {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      gap: 6, alignItems: 'flex-end',
    }}>
      {!isUser && (
        <div style={avatarStyle('#1B3A6B')}>
          <RobotOutlined style={{ color: '#fff', fontSize: 11 }} />
        </div>
      )}
      <div style={{ ...bubbleStyle(msg.role), maxWidth: '80%' }}>
        <Paragraph style={{ margin: 0, fontSize: 13, whiteSpace: 'pre-wrap', color: 'inherit' }}>
          {msg.content}
        </Paragraph>
      </div>
      {isUser && (
        <div style={avatarStyle('#e6eaf3')}>
          <UserOutlined style={{ color: '#1B3A6B', fontSize: 11 }} />
        </div>
      )}
    </div>
  )
}

// ── Success card ─────────────────────────────────────────────────────────────

const SuccessCard = ({ title, lines, actionLabel, onAction }) => (
  <div style={{
    background: '#f6ffed', border: '1px solid #b7eb8f',
    borderRadius: 8, padding: '10px 12px',
  }}>
    <Text strong style={{ color: '#389e0d', fontSize: 12 }}>✓ {title}</Text>
    {lines.map((l, i) => (
      <div key={i} style={{ color: '#555', fontSize: 12, marginTop: 2 }}>{l}</div>
    ))}
    <Button
      type="link" size="small" onClick={onAction}
      style={{ padding: 0, height: 'auto', color: '#1B3A6B', marginTop: 4, fontSize: 12 }}
    >
      {actionLabel} →
    </Button>
  </div>
)

// ── Styles ───────────────────────────────────────────────────────────────────

const bubbleStyle = (role) => ({
  padding: '8px 12px',
  borderRadius: role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
  background: role === 'user' ? '#1B3A6B' : '#fff',
  color: role === 'user' ? '#fff' : '#333',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  border: role === 'user' ? 'none' : '1px solid #f0f0f0',
})

const avatarStyle = (bg) => ({
  width: 24, height: 24, borderRadius: '50%', background: bg,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
})

export default AiChatWidget
