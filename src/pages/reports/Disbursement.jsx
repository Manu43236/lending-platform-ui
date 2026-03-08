import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Button, DatePicker, Space, Statistic } from 'antd'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import { reportApi } from '../../api/reportApi'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'
import { exportToCsv } from '../../utils/csvExport'

const { RangePicker } = DatePicker

const DisbursementReport = () => {
  const [data, setData]           = useState([])
  const [loading, setLoading]     = useState(false)
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
      const res  = await reportApi.getDisbursement(from, to)
      setData(res.data?.data || [])
    } catch (err) { showError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const totalDisbursed   = data.reduce((s, r) => s + (r.loanAmount || 0), 0)
  const totalProcessing  = data.reduce((s, r) => s + (r.processingFee || 0), 0)

  const columns = [
    {
      title: 'Disbursed Date',
      dataIndex: 'disbursedDate',
      key: 'disbursedDate',
      render: (v) => formatDateTime(v),
    },
    {
      title: 'Loan No.',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    { title: 'Customer',      dataIndex: 'customerName',   key: 'customerName' },
    { title: 'Cust No.',      dataIndex: 'customerNumber', key: 'customerNumber', render: (v) => <span style={{ fontSize: 11, color: '#888' }}>{v}</span> },
    { title: 'Loan Type',     dataIndex: 'loanType',       key: 'loanType' },
    {
      title: 'Loan Amount',
      dataIndex: 'loanAmount',
      key: 'loanAmount',
      align: 'right',
      render: (v) => formatCurrency(v),
    },
    {
      title: 'Processing Fee',
      dataIndex: 'processingFee',
      key: 'processingFee',
      align: 'right',
      render: (v) => formatCurrency(v),
    },
    { title: 'Rate (%)',   dataIndex: 'interestRate',  key: 'interestRate',  align: 'center', render: (v) => `${v}%` },
    { title: 'Tenure',    dataIndex: 'tenureMonths',   key: 'tenureMonths',  align: 'center', render: (v) => `${v} Mo` },
    {
      title: 'EMI / Month',
      dataIndex: 'emiAmount',
      key: 'emiAmount',
      align: 'right',
      render: (v) => formatCurrency(v),
    },
  ]

  return (
    <>
      <PageHeader
        title="Disbursement Report"
        subtitle="Loans disbursed in the selected period"
        breadcrumbs={[{ label: 'Reports' }, { label: 'Disbursement' }]}
        actions={[
          <Button key="export" icon={<DownloadOutlined />} disabled={data.length === 0}
            onClick={() => exportToCsv(data, 'disbursement-report')}>
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

      {/* Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { label: 'Loans Disbursed',    value: data.length,         color: '#1890ff', isNum: true },
          { label: 'Total Disbursed',    value: formatCurrency(totalDisbursed),   color: '#722ed1' },
          { label: 'Total Processing Fee', value: formatCurrency(totalProcessing), color: '#fa8c16' },
        ].map((s) => (
          <Col key={s.label} xs={12} sm={8}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
              {s.isNum
                ? <Statistic value={s.value} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />
                : <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>}
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card size="small" style={{ borderRadius: 10 }}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="loanNumber"
          size="small"
          loading={loading}
          pagination={{ pageSize: 10, size: 'small' }}
          locale={{ emptyText: 'No disbursements in selected period' }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </>
  )
}

export default DisbursementReport
