import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authApi } from '../../api/authApi'
import useAuthStore from '../../store/authStore'
import { getErrorMessage } from '../../utils/errorHandler'
import finpulseLogo from '../../assets/finpuls-logo.png'

const slides = [
  {
    tag: 'Loan Origination',
    title: 'End-to-End Loan Lifecycle Management',
    desc: 'From the moment a customer applies to the day the loan is closed — every step is tracked, audited, and managed in one unified platform.',
    points: ['Instant loan application capture', 'Document collection & verification', 'Multi-level approval workflow'],
  },
  {
    tag: 'Credit Assessment',
    title: 'Automated Risk & Credit Evaluation',
    desc: 'Evaluate borrower risk in real time using DTI, FOIR, and credit score analysis. Categorise every loan into LOW, MEDIUM, or HIGH risk automatically.',
    points: ['FOIR capped at 50% for safe lending', 'Risk bands: LOW ≥750 · MEDIUM ≥650 · HIGH <650', 'Approval authority by loan size (L1→L4)'],
  },
  {
    tag: 'EMI & Repayments',
    title: 'Reducing Balance EMI Engine',
    desc: 'Calculate accurate EMIs using the reducing balance method. Every payment updates outstanding principal in real time.',
    points: ['Auto EMI schedule generation on disbursal', 'Part-payment & foreclosure supported', 'Live outstanding & interest tracking'],
  },
  {
    tag: 'Collections & DPD',
    title: 'Real-Time Overdue & NPA Monitoring',
    desc: 'The EOD engine runs every night at 11:59 PM IST, updating DPD buckets, penalty accruals, and NPA flags automatically — no manual intervention.',
    points: ['DPD buckets: 0 / 1–30 / 31–60 / 61–90 / 90+', 'Automated NPA classification', 'Penalty waiver workflow for collections teams'],
  },
  {
    tag: 'Disbursement',
    title: 'Seamless Loan Disbursement',
    desc: 'Once approved, disburse funds via NEFT, RTGS, IMPS, or Cheque. A mock payment gateway simulates real-world success/failure scenarios.',
    points: ['Mode: NEFT · RTGS · IMPS · Cheque', 'UTR / reference number captured', 'EMI schedule auto-generated post disbursal'],
  },
]

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length)
        setVisible(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

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

  const slide = slides[current]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fff', alignItems: 'center' }}>

      {/* Left 60% — Product intro */}
      <div style={{
        flex: '0 0 60%',
        position: 'relative',
        height: '100vh',
      }}>
        {/* Logo — absolutely pinned, never moves */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -180px)',
          textAlign: 'center',
        }}>
          <img src={finpulseLogo} alt="FinPulse" style={{ width: 220, objectFit: 'contain' }} />
        </div>

        {/* Slide content — absolutely pinned below logo, never affects logo position */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -20px)',
          width: 420,
        }}>
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}>
            {/* Tag */}
            <div style={{
              display: 'inline-block',
              background: '#EEF3FF',
              color: '#1B3A6B',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.2,
              padding: '4px 12px',
              borderRadius: 20,
              marginBottom: 16,
              textTransform: 'uppercase',
            }}>
              {slide.tag}
            </div>

            {/* Title */}
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', lineHeight: 1.35, margin: '0 0 12px' }}>
              {slide.title}
            </h2>

            {/* Description */}
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: '0 0 24px' }}>
              {slide.desc}
            </p>

            {/* Bullet points */}
            <div>
              {slide.points.map((pt) => (
                <div key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#1B3A6B', marginTop: 7, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, color: '#555' }}>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dot indicators — absolutely pinned at bottom */}
        <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => { setVisible(false); setTimeout(() => { setCurrent(i); setVisible(true) }, 400) }}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? '#1B3A6B' : '#ddd',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Center divider */}
      <div style={{
        flexShrink: 0,
        width: 1,
        height: '75vh',
        background: 'linear-gradient(to bottom, transparent, #4a9eff 20%, #1B3A6B 50%, #4a9eff 80%, transparent)',
        boxShadow: '0 0 8px 1px rgba(74,158,255,0.45)',
        borderRadius: 1,
      }} />

      {/* Right 40% — Login form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 48px',
        height: '100vh',
      }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#111', marginBottom: 4 }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: '#aaa', marginBottom: 32 }}>Sign in to your account to continue</p>

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
              label={<span style={{ fontWeight: 500, color: '#333', fontSize: 13 }}>Username</span>}
              name="username"
              rules={[{ required: true, message: 'Please enter your username' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bbb' }} />}
                placeholder="Enter your username"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500, color: '#333', fontSize: 13 }}>Password</span>}
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bbb' }} />}
                placeholder="Enter your password"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 46,
                  borderRadius: 8,
                  background: '#1B3A6B',
                  fontSize: 15,
                  fontWeight: 600,
                  border: 'none',
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>

    </div>
  )
}

export default Login
