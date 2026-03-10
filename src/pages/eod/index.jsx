import { useState, useEffect, useRef } from 'react'
import {
  Row, Col, Card, Button, Tag, Space, Divider, Table, Progress, Statistic, Tooltip, Badge
} from 'antd'
import {
  PlayCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  CalculatorOutlined,
  PercentageOutlined,
  CreditCardOutlined,
  AlertOutlined,
  AuditOutlined,
  FileProtectOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import { eodApi } from '../../api/eodApi'

const PHASE_ICONS = {
  1:  <SafetyOutlined />,
  2:  <CalculatorOutlined />,
  3:  <PercentageOutlined />,
  4:  <CreditCardOutlined />,
  5:  <AlertOutlined />,
  6:  <AuditOutlined />,
  7:  <FileProtectOutlined />,
  8:  <BarChartOutlined />,
  9:  <DatabaseOutlined />,
  10: <CalendarOutlined />,
  11: <CheckSquareOutlined />,
}

const STATUS_COLOR = {
  PENDING:   '#d9d9d9',
  RUNNING:   '#1890ff',
  COMPLETED: '#52c41a',
  FAILED:    '#f5222d',
  SKIPPED:   '#faad14',
}

const PhaseCard = ({ phase }) => {
  const isRunning   = phase.status === 'RUNNING'
  const isCompleted = phase.status === 'COMPLETED'
  const isFailed    = phase.status === 'FAILED'
  const isPending   = phase.status === 'PENDING'

  const borderColor = STATUS_COLOR[phase.status] || '#d9d9d9'

  return (
    <Card
      size="small"
      style={{
        borderRadius: 8,
        border: `1.5px solid ${borderColor}`,
        background: isRunning ? '#e6f7ff' : isFailed ? '#fff2f0' : isCompleted ? '#f6ffed' : '#fafafa',
        transition: 'all 0.3s',
      }}
      bodyStyle={{ padding: '10px 12px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Phase number + status icon */}
        <div style={{ minWidth: 32, textAlign: 'center' }}>
          {isRunning   && <LoadingOutlined spin style={{ color: '#1890ff', fontSize: 18 }} />}
          {isCompleted && <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />}
          {isFailed    && <CloseCircleFilled style={{ color: '#f5222d', fontSize: 18 }} />}
          {isPending   && <span style={{ color: '#bbb', fontSize: 16 }}>{PHASE_ICONS[phase.phaseNumber]}</span>}
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>P{phase.phaseNumber}</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontWeight: 600, fontSize: 13,
              color: isRunning ? '#1890ff' : isFailed ? '#f5222d' : isCompleted ? '#389e0d' : '#888',
            }}>
              {phase.phaseName}
            </span>
            <Space size={4}>
              {phase.durationSeconds != null && isCompleted && (
                <span style={{ fontSize: 11, color: '#aaa' }}>{phase.durationSeconds}s</span>
              )}
              {isRunning   && <Tag color="blue"   style={{ margin: 0, fontSize: 11 }}>Running</Tag>}
              {isCompleted && <Tag color="success" style={{ margin: 0, fontSize: 11 }}>Done</Tag>}
              {isFailed    && <Tag color="error"   style={{ margin: 0, fontSize: 11 }}>Failed</Tag>}
              {isPending   && <Tag            style={{ margin: 0, fontSize: 11 }}>Pending</Tag>}
            </Space>
          </div>

          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{phase.description}</div>

          {/* Metrics */}
          {isCompleted && phase.metrics && Object.keys(phase.metrics).length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(phase.metrics)
                .filter(([k]) => !['reportDate', 'businessDate', 'cutoffTime', 'dateRolloverStatus',
                  'archivalStatus', 'rbiReportStatus', 'cibilUploadStatus', 'eodCompletionStatus',
                  'statusDistribution', 'branchWiseLoans'].includes(k))
                .slice(0, 5)
                .map(([key, val]) => (
                  <Tooltip key={key} title={key.replace(/_/g, ' ')}>
                    <Tag style={{ margin: 0, fontSize: 11, cursor: 'default' }}>
                      {formatMetricKey(key)}: <b>{formatMetricVal(val)}</b>
                    </Tag>
                  </Tooltip>
                ))}
            </div>
          )}

          {isFailed && phase.error && (
            <div style={{ fontSize: 11, color: '#f5222d', marginTop: 4 }}>{phase.error}</div>
          )}
        </div>
      </div>
    </Card>
  )
}

const formatMetricKey = (key) => {
  const MAP = {
    totalLoansProcessed: 'Loans',
    totalEmisProcessed: 'EMIs',
    emisMarkedOverdue: 'Overdue',
    emisAlreadyPaid: 'Paid',
    loansMarkedActive: 'Active',
    loansMarkedNpa: 'NPA',
    penaltiesApplied: 'Penalties',
    totalDailyInterestAccrued: 'Interest',
    mandatesPresented: 'NACH',
    successCount: 'Success',
    bounceCount: 'Bounced',
    totalCollected: 'Collected',
    customersAlerted: 'Alerted',
    totalOverdueLoans: 'Overdue',
    loansProvisioned: 'Provisioned',
    totalProvisionAmount: 'Provision',
    glEntriesGenerated: 'GL Entries',
    npaRatioPct: 'NPA%',
    cibilRecordsQueued: 'CIBIL',
    reportsGenerated: 'Reports',
    archivableLoansIdentified: 'Archivable',
    emisDueTomorrow: 'Due Tomorrow',
    expectedCollectionAmount: 'Exp. Collection',
    reconciliationPassed: 'Reconciled',
    totalLoansVerified: 'Verified',
    dbStatus: 'DB',
    alreadyRanToday: 'Ran Today',
  }
  return MAP[key] || key
}

const formatMetricVal = (val) => {
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (typeof val === 'number') {
    if (val > 1000) return '₹' + Math.round(val).toLocaleString()
    return val
  }
  return String(val)
}

const EOD = () => {
  const [jobStatus, setJobStatus]       = useState(null)
  const [history, setHistory]           = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [starting, setStarting]         = useState(false)
  const pollingRef = useRef(null)

  const isRunning = jobStatus?.status === 'RUNNING'
  const totalPhases = jobStatus?.phases?.length || 11
  const completedPhases = jobStatus?.phases?.filter(p => p.status === 'COMPLETED').length || 0
  const progressPct = isRunning ? Math.round((completedPhases / totalPhases) * 100) : 0

  const startPolling = () => {
    if (pollingRef.current) return
    pollingRef.current = setInterval(async () => {
      try {
        const res = await eodApi.getStatus()
        const status = res.data?.data
        setJobStatus(status)
        if (status?.status !== 'RUNNING') {
          stopPolling()
          if (status?.status === 'COMPLETED' || status?.status === 'FAILED') {
            loadHistory()
          }
        }
      } catch { /* silent */ }
    }, 2000)
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  useEffect(() => {
    loadStatus()
    loadHistory()
    return () => stopPolling()
  }, [])

  const loadStatus = async () => {
    try {
      const res = await eodApi.getStatus()
      const status = res.data?.data
      setJobStatus(status)
      if (status?.status === 'RUNNING') startPolling()
    } catch { /* silent */ }
  }

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await eodApi.getHistory({ page: 0, size: 10 })
      setHistory(res.data?.data?.content || [])
    } catch { /* silent */ }
    finally { setHistoryLoading(false) }
  }

  const runEod = async () => {
    setStarting(true)
    try {
      const res = await eodApi.runNow()
      if (res.data?.success === false) throw new Error(res.data?.message)
      // Start polling immediately
      const initial = res.data?.data
      setJobStatus(initial)
      startPolling()
    } catch (err) {
      // Error handled by interceptor
    } finally {
      setStarting(false)
    }
  }

  const lastSuccess = history.find(h => h.status === 'SUCCESS')

  return (
    <>
      <PageHeader
        title="End of Day Processing"
        subtitle="11-phase nightly batch — DPD, interest accrual, NACH, provisioning, regulatory reporting"
        breadcrumbs={[{ label: 'EOD' }]}
      />

      <Row gutter={[16, 16]}>

        {/* Left — Control Panel */}
        <Col xs={24} md={8}>
          <Card size="small" style={{ borderRadius: 10 }}>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Scheduled Run</div>
              <Space>
                <ClockCircleOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontWeight: 600 }}>Every day at 11:59 PM IST</span>
              </Space>
              {lastSuccess && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                  Last success:{' '}
                  <span style={{ fontWeight: 600, color: '#333' }}>
                    {dayjs(lastSuccess.runDate + 'Z').format('DD MMM YYYY, hh:mm A')}
                  </span>
                  {lastSuccess.durationSeconds && (
                    <span style={{ color: '#aaa' }}> ({lastSuccess.durationSeconds}s)</span>
                  )}
                </div>
              )}
            </div>

            <Divider style={{ margin: '10px 0' }} />

            {/* Current job status */}
            {jobStatus && jobStatus.status !== 'IDLE' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#888' }}>Current Job</span>
                  <Tag color={
                    jobStatus.status === 'RUNNING'   ? 'blue'    :
                    jobStatus.status === 'COMPLETED' ? 'success' : 'error'
                  }>
                    {jobStatus.status === 'RUNNING' && <SyncOutlined spin style={{ marginRight: 4 }} />}
                    {jobStatus.status}
                  </Tag>
                </div>
                {jobStatus.jobId && (
                  <div style={{ fontSize: 11, color: '#aaa' }}>Job ID: {jobStatus.jobId}</div>
                )}
                {isRunning && (
                  <div style={{ marginTop: 8 }}>
                    <Progress
                      percent={progressPct}
                      size="small"
                      status="active"
                      format={() => `${completedPhases}/${totalPhases}`}
                    />
                    <div style={{ fontSize: 11, color: '#1890ff', marginTop: 4 }}>
                      Phase {jobStatus.currentPhaseNumber} of {totalPhases} running...
                    </div>
                  </div>
                )}
                {jobStatus.status === 'COMPLETED' && (
                  <div style={{ marginTop: 6 }}>
                    <Progress percent={100} size="small" />
                    <div style={{ fontSize: 11, color: '#52c41a', marginTop: 4 }}>
                      Completed in {jobStatus.durationSeconds}s
                    </div>
                  </div>
                )}
                {jobStatus.status === 'FAILED' && jobStatus.error && (
                  <div style={{ fontSize: 11, color: '#f5222d', marginTop: 6 }}>{jobStatus.error}</div>
                )}
              </div>
            )}

            <Button
              type="primary"
              size="large"
              icon={isRunning ? <SyncOutlined spin /> : <PlayCircleOutlined />}
              loading={starting}
              disabled={isRunning}
              onClick={runEod}
              block
              style={{ height: 44, fontWeight: 600 }}
            >
              {isRunning ? 'EOD Running...' : 'Run EOD Now'}
            </Button>

            {isRunning && (
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#888' }}>
                You can browse other pages — EOD runs in the background
              </div>
            )}

            <Divider style={{ margin: '12px 0' }} />

            {/* Phase legend */}
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>11 Phases</div>
            {[
              { n: '1-2', label: 'Pre-EOD + Loan Processing' },
              { n: '3',   label: 'Interest Accrual' },
              { n: '4',   label: 'NACH Processing' },
              { n: '5',   label: 'Collections & Alerts' },
              { n: '6',   label: 'Provisioning & GL' },
              { n: '7-8', label: 'Regulatory + Reports' },
              { n: '9-10',label: 'Archival + Next Day Prep' },
              { n: '11',  label: 'Verification & Sign-off' },
            ].map(item => (
              <div key={item.n} style={{ fontSize: 11, color: '#666', marginBottom: 3 }}>
                <Tag style={{ fontSize: 10, margin: '0 6px 0 0' }}>{item.n}</Tag>{item.label}
              </div>
            ))}
          </Card>
        </Col>

        {/* Right — Phase Dashboard */}
        <Col xs={24} md={16}>
          <Card
            title={
              <Space>
                <span>EOD Phase Dashboard</span>
                {isRunning && <Badge status="processing" text={<span style={{ fontSize: 12, color: '#1890ff' }}>Live</span>} />}
              </Space>
            }
            size="small"
            style={{ borderRadius: 10 }}
          >
            {!jobStatus || jobStatus.status === 'IDLE' ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb' }}>
                <PlayCircleOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                <div>Click "Run EOD Now" to start processing</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(jobStatus.phases || []).map(phase => (
                  <PhaseCard key={phase.phaseNumber} phase={phase} />
                ))}
              </div>
            )}
          </Card>
        </Col>

      </Row>

      {/* History Table */}
      <Card title="EOD Run History" size="small" style={{ borderRadius: 10, marginTop: 16 }}>
        <Table
          dataSource={history}
          rowKey="id"
          size="small"
          loading={historyLoading}
          pagination={{ pageSize: 10, size: 'small' }}
          scroll={{ x: 900 }}
          locale={{ emptyText: 'No EOD runs recorded yet' }}
          columns={[
            {
              title: 'Job ID', dataIndex: 'jobId', key: 'jobId', width: 90,
              render: v => v ? <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span> : '—',
            },
            {
              title: 'Run Date', dataIndex: 'runDate', key: 'runDate', width: 160,
              render: v => v ? dayjs(v + 'Z').format('DD MMM YYYY, hh:mm A') : '—',
            },
            {
              title: 'Trigger', dataIndex: 'triggeredBy', key: 'triggeredBy', width: 100,
              render: v => <Tag color={v === 'SCHEDULER' ? 'blue' : 'purple'}>{v}</Tag>,
            },
            {
              title: 'Status', dataIndex: 'status', key: 'status', width: 90,
              render: v => <Tag color={v === 'SUCCESS' ? 'success' : v === 'RUNNING' ? 'blue' : 'error'}>{v}</Tag>,
            },
            { title: 'Duration', dataIndex: 'durationSeconds', key: 'dur', width: 80, align: 'center', render: v => v ? `${v}s` : '—' },
            { title: 'Loans', dataIndex: 'totalLoansProcessed', key: 'loans', align: 'center', width: 70 },
            { title: 'EMIs', dataIndex: 'totalEmisProcessed', key: 'emis', align: 'center', width: 70 },
            {
              title: 'Overdue', dataIndex: 'emisMarkedOverdue', key: 'overdue', align: 'center', width: 80,
              render: v => v > 0 ? <span style={{ color: '#fa8c16', fontWeight: 600 }}>{v}</span> : v,
            },
            {
              title: 'NPA', dataIndex: 'loansMarkedNpa', key: 'npa', align: 'center', width: 60,
              render: v => v > 0 ? <span style={{ color: '#f5222d', fontWeight: 600 }}>{v}</span> : v,
            },
            { title: 'NACH', dataIndex: 'nachProcessed', key: 'nach', align: 'center', width: 70 },
            {
              title: 'Provision', dataIndex: 'totalProvisionAmount', key: 'prov', align: 'center', width: 100,
              render: v => v ? `₹${Math.round(v).toLocaleString()}` : '—',
            },
            {
              title: 'Reconciled', dataIndex: 'reconciliationPassed', key: 'recon', align: 'center', width: 90,
              render: v => v === true ? <Tag color="success">Pass</Tag> : v === false ? <Tag color="error">Fail</Tag> : '—',
            },
            {
              title: 'Error', dataIndex: 'errorMessage', key: 'error',
              render: v => v ? <span style={{ color: '#f5222d', fontSize: 11 }}>{v}</span> : <span style={{ color: '#bbb' }}>—</span>,
            },
          ]}
        />
      </Card>
    </>
  )
}

export default EOD
