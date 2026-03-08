import { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Timeline, Alert, Tag, Space, Divider, Statistic, Table } from 'antd'
import {
  PlayCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  ClockCircleOutlined,
  CalculatorOutlined,
  RiseOutlined,
  WarningOutlined,
  DollarOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import { eodApi } from '../../api/eodApi'
import { showError } from '../../utils/errorHandler'

// EOD steps definition
const EOD_STEPS = [
  {
    key: 'dpd',
    title: 'Calculate DPD',
    description: 'Calculate Days Past Due for all active loan EMIs',
    icon: <CalculatorOutlined />,
  },
  {
    key: 'status',
    title: 'Update Loan Statuses',
    description: 'Classify loans as ACTIVE / OVERDUE / NPA based on DPD',
    icon: <RiseOutlined />,
  },
  {
    key: 'penalty',
    title: 'Apply Late Penalties',
    description: 'Apply late payment fees on newly overdue EMIs (DPD = 1)',
    icon: <DollarOutlined />,
  },
  {
    key: 'complete',
    title: 'EOD Complete',
    description: 'All end-of-day tasks finished successfully',
    icon: <CheckSquareOutlined />,
  },
]

// Step status → color / icon
const stepIcon = (status, icon) => {
  if (status === 'done')    return <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
  if (status === 'running') return <LoadingOutlined   style={{ color: '#1890ff', fontSize: 18 }} spin />
  if (status === 'error')   return <CloseCircleFilled style={{ color: '#f5222d', fontSize: 18 }} />
  return <span style={{ color: '#bbb', fontSize: 18 }}>{icon}</span>
}

const stepColor = (status) => {
  if (status === 'done')    return 'green'
  if (status === 'running') return 'blue'
  if (status === 'error')   return 'red'
  return 'gray'
}

const EOD = () => {
  const [running, setRunning]           = useState(false)
  const [stepStatuses, setStepStatuses] = useState({})
  const [result, setResult]             = useState(null)
  const [resultMsg, setResultMsg]       = useState('')
  const [lastRun, setLastRun]           = useState(null)
  const [stats, setStats]               = useState(null)
  const [history, setHistory]           = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const delay = (ms) => new Promise((res) => setTimeout(res, ms))

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await eodApi.getHistory({ page: 0, size: 10 })
      const records = res.data?.data?.content || []
      setHistory(records)

      // Populate last run + stats from most recent successful run
      const lastSuccess = records.find((r) => r.status === 'SUCCESS')
      if (lastSuccess) {
        setLastRun(dayjs(lastSuccess.runDate + 'Z'))
        setStats({
          totalLoansProcessed:  lastSuccess.totalLoansProcessed,
          totalEmisProcessed:   lastSuccess.totalEmisProcessed,
          emisMarkedOverdue:    lastSuccess.emisMarkedOverdue,
          emisAlreadyPaid:      lastSuccess.emisAlreadyPaid,
          loansMarkedActive:    lastSuccess.loansMarkedActive,
          loansMarkedOverdue:   lastSuccess.loansMarkedOverdue,
          loansMarkedNpa:       lastSuccess.loansMarkedNpa,
          loansStayedDisbursed: lastSuccess.loansStayedDisbursed,
          penaltiesApplied:     lastSuccess.penaltiesApplied,
        })
      }
    } catch { /* silent */ }
    finally { setHistoryLoading(false) }
  }

  useEffect(() => { loadHistory() }, [])

  const runEod = async () => {
    setRunning(true)
    setResult(null)
    setResultMsg('')
    setStepStatuses({})
    setStats(null)

    // Animate steps while API call runs in background
    const stepKeys = EOD_STEPS.map((s) => s.key)

    // Mark first step as running immediately
    setStepStatuses({ [stepKeys[0]]: 'running' })

    // Start the actual API call
    const apiCall = eodApi.runNow()

    // Simulate step progression with delays (total ~3s animation)
    for (let i = 0; i < stepKeys.length - 1; i++) {
      await delay(900)
      setStepStatuses((prev) => ({
        ...prev,
        [stepKeys[i]]: 'done',
        [stepKeys[i + 1]]: 'running',
      }))
    }

    // Wait for actual API to finish
    try {
      const res = await apiCall
      // Backend returns HTTP 200 even on failure — check success flag
      if (res.data?.success === false) {
        throw new Error(res.data?.message || 'EOD processing failed')
      }
      // Mark last step done
      await delay(600)
      setStepStatuses(Object.fromEntries(stepKeys.map((k) => [k, 'done'])))
      setResult('success')
      setResultMsg('All EOD tasks completed successfully.')
      setLastRun(dayjs())
      setStats(res.data?.data)
      loadHistory()
    } catch (err) {
      // Mark current running step as error
      setStepStatuses((prev) => {
        const updated = { ...prev }
        const runningKey = Object.keys(updated).find((k) => updated[k] === 'running')
        if (runningKey) updated[runningKey] = 'error'
        return updated
      })
      setResult('error')
      setResultMsg(err?.message || err?.response?.data?.message || 'EOD processing failed. Check server logs.')
    } finally {
      setRunning(false)
    }
  }

  const timelineItems = EOD_STEPS.map((step) => {
    const status = stepStatuses[step.key] || 'pending'
    return {
      color: stepColor(status),
      dot: stepIcon(status, step.icon),
      children: (
        <div style={{ paddingBottom: 8 }}>
          <Space>
            <span style={{
              fontWeight: 600,
              color: status === 'done' ? '#52c41a' : status === 'running' ? '#1890ff' : status === 'error' ? '#f5222d' : '#888',
            }}>
              {step.title}
            </span>
            {status === 'running' && <Tag color="blue">Running...</Tag>}
            {status === 'done'    && <Tag color="success">Done</Tag>}
            {status === 'error'   && <Tag color="error">Failed</Tag>}
          </Space>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{step.description}</div>
        </div>
      ),
    }
  })

  return (
    <>
      <PageHeader
        title="End of Day Processing"
        subtitle="Daily batch — DPD calculation, loan status update, penalty application"
        breadcrumbs={[{ label: 'EOD' }]}
      />

      <Row gutter={[16, 16]}>

        {/* Left — Run EOD */}
        <Col xs={24} md={10}>
          <Card size="small" style={{ borderRadius: 10 }}>

            {/* Schedule info */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Scheduled Run</div>
              <Space>
                <ClockCircleOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontWeight: 600 }}>Every day at 11:59 PM IST</span>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Space>
                  <span style={{ fontSize: 12, color: '#888' }}>Last manual run:</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>
                    {lastRun ? lastRun.format('DD MMM YYYY, hh:mm A') : '—'}
                  </span>
                </Space>
              </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* What EOD does */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>This run will:</div>
              <Space direction="vertical" size={6}>
                <Space><CalculatorOutlined style={{ color: '#1890ff' }} /><span style={{ fontSize: 13 }}>Calculate DPD for all active loan EMIs</span></Space>
                <Space><RiseOutlined     style={{ color: '#722ed1' }} /><span style={{ fontSize: 13 }}>Update loan statuses (ACTIVE / OVERDUE / NPA)</span></Space>
                <Space><DollarOutlined   style={{ color: '#fa8c16' }} /><span style={{ fontSize: 13 }}>Apply late penalties on newly overdue EMIs</span></Space>
              </Space>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              loading={running}
              onClick={runEod}
              block
              style={{ height: 48, fontSize: 15, fontWeight: 600 }}
            >
              {running ? 'Processing EOD...' : 'Run EOD Now'}
            </Button>

            {result && (
              <Alert
                style={{ marginTop: 16, borderRadius: 8 }}
                type={result === 'success' ? 'success' : 'error'}
                showIcon
                message={result === 'success' ? 'EOD Successful' : 'EOD Failed'}
                description={resultMsg}
              />
            )}
          </Card>
        </Col>

        {/* Right — Steps tracker */}
        <Col xs={24} md={14}>
          <Card
            title="EOD Steps"
            size="small"
            style={{ borderRadius: 10 }}
          >
            {Object.keys(stepStatuses).length === 0 && !running ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#bbb' }}>
                <PlayCircleOutlined style={{ fontSize: 40, marginBottom: 12 }} />
                <div style={{ fontSize: 14 }}>Click "Run EOD Now" to start processing</div>
              </div>
            ) : (
              <Timeline style={{ marginTop: 16 }} items={timelineItems} />
            )}
          </Card>
        </Col>

      </Row>

      {/* History table */}
      <Card title="EOD Run History" size="small" style={{ borderRadius: 10, marginTop: 16 }}>
        <Table
          dataSource={history}
          rowKey="id"
          size="small"
          loading={historyLoading}
          pagination={{ pageSize: 10, size: 'small' }}
          locale={{ emptyText: 'No EOD runs recorded yet' }}
          columns={[
            {
              title: 'Run Date',
              dataIndex: 'runDate',
              key: 'runDate',
              render: (v) => v ? dayjs(v + 'Z').format('DD MMM YYYY, hh:mm A') : '—',
            },
            {
              title: 'Triggered By',
              dataIndex: 'triggeredBy',
              key: 'triggeredBy',
              render: (v) => <Tag color={v === 'SCHEDULER' ? 'blue' : 'purple'}>{v}</Tag>,
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (v) => <Tag color={v === 'SUCCESS' ? 'success' : 'error'}>{v}</Tag>,
            },
            { title: 'Loans',       dataIndex: 'totalLoansProcessed', key: 'loans',    align: 'center' },
            { title: 'EMIs',        dataIndex: 'totalEmisProcessed',  key: 'emis',     align: 'center' },
            { title: 'Overdue EMIs', dataIndex: 'emisMarkedOverdue',  key: 'overdue',  align: 'center', render: (v) => v > 0 ? <span style={{ color: '#fa8c16', fontWeight: 600 }}>{v}</span> : v },
            { title: 'NPA',         dataIndex: 'loansMarkedNpa',      key: 'npa',      align: 'center', render: (v) => v > 0 ? <span style={{ color: '#f5222d', fontWeight: 600 }}>{v}</span> : v },
            { title: 'Penalties',   dataIndex: 'penaltiesApplied',    key: 'penalties', align: 'center' },
            {
              title: 'Error',
              dataIndex: 'errorMessage',
              key: 'error',
              render: (v) => v ? <span style={{ color: '#f5222d', fontSize: 11 }}>{v}</span> : <span style={{ color: '#bbb' }}>—</span>,
            },
          ]}
        />
      </Card>

      {/* Stats — shown after successful EOD */}
      {stats && (
        <Card title="EOD Results" size="small" style={{ borderRadius: 10, marginTop: 16 }}>
          <Row gutter={[0, 24]}>

            {/* Step 1 stats */}
            <Col span={24}>
              <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Step 1 — DPD Calculation
              </div>
              <Row gutter={[16, 16]}>
                {[
                  { label: 'Loans Processed',  value: stats.totalLoansProcessed, color: '#1890ff' },
                  { label: 'EMIs Scanned',      value: stats.totalEmisProcessed,  color: '#722ed1' },
                  { label: 'EMIs Marked Overdue', value: stats.emisMarkedOverdue, color: '#fa8c16' },
                  { label: 'EMIs Already Paid', value: stats.emisAlreadyPaid,     color: '#52c41a' },
                ].map((s) => (
                  <Col key={s.label} xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 8, textAlign: 'center', border: '1px solid #f0f0f0' }}
                      bodyStyle={{ padding: '12px 8px' }}>
                      <Statistic value={s.value} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />
                      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{s.label}</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>

            {/* Step 2 stats */}
            <Col span={24}>
              <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Step 2 — Loan Status Updates
              </div>
              <Row gutter={[16, 16]}>
                {[
                  { label: 'Marked ACTIVE',    value: stats.loansMarkedActive,    color: '#52c41a' },
                  { label: 'Marked OVERDUE',   value: stats.loansMarkedOverdue,   color: '#fa8c16' },
                  { label: 'Marked NPA',        value: stats.loansMarkedNpa,       color: '#f5222d' },
                  { label: 'Stayed DISBURSED',  value: stats.loansStayedDisbursed, color: '#1890ff' },
                ].map((s) => (
                  <Col key={s.label} xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 8, textAlign: 'center', border: '1px solid #f0f0f0' }}
                      bodyStyle={{ padding: '12px 8px' }}>
                      <Statistic value={s.value} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />
                      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{s.label}</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>

            {/* Step 3 stats */}
            <Col span={24}>
              <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Step 3 — Penalty Application
              </div>
              <Row gutter={[16, 16]}>
                {[
                  { label: 'Penalties Applied', value: stats.penaltiesApplied,   color: '#cf1322' },
                ].map((s) => (
                  <Col key={s.label} xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 8, textAlign: 'center', border: '1px solid #f0f0f0' }}
                      bodyStyle={{ padding: '12px 8px' }}>
                      <Statistic value={s.value} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />
                      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{s.label}</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>

          </Row>
        </Card>
      )}
    </>
  )
}

export default EOD
