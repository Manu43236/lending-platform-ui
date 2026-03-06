import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Tag, Space, Row, Col, Select, Button, Modal, Form, Upload } from 'antd'
import {
  SearchOutlined, CheckCircleFilled, ClockCircleFilled,
  FilePdfOutlined, FileImageOutlined, FileOutlined,
  UploadOutlined, PlusOutlined, CheckOutlined, CloseOutlined,
} from '@ant-design/icons'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { documentApi } from '../../api/documentApi'
import { loanApi } from '../../api/loanApi'
import { masterApi } from '../../api/masterApi'
import { formatDate } from '../../utils/formatters'
import { showError, showSuccess } from '../../utils/errorHandler'
import useAuthStore from '../../store/authStore'

const FileIcon = ({ type }) => {
  if (type?.includes('pdf'))   return <FilePdfOutlined   style={{ color: '#f5222d', fontSize: 15 }} />
  if (type?.includes('image')) return <FileImageOutlined style={{ color: '#1890ff', fontSize: 15 }} />
  return <FileOutlined style={{ color: '#888', fontSize: 15 }} />
}

const StatusTag = ({ status }) => {
  const map = {
    VERIFIED:             { color: '#389e0d', bg: '#f6ffed', label: 'Verified'   },
    PENDING_VERIFICATION: { color: '#d46b08', bg: '#fff7e6', label: 'Pending'    },
    REJECTED:             { color: '#cf1322', bg: '#fff1f0', label: 'Rejected'   },
    UPLOADED:             { color: '#096dd9', bg: '#e6f4ff', label: 'Uploaded'   },
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
  const { user } = useAuthStore()
  const [docs, setDocs]           = useState([])
  const [loans, setLoans]         = useState([])
  const [docTypes, setDocTypes]   = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 })
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState(null)

  // Upload modal
  const [uploadOpen, setUploadOpen]   = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [uploadForm]                  = Form.useForm()

  // Verify modal
  const [verifyDoc, setVerifyDoc]     = useState(null)   // doc being actioned
  const [verifyAction, setVerifyAction] = useState(null) // 'VERIFIED' | 'REJECTED'
  const [verifyForm]                  = Form.useForm()
  const [verifying, setVerifying]     = useState(false)

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

  useEffect(() => { fetchDocs(0, 10) }, [fetchDocs])

  // Load loans + doc types for upload modal
  useEffect(() => {
    loanApi.getAll({ page: 0, size: 500 })
      .then((r) => setLoans(r.data?.data?.content || []))
      .catch(() => {})
    masterApi.getDocumentTypes('LOAN')
      .then((r) => setDocTypes(r.data?.data || []))
      .catch(() => {})
  }, [])

  const handleUpload = async (values) => {
    const formData = new FormData()
    formData.append('loanNumber', values.loanNumber)
    formData.append('documentTypeCode', values.documentTypeCode)
    formData.append('file', values.file.file)
    formData.append('uploadedBy', user?.username || 'SYSTEM')
    setUploading(true)
    try {
      await documentApi.upload(formData)
      showSuccess('Document uploaded successfully.')
      setUploadOpen(false)
      uploadForm.resetFields()
      fetchDocs(0, 10)
    } catch (err) {
      showError(err, 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const openVerify = (doc, action, e) => {
    e.stopPropagation()
    setVerifyDoc(doc)
    setVerifyAction(action)
    verifyForm.resetFields()
  }

  const handleVerify = async (values) => {
    setVerifying(true)
    try {
      await documentApi.verify(verifyDoc.documentNumber, {
        verifiedBy: user?.username || 'SYSTEM',
        uploadStatus: verifyAction,
        verificationNotes: values.remarks || '',
      })
      showSuccess(`Document ${verifyAction === 'VERIFIED' ? 'verified' : 'rejected'} successfully.`)
      setVerifyDoc(null)
      fetchDocs(pagination.page, pagination.size)
    } catch (err) {
      showError(err, 'Action failed')
    } finally {
      setVerifying(false)
    }
  }

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
        ? <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#1B3A6B', fontWeight: 600 }}>{v}</span>
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
        ? <Space size={4}><CheckCircleFilled style={{ color: '#52c41a' }} /><span>{row.verifiedBy}</span></Space>
        : <Space size={4}><ClockCircleFilled style={{ color: '#faad14' }} /><span style={{ color: '#bbb' }}>Pending</span></Space>,
    },
    {
      title: 'Uploaded On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => formatDate(v),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, row) => (
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          {row.fileUrl && (
            <Button type="link" size="small" icon={<FileOutlined />}
              onClick={(e) => { e.stopPropagation(); window.open(row.fileUrl, '_blank') }}>
              View
            </Button>
          )}
          {['UPLOADED', 'PENDING_VERIFICATION'].includes(row.uploadStatus) && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={(e) => openVerify(row, 'VERIFIED', e)}>
                Verify
              </Button>
              <Button type="link" size="small" icon={<CloseOutlined />}
                danger
                onClick={(e) => openVerify(row, 'REJECTED', e)}>
                Reject
              </Button>
            </>
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
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>
            Upload Document
          </Button>
        }
      />

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Input
            placeholder="Search loan no., customer or doc type..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            allowClear value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={8} md={5}>
          <Select placeholder="Filter by status" allowClear style={{ width: '100%' }}
            value={statusFilter} onChange={(v) => setStatusFilter(v || null)}>
            <Select.Option value="UPLOADED">Uploaded</Select.Option>
            <Select.Option value="PENDING_VERIFICATION">Pending Verification</Select.Option>
            <Select.Option value="VERIFIED">Verified</Select.Option>
            <Select.Option value="REJECTED">Rejected</Select.Option>
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
        onRow={(row) => ({
          onClick: () => row.loanNumber && navigate('/los/applications/' + row.loanNumber + '?tab=documents'),
          style: { cursor: row.loanNumber ? 'pointer' : 'default' },
        })}
        scroll={{ x: 1000 }}
      />

      {/* Upload Document Modal */}
      <Modal
        title="Upload Document"
        open={uploadOpen}
        onCancel={() => { setUploadOpen(false); uploadForm.resetFields() }}
        onOk={() => uploadForm.submit()}
        okText="Upload"
        confirmLoading={uploading}
        width={480}
      >
        <Form form={uploadForm} layout="vertical" onFinish={handleUpload} style={{ marginTop: 16 }}>
          <Form.Item label="Loan" name="loanNumber" rules={[{ required: true, message: 'Select a loan' }]}>
            <Select
              showSearch
              placeholder="Select loan"
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {loans.map((l) => (
                <Select.Option key={l.loanNumber} value={l.loanNumber}
                  label={`${l.loanNumber} ${l.customerName}`}>
                  <Space direction="vertical" size={0}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.loanNumber}</span>
                    <span style={{ fontSize: 11, color: '#999' }}>{l.customerName}</span>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Document Type" name="documentTypeCode" rules={[{ required: true, message: 'Select document type' }]}>
            <Select placeholder="Select document type">
              {docTypes.map((d) => (
                <Select.Option key={d.code} value={d.code}>{d.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="File" name="file" rules={[{ required: true, message: 'Choose a file' }]}>
            <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.jpg,.jpeg,.png">
              <Button icon={<UploadOutlined />}>Choose File</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Verify / Reject Modal */}
      <Modal
        title={verifyAction === 'VERIFIED' ? 'Verify Document' : 'Reject Document'}
        open={!!verifyDoc}
        onCancel={() => setVerifyDoc(null)}
        onOk={() => verifyForm.submit()}
        okText={verifyAction === 'VERIFIED' ? 'Verify' : 'Reject'}
        okButtonProps={{ danger: verifyAction === 'REJECTED' }}
        confirmLoading={verifying}
        width={420}
      >
        {verifyDoc && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
            <span style={{ fontWeight: 500 }}>{verifyDoc.documentTypeName}</span>
            <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>{verifyDoc.fileName}</span>
          </div>
        )}
        <Form form={verifyForm} layout="vertical" onFinish={handleVerify}>
          <Form.Item label="Verification Notes" name="remarks">
            <Input.TextArea rows={3} placeholder="Optional notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default Documents
