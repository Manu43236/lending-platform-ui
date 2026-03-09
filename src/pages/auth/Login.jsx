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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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

  /* ─── Mobile layout ─────────────────────────────────── */
  if (isMobile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#EEF2FF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <img src={finpulseLogo} alt="FinPulse" style={{ width: 160, objectFit: 'contain', marginBottom: 32 }} />

        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '32px 24px',
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 4px 24px rgba(27,58,107,0.08)',
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 4 }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: '#aaa', marginBottom: 24 }}>Sign in to your account to continue</p>

          {error && (
            <Alert message={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
          )}

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item
              label={<span style={{ fontWeight: 500, color: '#333', fontSize: 13 }}>Username</span>}
              name="username"
              rules={[{ required: true, message: 'Please enter your username' }]}
            >
              <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} placeholder="Enter your username" style={{ borderRadius: 8 }} />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500, color: '#333', fontSize: 13 }}>Password</span>}
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#bbb' }} />} placeholder="Enter your password" style={{ borderRadius: 8 }} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button type="primary" htmlType="submit" loading={loading} block
                style={{ height: 46, borderRadius: 8, background: '#1B3A6B', fontSize: 15, fontWeight: 600, border: 'none' }}>
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    )
  }

  /* ─── Desktop layout ─────────────────────────────────── */
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(to right, #EEF2FF 0%, #EEF2FF 40%, #ffffff 70%, #ffffff 100%)' }}>

      {/* Left 60% — Product intro */}
      <div style={{ flex: '0 0 60%', position: 'relative', height: '100vh', background: 'transparent' }}>

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

        {/* Slide content */}
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
            <div style={{
              display: 'inline-block',
              background: '#dde6ff',
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

            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', lineHeight: 1.35, margin: '0 0 12px' }}>
              {slide.title}
            </h2>

            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: '0 0 24px' }}>
              {slide.desc}
            </p>

            <div>
              {slide.points.map((pt) => (
                <div key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1B3A6B', marginTop: 7, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#555' }}>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => { setVisible(false); setTimeout(() => { setCurrent(i); setVisible(true) }, 400) }}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? '#1B3A6B' : '#c5d0f0',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Right 40% — Login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 48px', height: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#111', marginBottom: 4 }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: '#aaa', marginBottom: 32 }}>Sign in to your account to continue</p>

          {error && (
            <Alert message={error} type="error" showIcon style={{ marginBottom: 20, borderRadius: 8 }} />
          )}

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item
              label={<span style={{ fontWeight: 500, color: '#333', fontSize: 13 }}>Username</span>}
              name="username"
              rules={[{ required: true, message: 'Please enter your username' }]}
            >
              <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} placeholder="Enter your username" style={{ borderRadius: 8 }} />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500, color: '#333', fontSize: 13 }}>Password</span>}
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#bbb' }} />} placeholder="Enter your password" style={{ borderRadius: 8 }} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
              <Button type="primary" htmlType="submit" loading={loading} block
                style={{ height: 46, borderRadius: 8, background: '#1B3A6B', fontSize: 15, fontWeight: 600, border: 'none' }}>
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
