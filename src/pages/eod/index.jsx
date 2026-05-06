import { useState, useEffect, useRef } from 'react'
import {
  Row, Col, Card, Button, Tag, Space, Divider, Table, Progress, Statistic, Tooltip, Badge,
  Drawer, Timeline, Alert, Spin
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
  EyeOutlined,
  ExclamationCircleFilled,
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

const fmtTime = (dt) => dt ? dayjs(dt.includes('Z') ? dt : dt + 'Z').format('HH:mm:ss') : null
const fmtDuration = (s) => s == null ? null : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`

const PhaseCard = ({ phase }) => {
  const isRunning   = phase.status === 'RUNNING'
  const isCompleted = phase.status === 'COMPLETED'
  const isFailed    = phase.status === 'FAILED'
  const isPending   = phase.status === 'PENDING'

  const borderColor = STATUS_COLOR[phase.status] || '#d9d9d9'
  const startStr    = fmtTime(phase.startTime)
  const endStr      = fmtTime(phase.endTime)

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
          {/* Name + status + duration */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontWeight: 600, fontSize: 13,
              color: isRunning ? '#1890ff' : isFailed ? '#f5222d' : isCompleted ? '#389e0d' : '#888',
            }}>
              {phase.phaseName}
            </span>
            <Space size={4}>
              {isCompleted && phase.durationSeconds != null && (
                <Tag color="default" style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                  {fmtDuration(phase.durationSeconds)}
                </Tag>
              )}
              {isRunning   && <Tag color="blue"   style={{ margin: 0, fontSize: 11 }}>Running</Tag>}
              {isCompleted && <Tag color="success" style={{ margin: 0, fontSize: 11 }}>Done</Tag>}
              {isFailed    && <Tag color="error"   style={{ margin: 0, fontSize: 11 }}>Failed</Tag>}
              {isPending   && <Tag            style={{ margin: 0, fontSize: 11 }}>Pending</Tag>}
            </Space>
          </div>

          {/* Description */}
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{phase.description}</div>

          {/* Timing row */}
          {(isRunning || isCompleted || isFailed) && startStr && (
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
              {isRunning && (
                <span><ClockCircleOutlined style={{ marginRight: 4, color: '#1890ff' }} />Started at {startStr}</span>
              )}
              {(isCompleted || isFailed) && (
                <span style={{ fontFamily: 'monospace' }}>
                  {startStr}
                  {endStr && <> → {endStr}</>}
                </span>
              )}
            </div>
          )}

          {/* All metrics */}
          {isCompleted && phase.metrics && Object.keys(phase.metrics).length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Object.entries(phase.metrics)
                .filter(([key]) => !SKIP_METRIC_KEYS.has(key))
                .map(([key, val]) => (
                <Tooltip key={key} title={key}>
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

const SKIP_METRIC_KEYS = new Set(['statusDistribution', 'branchWiseLoans'])

const formatMetricKey = (key) => {
  const MAP = {
    // Phase 1 — Pre-EOD
    dbStatus: 'DB Status',
    totalLoansInDb: 'Total Loans',
    alreadyRanToday: 'Ran Today',
    cutoffTime: 'Cutoff Time',
    businessDate: 'Business Date',
    // Phase 2 — Loan Processing
    totalLoansProcessed: 'Loans',
    totalEmisProcessed: 'EMIs',
    emisMarkedOverdue: 'Overdue EMIs',
    emisAlreadyPaid: 'Paid EMIs',
    loansMarkedActive: 'Active',
    loansMarkedOverdue: 'Overdue',
    loansMarkedNpa: 'NPA',
    loansStayedDisbursed: 'Disbursed',
    penaltiesApplied: 'Penalties',
    // Phase 3 — Interest
    loansProcessed: 'Loans',
    totalDailyInterestAccrued: 'Interest Accrued',
    // Phase 4 — NACH
    mandatesPresented: 'Mandates',
    successCount: 'Success',
    bounceCount: 'Bounced',
    totalCollected: 'Collected',
    successRate: 'Success Rate',
    // Phase 5 — Collections
    totalOverdueLoans: 'Overdue Loans',
    bucket_1_30_days: '1-30 Days',
    bucket_31_60_days: '31-60 Days',
    bucket_61_90_days: '61-90 Days',
    bucket_above_90_days: '>90 Days',
    customersAlerted: 'Alerted',
    totalOverdueAmount: 'Overdue Amt',
    // Phase 6 — Provisioning
    loansProvisioned: 'Provisioned',
    totalProvisionAmount: 'Provision',
    standard: 'Standard',
    subStandard: 'Sub-Standard',
    doubtful1: 'Doubtful-1',
    doubtful2: 'Doubtful-2',
    loss: 'Loss',
    glEntriesGenerated: 'GL Entries',
    // Phase 7 — Regulatory
    reportDate: 'Report Date',
    totalLoans: 'Total Loans',
    npaLoans: 'NPA Loans',
    overdueLoans: 'Overdue Loans',
    activeLoans: 'Active Loans',
    totalOutstanding: 'Outstanding',
    npaOutstanding: 'NPA Outstanding',
    npaRatioPct: 'NPA%',
    rbiReportStatus: 'RBI Report',
    cibilRecordsQueued: 'CIBIL',
    cibilUploadStatus: 'CIBIL Status',
    // Phase 8 — Reports
    totalLoansInPortfolio: 'Portfolio',
    totalDisbursedAmount: 'Disbursed',
    totalOutstandingAmount: 'Outstanding',
    totalPenalties: 'Penalties',
    reportsGenerated: 'Reports',
    // Phase 9 — Archival
    archivableLoansIdentified: 'Archivable',
    archivalCutoffDate: 'Cutoff Date',
    tempRecordsPurged: 'Purged',
    archivalStatus: 'Archival',
    // Phase 10 — Next Day Prep
    emisDueTomorrow: 'Due Tomorrow',
    expectedCollectionAmount: 'Exp. Collection',
    nachMandatesToPresent: 'NACH Mandates',
    dateRolloverStatus: 'Rollover',
    // Phase 11 — Verification
    totalLoansVerified: 'Verified',
    totalOverdue: 'Overdue',
    closedLoans: 'Closed',
    invalidRecords: 'Invalid',
    reconciliationPassed: 'Reconciled',
    eodCompletionStatus: 'EOD Status',
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

const PHASE_STATUS_COLOR = {
  COMPLETED: 'green',
  FAILED: 'red',
  RUNNING: 'blue',
  PENDING: 'gray',
  SKIPPED: 'orange',
}

const JobDetailDrawer = ({ jobId, open, onClose }) => {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !jobId) return
    setDetail(null)
    setLoading(true)
    eodApi.getJobDetail(jobId)
      .then(res => setDetail(res.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, jobId])

  const failedPhase = detail?.phases?.find(p => p.status === 'FAILED')

  const timelineItems = (detail?.phases || []).map(p => {
    const isFailed = p.status === 'FAILED'
    const isCompleted = p.status === 'COMPLETED'
    const isPending = p.status === 'PENDING'

    return {
      color: PHASE_STATUS_COLOR[p.status] || 'gray',
      dot: isFailed
        ? <ExclamationCircleFilled style={{ fontSize: 16, color: '#f5222d' }} />
        : isCompleted
          ? <CheckCircleFilled style={{ fontSize: 14, color: '#52c41a' }} />
          : isPending
            ? <span style={{ width: 10, height: 10, display: 'inline-block', borderRadius: '50%', background: '#d9d9d9' }} />
            : undefined,
      children: (
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontWeight: 600,
              fontSize: 13,
              color: isFailed ? '#f5222d' : isCompleted ? '#389e0d' : '#888',
            }}>
              P{p.phaseNumber} — {p.phaseName}
            </span>
            <Space size={4}>
              {p.durationSeconds != null && isCompleted && (
                <Tag style={{ fontSize: 11, margin: 0 }}>{fmtDuration(p.durationSeconds)}</Tag>
              )}
              <Tag
                color={isFailed ? 'error' : isCompleted ? 'success' : isPending ? 'default' : 'processing'}
                style={{ fontSize: 11, margin: 0 }}
              >
                {p.status}
              </Tag>
            </Space>
          </div>

          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{p.description}</div>

          {(p.startTime || p.endTime) && (
            <div style={{ fontSize: 11, color: '#888', fontFamily: 'monospace', marginTop: 3 }}>
              {p.startTime && fmtTime(p.startTime)}
              {p.endTime && <> → {fmtTime(p.endTime)}</>}
            </div>
          )}

          {/* Metrics */}
          {isCompleted && p.metrics && Object.keys(p.metrics).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {Object.entries(p.metrics)
                .filter(([key]) => !SKIP_METRIC_KEYS.has(key))
                .map(([key, val]) => (
                <Tooltip key={key} title={key}>
                  <Tag style={{ fontSize: 11, margin: 0 }}>
                    {formatMetricKey(key)}: <b>{formatMetricVal(val)}</b>
                  </Tag>
                </Tooltip>
              ))}
            </div>
          )}

          {/* Error */}
          {isFailed && p.error && (
            <Alert
              type="error"
              showIcon
              message="Phase Failed"
              description={<span style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.error}</span>}
              style={{ marginTop: 8 }}
            />
          )}
        </div>
      ),
    }
  })

  return (
    <Drawer
      title={
        <Space>
          <span>EOD Job Detail</span>
          {jobId && <Tag style={{ fontFamily: 'monospace' }}>{jobId}</Tag>}
          {detail?.summary?.status && (
            <Tag color={
              detail.summary.status === 'SUCCESS' ? 'success' :
              detail.summary.status === 'FAILED' ? 'error' : 'processing'
            }>
              {detail.summary.status}
            </Tag>
          )}
        </Space>
      }
      open={open}
      onClose={onClose}
      width={600}
      destroyOnClose
    >
      {loading && <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>}

      {!loading && detail && (
        <>
          {/* Summary strip */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
            <Statistic title="Triggered By" value={detail.summary?.triggeredBy || '—'} valueStyle={{ fontSize: 14 }} />
            <Statistic
              title="Run Date"
              value={detail.summary?.runDate ? dayjs(detail.summary.runDate + 'Z').format('DD MMM YYYY, hh:mm A') : '—'}
              valueStyle={{ fontSize: 14 }}
            />
            <Statistic
              title="Duration"
              value={detail.summary?.durationSeconds != null ? fmtDuration(detail.summary.durationSeconds) : '—'}
              valueStyle={{ fontSize: 14 }}
            />
          </div>

          {/* Top-level error on failed jobs */}
          {detail.summary?.errorMessage && (
            <Alert
              type="error"
              showIcon
              message={`Job failed at Phase ${failedPhase ? failedPhase.phaseNumber + ' — ' + failedPhase.phaseName : ''}`}
              description={<span style={{ fontFamily: 'monospace', fontSize: 12 }}>{detail.summary.errorMessage}</span>}
              style={{ marginBottom: 16 }}
            />
          )}

          <Divider style={{ margin: '0 0 16px' }}>Phase Log</Divider>

          {detail.phases?.length > 0
            ? <Timeline items={timelineItems} />
            : <div style={{ color: '#aaa', textAlign: 'center', padding: 24 }}>No phase logs recorded for this job</div>
          }
        </>
      )}

      {!loading && !detail && (
        <div style={{ color: '#aaa', textAlign: 'center', padding: 48 }}>Failed to load job details</div>
      )}
    </Drawer>
  )
}

const EOD = () => {
  const [jobStatus, setJobStatus]       = useState(null)
  const [history, setHistory]           = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [starting, setStarting]         = useState(false)
  const [drawerJobId, setDrawerJobId]   = useState(null)
  const [pagination, setPagination]     = useState({ current: 1, pageSize: 10, total: 0 })
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
            setPagination(prev => ({ ...prev, current: 1 }))
            loadHistory(0, pagination.pageSize)
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

  const loadHistory = async (page = 0, size = 10) => {
    setHistoryLoading(true)
    try {
      const res = await eodApi.getHistory({ page, size })
      const paged = res.data?.data
      setHistory(paged?.content || [])
      setPagination(prev => ({ ...prev, total: paged?.totalElements || 0 }))
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
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
                    Job: <span style={{ fontFamily: 'monospace' }}>{jobStatus.jobId}</span>
                  </div>
                )}
                {jobStatus.startTime && (
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>
                    Started: <b>{dayjs(jobStatus.startTime.includes('Z') ? jobStatus.startTime : jobStatus.startTime + 'Z').format('hh:mm:ss A')}</b>
                  </div>
                )}
                {jobStatus.endTime && (
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                    Ended: <b>{dayjs(jobStatus.endTime.includes('Z') ? jobStatus.endTime : jobStatus.endTime + 'Z').format('hh:mm:ss A')}</b>
                  </div>
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
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            size: 'small',
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Total ${total} runs`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }))
              loadHistory(page - 1, pageSize)
            },
          }}
          scroll={{ x: 900 }}
          locale={{ emptyText: 'No EOD runs recorded yet' }}
          columns={[
            {
              title: 'Job ID', dataIndex: 'jobId', key: 'jobId', width: 90,
              render: v => v ? <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span> : '—',
            },
            {
              title: 'Started',
              key: 'runDate',
              width: 180,
              render: (_, row) => (
                <Space direction="vertical" size={0}>
                  <span>{row.runDate ? dayjs(row.runDate + 'Z').format('DD MMM YYYY') : '—'}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#666' }}>
                    {row.runDate ? dayjs(row.runDate + 'Z').format('hh:mm:ss A') : ''}
                    {row.completedAt ? <> → {dayjs(row.completedAt + 'Z').format('hh:mm:ss A')}</> : ''}
                  </span>
                </Space>
              ),
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
            {
              title: '', key: 'action', width: 60, fixed: 'right',
              render: (_, row) => (
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => setDrawerJobId(row.jobId)}
                />
              ),
            },
          ]}
        />
      </Card>

      <JobDetailDrawer
        jobId={drawerJobId}
        open={!!drawerJobId}
        onClose={() => setDrawerJobId(null)}
      />
    </>
  )
}

export default EOD
