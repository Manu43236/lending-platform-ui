import { useState, useEffect } from 'react'
import { Row, Col, Card, Button, DatePicker, Statistic, Progress, Space } from 'antd'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import { reportApi } from '../../api/reportApi'
import { formatCurrency } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'
import { exportToCsv } from '../../utils/csvExport'

const { RangePicker } = DatePicker

const CollectionReport = () => {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs(),
  ])

  const load = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return
    setLoading(true)
    try {
      const from = dateRange[0].format('YYYY-MM-DD')
      const to   = dateRange[1].format('YYYY-MM-DD')
      const res  = await reportApi.getCollection(from, to)
      setData(res.data?.data || null)
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const efficiency = data?.collectionEfficiency ?? 0

  const stats = data ? [
    { label: 'EMIs Due',        value: data.totalEmisDue,      color: '#1890ff' },
    { label: 'Collected',       value: data.emisCollected,     color: '#52c41a' },
    { label: 'Pending',         value: data.emisPending,       color: '#fa8c16' },
    { label: 'Overdue',         value: data.emisOverdue,       color: '#f5222d' },
  ] : []

  return (
    <>
      <PageHeader
        title="Collection Report"
        subtitle="EMI collections — paid, pending, overdue for selected period"
        breadcrumbs={[{ label: 'Reports' }, { label: 'Collection' }]}
        actions={[
          <Button key="export" icon={<DownloadOutlined />} disabled={!data}
            onClick={() => exportToCsv([data], 'collection-report')}>
            Export CSV
          </Button>,
        ]}
      />

      {/* Filters */}
      <Card size="small" style={{ borderRadius: 10, marginBottom: 16 }}>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD MMM YYYY"
            allowClear={false}
          />
          <Button type="primary" icon={<ReloadOutlined />} loading={loading} onClick={load}>
            Generate
          </Button>
        </Space>
      </Card>

      {/* Efficiency */}
      <Card size="small" style={{ borderRadius: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Collection Efficiency</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Progress
            percent={Math.min(efficiency, 100)}
            strokeColor={efficiency >= 90 ? '#52c41a' : efficiency >= 70 ? '#fa8c16' : '#f5222d'}
            style={{ flex: 1 }}
            format={(p) => `${efficiency}%`}
          />
        </div>
      </Card>

      {/* EMI counts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {stats.map((s) => (
          <Col key={s.label} xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
              <Statistic value={s.value ?? 0} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Amount summary */}
      {data && (
        <Row gutter={[16, 16]}>
          {[
            { label: 'Total Amount Due',       value: data.totalAmountDue,       color: '#1890ff' },
            { label: 'Total Amount Collected', value: data.totalAmountCollected, color: '#52c41a' },
          ].map((s) => (
            <Col key={s.label} xs={24} sm={12}>
              <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{formatCurrency(s.value)}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </>
  )
}

export default CollectionReport
