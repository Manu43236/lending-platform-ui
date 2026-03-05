import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Tag, Space, Tooltip, Button, Row, Col, Select } from 'antd'
import { SearchOutlined, EyeOutlined, FilePdfOutlined, FileImageOutlined, FileOutlined, CheckCircleFilled, ClockCircleFilled } from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { documentApi } from '../../api/documentApi'
import { formatDate } from '../../utils/formatters'
import { showError } from '../../utils/errorHandler'

const { Option } = Select

const FileIcon = ({ type }) => {
  if (type?.includes('pdf'))   return <FilePdfOutlined   style={{ color: '#f5222d', fontSize: 16 }} />
  if (type?.includes('image')) return <FileImageOutlined style={{ color: '#1890ff', fontSize: 16 }} />
  return <FileOutlined style={{ color: '#888', fontSize: 16 }} />
}

const StatusTag = ({ status }) => {
  const map = {
    VERIFIED:  { color: '#389e0d', bg: '#f6ffed', label: 'Verified'  },
    PENDING:   { color: '#d46b08', bg: '#fff7e6', label: 'Pending'   },
    REJECTED:  { color: '#cf1322', bg: '#fff1f0', label: 'Rejected'  },
    UPLOADED:  { color: '#096dd9', bg: '#e6f4ff', label: 'Uploaded'  },
  }
  const s = map[status] || { color: '#666', bg: '#f5f5f5', label: status }
  return (
    <Tag style={{ color: s.color, background: s.bg, border: 'none', fontWeight: 600, fontSize: 11 }}>
      {s.label}
    </Tag>
  )
}

const Documents = () => {
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)

  const fetchDocs = useCallback(async (page = 0, size = 10) => {
    setLoading(true)
    try {
      const res = await documentApi.getAll({ page, size })
      const data = res.data?.data
      setDocs(data?.content || [])
      setPagination({ page: data?.page ?? 0, size: data?.size ?? size, totalElements: data?.totalElements ?? 0 })
    } catch (err) {
      showError(err, 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs(0, 10) }, []) // eslint-disable-line

  const filtered = docs.filter((d) => {
    const matchSearch = !search || (
      d.loanNumber?.toLowerCase().includes(search.toLowerCase()) ||
      d.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      d.documentTypeName?.toLowerCase().includes(search.toLowerCase())
    )
    const matchStatus = !statusFilter || d.uploadStatus === statusFilter
    return matchSearch && matchStatus
  })

  const columns = [
    {
      title: 'Doc No.',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      width: 160,
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#1B3A6B' }}>{v}</span>
      ),
    },
    {
      title: 'Document',
      key: 'doc',
      render: (_, row) => (
        <Space>
          <FileIcon type={row.fileType} />
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 500 }}>{row.documentTypeName || '—'}</span>
            <span style={{ fontSize: 11, color: '#999' }}>{row.fileName}</span>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{row.customerName || '—'}</span>
          <span style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>{row.customerNumber}</span>
        </Space>
      ),
    },
    {
      title: 'Loan No.',
      dataIndex: 'loanNumber',
      key: 'loanNumber',
      render: (v) => v
        ? <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#1B3A6B' }}>{v}</span>
        : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Status',
      dataIndex: 'uploadStatus',
      key: 'uploadStatus',
      render: (v) => <StatusTag status={v} />,
    },
    {
      title: 'Verified By',
      key: 'verifiedBy',
      render: (_, row) => row.verifiedBy
        ? <Space>
            <CheckCircleFilled style={{ color: '#52c41a' }} />
            <span>{row.verifiedBy}</span>
          </Space>
        : <Space>
            <ClockCircleFilled style={{ color: '#faad14' }} />
            <span style={{ color: '#bbb' }}>Pending</span>
          </Space>,
    },
    {
      title: 'Uploaded On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => formatDate(v),
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      fixed: 'right',
      render: (_, row) => (
        <Space>
          {row.fileUrl && (
            <Tooltip title="View File">
              <Button type="text" size="small" icon={<FileOutlined />}
                onClick={(e) => { e.stopPropagation(); window.open(row.fileUrl, '_blank') }} />
            </Tooltip>
          )}
          {row.loanNumber && (
            <Tooltip title="View Loan">
              <Button type="text" size="small" icon={<EyeOutlined />}
                onClick={(e) => { e.stopPropagation(); navigate('/los/applications/' + row.loanNumber) }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="All uploaded documents — KYC, loan documents, verification status"
        breadcrumbs={[{ label: 'LOS' }, { label: 'Documents' }]}
      />

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={10} md={7}>
          <Input
            placeholder="Search loan no., customer or doc type..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            allowClear value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select placeholder="Status" allowClear style={{ width: '100%' }}
            value={statusFilter} onChange={setStatusFilter}>
            {['UPLOADED', 'PENDING', 'VERIFIED', 'REJECTED'].map((s) => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      <DataTable
        columns={columns}
        dataSource={filtered}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onPageChange={(page, size) => fetchDocs(page, size)}
        scroll={{ x: 1000 }}
      />
    </>
  )
}

export default Documents
